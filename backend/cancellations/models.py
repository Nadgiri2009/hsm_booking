from django.conf import settings
from django.db import models

from bookings.models import Booking


class Cancellation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("otp_verified", "OTP Verified"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="cancellation"
    )
    reason = models.TextField()
    requested_at = models.DateTimeField(auto_now_add=True)
    otp = models.CharField(max_length=6, blank=True)
    otp_verified = models.BooleanField(default=False)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Refund
    refund_amount = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    refund_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    refund_status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("processed", "Processed")],
        default="pending",
    )
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    refund_reference = models.CharField(max_length=100, blank=True)

    # Admin
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "hsm_cancellations"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Cancellation: {self.booking.booking_id} [{self.status}]"
