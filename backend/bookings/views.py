import logging

from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, Receipt
from .serializers import (
    BookingCalculationSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    CreateBookingSerializer,
)
from .services import (
    AvailabilityService,
    ReceiptGeneratorService,
    RentCalculationService,
)

logger = logging.getLogger("hsm")


class BookingCalculateView(APIView):
    """Public: Calculate booking cost"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = BookingCalculationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            result = RentCalculationService.calculate(
                d["premise_id"], d["slot_id"], d["start_date"], d["end_date"]
            )
            return Response({"success": True, "data": result})
        except Exception as e:
            logger.error(f"Calculation error: {e}")
            return Response({"success": False, "message": str(e)}, status=400)


class BookedDatesView(APIView):
    """Public: Get booked dates for a premise/slot"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        premise_id = request.query_params.get("premise_id")
        slot_id = request.query_params.get("slot_id")
        if not premise_id:
            return Response({"message": "premise_id required"}, status=400)

        dates = AvailabilityService.get_booked_dates(premise_id, slot_id)
        return Response({"success": True, "data": dates})


class CreateBookingView(APIView):
    """Public: Create a new booking"""

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            # Calculate financials
            calc = RentCalculationService.calculate(
                d["premise_id"], d["slot_id"], d["start_date"], d["end_date"]
            )

            applicant = d["applicant"]
            bank = d["bank_details"]

            booking = Booking.objects.create(
                premise_id=d["premise_id"],
                slot_id=d["slot_id"],
                start_date=d["start_date"],
                end_date=d["end_date"],
                total_days=calc["total_days"],
                applicant_name=applicant["name"],
                applicant_address=applicant["address"],
                mobile=applicant["mobile"],
                alt_mobile=applicant.get("alt_mobile", ""),
                email=applicant["email"],
                function_name=applicant["function_name"],
                function_type=applicant["function_type"],
                guest_count=applicant["guest_count"],
                additional_details=applicant.get("details", ""),
                id_proof_type=applicant["id_proof_type"]
                .lower()
                .replace(" ", "_")
                .replace("_card", ""),
                bank_name=bank["bank_name"],
                account_holder=bank["account_holder"],
                account_number_encrypted=bank["account_number"],  # TODO: Encrypt this
                ifsc=bank["ifsc"],
                branch=bank["branch"],
                micr=bank.get("micr", ""),
                base_rent=calc["base_rent"],
                slot_charges=calc["slot_charges"],
                holiday_charges=calc["holiday_charges"],
                security_deposit=calc["security_deposit"],
                subtotal=calc["subtotal"],
                cgst=calc["cgst"],
                sgst=calc["sgst"],
                total_payable=calc["total_payable"],
                payment_mode=d["payment_mode"],
            )

            logger.info(f"New booking created: {booking.booking_id}")

            return Response(
                {
                    "success": True,
                    "bookingId": booking.booking_id,
                    "message": "Booking submitted successfully. Awaiting admin approval.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Booking creation error: {e}", exc_info=True)
            return Response(
                {"success": False, "message": "Booking failed. Please try again."},
                status=500,
            )


class BookingLookupView(APIView):
    """Public: Lookup booking by ID or mobile"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"message": "Query required"}, status=400)

        try:
            booking = Booking.objects.get(Q(booking_id=query) | Q(mobile=query))
            return Response(
                {"success": True, "data": BookingDetailSerializer(booking).data}
            )
        except Booking.DoesNotExist:
            return Response(
                {"success": False, "message": "No booking found."}, status=404
            )
        except Booking.MultipleObjectsReturned:
            bookings = Booking.objects.filter(mobile=query).order_by("-created_at")
            return Response(
                {
                    "success": True,
                    "data": BookingListSerializer(bookings, many=True).data,
                }
            )


class ReceiptDownloadView(APIView):
    """Public: Download booking receipt PDF"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id, status="approved")
            pdf_buffer = ReceiptGeneratorService.generate_pdf(booking)
            response = HttpResponse(pdf_buffer, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="Receipt_{booking_id}.pdf"'
            )
            return response
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found or not approved."}, status=404
            )


# Admin Views


class AdminBookingListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "payment_status", "premise"]
    search_fields = ["booking_id", "applicant_name", "mobile", "email"]
    ordering_fields = ["created_at", "start_date", "total_payable"]

    def get_queryset(self):
        return (
            Booking.objects.all()
            .select_related("premise", "slot")
            .order_by("-created_at")
        )


class AdminBookingDetailView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "booking_id"


class AdminBookingApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            if booking.status != "pending":
                return Response(
                    {"message": f"Cannot approve. Status: {booking.status}"}, status=400
                )

            booking.status = "approved"
            booking.approved_by = request.user
            booking.approved_at = timezone.now()
            booking.save()

            # Send SMS with payment link
            try:
                from sms_api.sms_service import send_sms
                from django.conf import settings
                payment_link = f"http://localhost:4200/booking?bookingId={booking.booking_id}"
                sms_msg = (
                    f"Dear {booking.applicant_name}, your booking {booking.booking_id} "
                    f"at Hutatma Smruti Mandir is approved. "
                    f"Please complete payment: {payment_link} -SMC Solapur"
                )
                result = send_sms(sms_msg, str(booking.mobile))
                logger.info(f"SMS result for {booking_id}: {result}")
            except Exception as e:
                logger.error(f"SMS failed for {booking_id}: {e}")

            logger.info(f"Booking {booking_id} approved by {request.user.email}")
            return Response({"success": True, "message": "Booking approved."})
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)


class AdminBookingRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            reason = request.data.get("reason", "")
            booking.status = "rejected"
            booking.rejection_reason = reason
            booking.save()

            logger.info(f"Booking {booking_id} rejected by {request.user.email}")
            return Response({"success": True, "message": "Booking rejected."})
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)


class AdminDuplicateReceiptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            pdf_buffer = ReceiptGeneratorService.generate_pdf(booking)
            response = HttpResponse(pdf_buffer, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="DuplicateReceipt_{booking_id}.pdf"'
            )
            return response
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)
