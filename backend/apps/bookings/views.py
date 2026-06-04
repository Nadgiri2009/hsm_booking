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

from .models import Booking, BookingAuditLog
from .serializers import (
    BOOKING_CONFLICT_MESSAGE,
    BookingListSerializer,
    BookingSerializer,
    CalculationSerializer,
)

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
                "total_days": days,
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

        payment_link = request.build_absolute_uri(f"/booking?bookingId={booking.booking_id}")
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


# Removed accidental duplicate subclass definition of `BookingViewSet`.
