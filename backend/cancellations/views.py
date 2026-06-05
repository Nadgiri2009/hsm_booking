import logging
from datetime import timedelta

from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from bookings.services import RefundCalculationService

from .models import Cancellation

logger = logging.getLogger("hsm")


class CancellationSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source="booking.booking_id", read_only=True)

    class Meta:
        model = Cancellation
        fields = "__all__"


class CancellationRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        reason = request.data.get("reason")
        otp = request.data.get("otp")

        try:
            booking = Booking.objects.get(booking_id=booking_id, status__in=["approved", "confirmed", "awaiting_payment"])
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found or not eligible for cancellation."},
                status=404,
            )

        if Cancellation.objects.filter(booking=booking).exists():
            return Response({"message": "Cancellation already requested."}, status=400)

        if not otp:
            # Step 1: Send OTP
            otp_code = get_random_string(6, "0123456789")
            expires = timezone.now() + timedelta(minutes=10)

            cancellation = Cancellation.objects.create(
                booking=booking,
                reason=reason,
                otp=otp_code,
                otp_expires_at=expires,
            )

            # TODO: Send OTP via SMS to booking.mobile
            
            logger.info(f"Cancellation OTP sent for {booking_id}: {otp_code}")
            return Response(
                {"success": True, "message": "OTP sent to registered mobile number."}
            )

        else:
            # Step 2: Verify OTP and process
            try:
                cancellation = Cancellation.objects.get(booking=booking)
                if cancellation.otp != otp:
                    return Response({"message": "Invalid OTP."}, status=400)
                if timezone.now() > cancellation.otp_expires_at:
                    return Response(
                        {"message": "OTP expired. Please request again."}, status=400
                    )

                refund_info = RefundCalculationService.calculate_refund(booking)
                cancellation.otp_verified = True
                cancellation.status = "otp_verified"
                cancellation.refund_amount = refund_info["refund_amount"]
                cancellation.refund_percentage = refund_info["refund_percentage"]
                cancellation.save()

                return Response(
                    {
                        "success": True,
                        "message": "OTP verified. Cancellation request submitted for admin approval.",
                        "refund_info": refund_info,
                    }
                )
            except Cancellation.DoesNotExist:
                return Response(
                    {"message": "No pending cancellation found."}, status=400
                )


class AdminCancellationListView(generics.ListAPIView):
    queryset = Cancellation.objects.all().select_related("booking", "booking__premise")
    serializer_class = CancellationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "refund_status"]
    search_fields = [
        "booking__booking_id",
        "booking__applicant_name",
        "booking__mobile",
    ]


class AdminCancellationApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            cancellation = Cancellation.objects.get(pk=pk)
            cancellation.status = "approved"
            cancellation.reviewed_by = request.user
            cancellation.reviewed_at = timezone.now()
            cancellation.save()

            booking = cancellation.booking
            booking.status = "cancelled"
            booking.save()

            return Response(
                {
                    "success": True,
                    "message": "Cancellation approved. Refund will be processed.",
                }
            )
        except Cancellation.DoesNotExist:
            return Response({"message": "Cancellation not found."}, status=404)


class AdminCancellationRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            cancellation = Cancellation.objects.get(pk=pk)
            cancellation.status = "rejected"
            cancellation.rejection_reason = request.data.get("reason", "")
            cancellation.reviewed_by = request.user
            cancellation.reviewed_at = timezone.now()
            cancellation.save()
            return Response({"success": True, "message": "Cancellation rejected."})
        except Cancellation.DoesNotExist:
            return Response({"message": "Cancellation not found."}, status=404)
