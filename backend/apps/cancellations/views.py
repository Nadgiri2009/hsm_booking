import random
import string
from datetime import date, timedelta

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking

from .models import Cancellation
from .serializers import CancellationSerializer


def calculate_refund_percentage(event_date):
    days_left = (event_date - date.today()).days
    if days_left >= 60:
        return 90
    elif days_left >= 30:
        return 80
    elif days_left >= 7:
        return 50
    else:
        return 0  # security deposit only


class CancellationRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        reason = request.data.get("reason", "")
        try:
            booking = Booking.objects.get(booking_id=booking_id, status="approved")
        except Booking.DoesNotExist:
            return Response({"error": "Valid approved booking not found"}, status=404)

        if hasattr(booking, "cancellation"):
            return Response({"error": "Cancellation already requested"}, status=400)

        refund_pct = calculate_refund_percentage(booking.from_date)
        refund_amount = float(booking.total_payable) * refund_pct / 100

        otp = "".join(random.choices(string.digits, k=6))
        from django.utils import timezone

        cancellation = Cancellation.objects.create(
            booking=booking,
            reason=reason,
            refund_percentage=refund_pct,
            refund_amount=refund_amount,
            otp=otp,
            otp_expiry=timezone.now() + timedelta(minutes=10),
        )
        # TODO: Send OTP via SMS/Email
        return Response(
            {
                "message": "OTP sent to registered mobile/email",
                "cancellation_id": cancellation.id,
                "refund_percentage": refund_pct,
                "refund_amount": refund_amount,
            }
        )


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cancellation_id = request.data.get("cancellation_id")
        otp = request.data.get("otp")
        from django.utils import timezone

        try:
            cancellation = Cancellation.objects.get(id=cancellation_id)
            if cancellation.otp == otp and cancellation.otp_expiry > timezone.now():
                cancellation.otp_verified = True
                cancellation.status = "otp_verified"
                cancellation.booking.status = "cancelled"
                cancellation.booking.save()
                cancellation.save()
                return Response(
                    {
                        "message": "Cancellation verified successfully. Refund will be processed after admin approval."
                    }
                )
            return Response({"error": "Invalid or expired OTP"}, status=400)
        except Cancellation.DoesNotExist:
            return Response({"error": "Invalid cancellation request"}, status=404)


class CancellationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cancellation.objects.select_related("booking").order_by("-created_at")
    serializer_class = CancellationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        cancellation = self.get_object()
        cancellation.status = "approved"
        cancellation.approved_by = request.user
        cancellation.admin_remarks = request.data.get("remarks", "")
        cancellation.save()
        return Response({"message": "Cancellation approved, refund initiated"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        cancellation = self.get_object()
        cancellation.status = "rejected"
        cancellation.admin_remarks = request.data.get("remarks", "")
        cancellation.booking.status = "approved"
        cancellation.booking.save()
        cancellation.save()
        return Response({"message": "Cancellation rejected"})
