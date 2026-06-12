import decimal
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.premises.models import Holiday, Premise, TimeSlot

from .models import Booking, BookingAuditLog, Addon, BookingAddon
from .serializers import (
    BOOKING_CONFLICT_MESSAGE,
    BookingListSerializer,
    BookingSerializer,
    CalculationSerializer,
)
from .serializers import AddonSerializer
import csv
from django.http import HttpResponse
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from .models import AuditLog

ACTIVE_SLOT_STATUSES = [
    "pending_approval",
    "awaiting_payment",
    "confirmed",
    # Legacy states.
    "pending",
    "approved",
]


def audit_booking(
    booking,
    action,
    from_status="",
    from_payment_status="",
    remarks="",
    changed_by=None,
):
    BookingAuditLog.objects.create(
        booking=booking,
        from_status=from_status or "",
        to_status=booking.status,
        from_payment_status=from_payment_status or "",
        to_payment_status=booking.payment_status,
        action=action,
        remarks=remarks or "",
        changed_by=changed_by if getattr(changed_by, "is_authenticated", False) else None,
    )


def slot_conflict_queryset(premise_id, slot_id, from_date, to_date):
    return Booking.objects.filter(
        premise_id=premise_id,
        slot_id=slot_id,
        from_date__lte=to_date,
        to_date__gte=from_date,
    ).filter(
        Q(status__in=ACTIVE_SLOT_STATUSES)
        | Q(status="rejected", rejected_at__gt=timezone.now() - timedelta(minutes=10))
    )


def send_booking_message(booking, message):
    try:
        from sms_api.sms_service import send_sms

        if booking.mobile:
            send_sms(message, str(booking.mobile))
    except Exception:
        pass

    try:
        if booking.email:
            send_mail(
                "HSM venue booking update",
                message,
                None,
                [booking.email],
                fail_silently=True,
            )
    except Exception:
        pass


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("premise", "slot").order_by("-created_at")
    serializer_class = BookingSerializer

    def get_permissions(self):
        if self.action in [
            "create",
            "retrieve",
            "calculate",
            "availability",
            "availability_range",
            "lookup",
            "receipt",
        ]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return BookingListSerializer
        return BookingSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            booking = serializer.save(
                status="pending_approval",
                payment_status="pending",
                slot_locked_until=timezone.now() + timedelta(minutes=10),
            )
            audit_booking(booking, "created_pending_approval")
        return booking

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def availability(self, request):
        premise_id = request.query_params.get("premise_id")
        date_str = request.query_params.get("date")
        if not premise_id or not date_str:
            return Response({"error": "premise_id and date required"}, status=400)
        booked = Booking.objects.filter(
            premise_id=premise_id,
            from_date__lte=date_str,
            to_date__gte=date_str,
        ).filter(
            Q(status__in=ACTIVE_SLOT_STATUSES)
            | Q(status="rejected", rejected_at__gt=timezone.now() - timedelta(minutes=10))
        ).values_list("slot_id", flat=True)
        booked_slot_ids = list(set(booked))
        slots = TimeSlot.objects.filter(premise_id=premise_id, is_active=True)
        available_slots = [
            {
                "id": s.id,
                "name": s.name,
                "start_time": str(s.start_time),
                "end_time": str(s.end_time),
                "multiplier": str(s.multiplier),
            }
            for s in slots
            if s.id not in booked_slot_ids
        ]
        return Response(
            {
                "date": date_str,
                "premise_id": int(premise_id),
                "booked_slots": booked_slot_ids,
                "available_slots": available_slots,
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def availability_range(self, request):
        """Return session-wise availability for each date in the range.

        Query params: premise_id, from_date, to_date, optional slot_id
        """
        premise_id = request.query_params.get("premise_id")
        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        slot_id = request.query_params.get("slot_id")
        if not premise_id or not from_date or not to_date:
            return Response({"error": "premise_id, from_date and to_date required"}, status=400)

        try:
            premise = Premise.objects.get(id=premise_id)
        except Premise.DoesNotExist:
            return Response({"error": "Premise not found"}, status=404)

        # load active slots for premise
        slots = list(TimeSlot.objects.filter(premise=premise, is_active=True).order_by('id'))

        # fetch bookings overlapping range
        bookings = Booking.objects.filter(
            premise=premise,
            from_date__lte=to_date,
            to_date__gte=from_date,
        ).filter(
            Q(status__in=ACTIVE_SLOT_STATUSES)
            | Q(status="rejected", rejected_at__gt=timezone.now() - timedelta(minutes=10))
        ).select_related('slot')

        # build per-date map
        start = from_date
        from datetime import datetime, timedelta as _td

        try:
            start_dt = datetime.strptime(from_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(to_date, "%Y-%m-%d").date()
        except Exception:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        delta = (end_dt - start_dt).days
        result = {}
        for i in range(delta + 1):
            d = start_dt + _td(days=i)
            date_str = d.isoformat()
            # bookings for this date
            day_bookings = [b for b in bookings if b.from_date <= d <= b.to_date]
            booked_slot_ids = set(b.slot_id for b in day_bookings)
            slots_status = {}
            for s in slots:
                slots_status[str(s.id)] = "booked" if s.id in booked_slot_ids else "available"

            # detect full day booking heuristically by slot name containing 'full'
            full_booked = False
            for b in day_bookings:
                if "full" in (b.slot.name or "").lower():
                    full_booked = True
                    break

            conflicts = []
            if full_booked:
                conflicts.append("Full Day booking already exists for the selected date.")

            # determine summary status
            if all(v == "booked" for v in slots_status.values()):
                summary = "unavailable"
            elif any(v == "booked" for v in slots_status.values()):
                summary = "partial"
            else:
                summary = "available"

            result[date_str] = {
                "slots": slots_status,
                "conflicts": conflicts,
                "summary": summary,
            }

        # If slot_id provided, compute conflicting dates for that slot specifically
        conflicting_dates = []
        if slot_id:
            for date_str, data in result.items():
                if str(slot_id) in data["slots"] and data["slots"][str(slot_id)] == "booked":
                    conflicting_dates.append(date_str)

        return Response({"premise_id": premise.id, "dates": result, "conflicting_dates": conflicting_dates})

    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def calculate(self, request):
        ser = CalculationSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        data = ser.validated_data
        try:
            premise = Premise.objects.get(id=data["premise_id"])
            slot = TimeSlot.objects.get(id=data["slot_id"])
        except (Premise.DoesNotExist, TimeSlot.DoesNotExist):
            return Response({"error": "Premise or slot not found"}, status=404)

        from_date = data["from_date"]
        to_date = data["to_date"]
        has_conflict = slot_conflict_queryset(
            premise_id=premise.id,
            slot_id=slot.id,
            from_date=from_date,
            to_date=to_date,
        ).exists()
        if has_conflict:
            return Response({"error": BOOKING_CONFLICT_MESSAGE}, status=400)

        days = (to_date - from_date).days + 1

        holidays = Holiday.objects.filter(date__range=[from_date, to_date])
        holiday_dates = set(h.date for h in holidays)
        base = float(premise.base_rent) * days * float(slot.multiplier)
        holiday_charges = sum(
            float(premise.base_rent)
            * float(slot.multiplier)
            * (float(h.charge_multiplier) - 1)
            for h in holidays
        )
        deposit = float(premise.security_deposit)
        cgst = base * settings.CGST_RATE
        sgst = base * settings.SGST_RATE

        return Response(
            {
                "premise": {"id": premise.id, "name": premise.name},
                "dates": [
                    (from_date + timedelta(days=i)).isoformat() for i in range(days)
                ],
                "total_days": days,
                "slot": {"id": slot.id, "name": slot.name},
                "base_rent": round(base, 2),
                "holiday_charges": round(holiday_charges, 2),
                "security_deposit": round(deposit, 2),
                "cgst": round(cgst, 2),
                "sgst": round(sgst, 2),
                "total_payable": round(
                    base + holiday_charges + deposit + cgst + sgst, 2
                ),
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def lookup(self, request):
        query = request.query_params.get("query", "").strip()
        if not query:
            return Response({"error": "query required"}, status=400)
        bookings = Booking.objects.filter(
            Q(booking_id=query)
            | Q(temp_booking_id=query)
            | Q(final_booking_id=query)
            | Q(mobile=query)
        )
        return Response(BookingListSerializer(bookings, many=True).data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ["pending_approval", "pending"]:
            return Response(
                {"error": "Only pending approval bookings can be approved"}, status=400
            )

        old_status = booking.status
        old_payment_status = booking.payment_status
        booking.status = "awaiting_payment"
        booking.payment_status = "pending"
        booking.approved_at = timezone.now()
        booking.approved_by = request.user
        booking.admin_remarks = request.data.get("remarks", "")
        booking.save()
        audit_booking(
            booking,
            "approved_awaiting_payment",
            old_status,
            old_payment_status,
            booking.admin_remarks,
            request.user,
        )

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200')
        payment_link = f"{frontend_url}/booking?bookingId={booking.booking_id}"
        send_booking_message(
            booking,
            (
                f"Your HSM booking {booking.booking_id} is approved. "
                f"Please complete payment here: {payment_link}"
            ),
        )
        return Response(
            {
                "message": "Booking approved and awaiting payment",
                "temp_booking_id": booking.temp_booking_id,
                "booking_id": booking.booking_id,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "payment_link": payment_link,
            }
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def reject(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in ["pending_approval", "awaiting_payment", "pending", "approved"]:
            return Response({"error": "Booking cannot be rejected in this status"}, status=400)

        reason = request.data.get("reason") or request.data.get("remarks") or ""
        if not reason:
            return Response({"error": "Rejection reason is required"}, status=400)

        old_status = booking.status
        old_payment_status = booking.payment_status
        booking.status = "rejected"
        booking.rejection_reason = reason
        booking.admin_remarks = reason
        booking.rejected_at = timezone.now()
        booking.slot_locked_until = booking.rejected_at + timedelta(minutes=10)
        booking.save()
        audit_booking(
            booking,
            "rejected",
            old_status,
            old_payment_status,
            reason,
            request.user,
        )
        send_booking_message(
            booking,
            (
                f"Your HSM booking {booking.booking_id} was rejected. "
                f"Reason: {reason}"
            ),
        )
        return Response(
            {
                "message": "Booking rejected",
                "release_at": booking.slot_locked_until,
            }
        )

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def receipt(self, request, pk=None):
        if str(pk).isdigit():
            booking = Booking.objects.filter(id=int(pk)).first()
            if not booking:
                booking = Booking.objects.filter(booking_id=pk).first()
        else:
            booking = Booking.objects.filter(
                Q(booking_id=pk) | Q(temp_booking_id=pk) | Q(final_booking_id=pk)
            ).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)
        if booking.status != "confirmed" or booking.payment_status != "paid":
            return Response(
                {"error": "Receipt is available only after successful payment"},
                status=400,
            )
        if not hasattr(booking, "receipt"):
            return Response({"error": "Receipt not generated"}, status=404)
        from utils.pdf_generator import generate_receipt_pdf

        pdf_buffer = generate_receipt_pdf(booking)
        from django.http import HttpResponse

        response = HttpResponse(pdf_buffer, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="Receipt_{booking.booking_id}.pdf"'
        )
        return response

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def audit_logs(self, request):
        """Return audit logs with optional filters: from_date, to_date, username, action"""
        qs = AuditLog.objects.all().order_by('-created_at')
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        username = request.query_params.get('username')
        action = request.query_params.get('action')
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        if username:
            qs = qs.filter(username__icontains=username)
        if action:
            qs = qs.filter(action__icontains=action)

        data = [
            {
                'id': a.id,
                'username': a.username,
                'role': a.role,
                'action': a.action,
                'entity': a.entity,
                'entity_id': a.entity_id,
                'ip_address': a.ip_address,
                'remarks': a.remarks,
                'created_at': a.created_at,
            }
            for a in qs[:1000]
        ]
        return Response(data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def reports(self, request):
        """Return aggregated booking statistics and top items."""
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        premise_id = request.query_params.get('premise_id')

        qs = Booking.objects.all()
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        if premise_id:
            qs = qs.filter(premise_id=premise_id)

        total_bookings = qs.count()
        successful_payments = qs.filter(payment_status='paid').count()
        pending_payments = qs.filter(payment_status='pending').count()
        failed_payments = qs.filter(payment_status='failed').count()
        revenue_collected = qs.filter(payment_status='paid').aggregate(total=Sum('total_payable'))['total'] or 0

        # Most booked premise
        top_premise = (
            qs.values('premise__name')
            .annotate(cnt=Count('id'))
            .order_by('-cnt')
            .first()
        )

        # Bookings by month
        monthly = (
            qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        return Response(
            {
                'total_bookings': total_bookings,
                'successful_payments': successful_payments,
                'pending_payments': pending_payments,
                'failed_payments': failed_payments,
                'revenue_collected': float(revenue_collected),
                'most_booked_premise': top_premise,
                'monthly': list(monthly),
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def export(self, request):
        """Export bookings CSV filtered by query params."""
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        premise_id = request.query_params.get('premise_id')
        payment_status = request.query_params.get('payment_status')

        qs = Booking.objects.select_related('premise', 'slot').all().order_by('-created_at')
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        if premise_id:
            qs = qs.filter(premise_id=premise_id)
        if payment_status:
            qs = qs.filter(payment_status=payment_status)

        # CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="bookings_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['Booking ID','Applicant Name','Premise','Booking From','Booking To','Session','Amount','Payment Status','Created At'])
        for b in qs:
            writer.writerow([
                b.booking_id,
                b.full_name,
                b.premise.name if b.premise else '',
                b.from_date,
                b.to_date,
                b.slot.name if b.slot else '',
                float(b.total_payable),
                b.payment_status,
                b.created_at,
            ])
        return response


# Removed accidental duplicate subclass definition of `BookingViewSet`.


    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated], url_path="addons")
    def addons(self, request, pk=None):
        """Attach addons to an existing booking. Expects payload: { "addons": [{"addon": <id>, "quantity": <int>} ...] }

        Amounts are computed server-side from `Addon.unit_charge`.
        """
        booking = Booking.objects.filter(pk=pk).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        data = request.data if isinstance(request.data, list) else request.data.get("addons", [])
        from .serializers import BookingAddonSerializer

        created_objs = []
        for item in data:
            serializer = BookingAddonSerializer(data=item)
            serializer.is_valid(raise_exception=True)
            addon = serializer.validated_data["addon"]
            quantity = serializer.validated_data.get("quantity", 1)
            amount = decimal.Decimal(addon.unit_charge) * decimal.Decimal(quantity)
            ba = serializer.save(booking=booking, amount=amount)
            created_objs.append(ba)

        # recompute total from DB to avoid float/string issues
        total = (
            BookingAddon.objects.filter(booking=booking).aggregate(total=Sum("amount"))[
                "total"
            ]
            or decimal.Decimal("0")
        )
        booking.addons_total = total
        booking.save(update_fields=["addons_total"]) 

        return Response(
            BookingAddonSerializer(created_objs, many=True).data, status=status.HTTP_201_CREATED
        )


class AddonListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        addons = Addon.objects.filter(is_active=True).order_by("name")
        return Response(AddonSerializer(addons, many=True).data)
