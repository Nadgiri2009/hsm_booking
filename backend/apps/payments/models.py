from django.db import models

from apps.bookings.models import Booking


class Payment(models.Model):
    STATUS = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )
    transaction_ref = models.CharField(max_length=100, blank=True, db_index=True)
    payment_mode = models.CharField(max_length=30)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    bank_ref = models.CharField(max_length=100, blank=True)
    verified_by = models.ForeignKey(
        "accounts.AdminUser", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Payments"


class Receipt(models.Model):
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="receipt"
    )
    receipt_number = models.CharField(max_length=30, unique=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to="receipts/", null=True, blank=True)

    class Meta:
        db_table = "Receipts"
