import uuid

from django.db import models
from django.utils import timezone

from apps.premises.models import Premise, TimeSlot


def generate_booking_id():
    from datetime import datetime

    return f"HSM{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:4].upper()}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_MODE = [("bank_transfer", "Bank Transfer"), ("qr", "QR Payment")]
    ID_PROOF_CHOICES = [("aadhaar", "Aadhaar"), ("pan", "PAN")]
    FUNCTION_TYPES = [
        ("marriage", "Marriage"),
        ("birthday", "Birthday"),
        ("corporate", "Corporate"),
        ("conference", "Conference"),
        ("exhibition", "Exhibition"),
        ("other", "Other"),
    ]

    booking_id = models.CharField(max_length=20, unique=True, db_index=True)
    premise = models.ForeignKey(Premise, on_delete=models.PROTECT)
    slot = models.ForeignKey(TimeSlot, on_delete=models.PROTECT)
    from_date = models.DateField(db_index=True)
    to_date = models.DateField()
    total_days = models.PositiveIntegerField()

    # Applicant
    full_name = models.CharField(max_length=200)
    address = models.TextField()
    mobile = models.CharField(max_length=10, db_index=True)
    alt_mobile = models.CharField(max_length=10, blank=True)
    email = models.EmailField()
    function_name = models.CharField(max_length=200)
    function_type = models.CharField(max_length=50, choices=FUNCTION_TYPES)
    expected_guests = models.PositiveIntegerField()
    id_proof_type = models.CharField(max_length=10, choices=ID_PROOF_CHOICES)
    id_proof_number = models.CharField(max_length=20)
    id_proof_file = models.FileField(upload_to="id_proofs/", null=True, blank=True)

    # Bank Details for Refund
    bank_name = models.CharField(max_length=200)
    account_holder = models.CharField(max_length=200)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=15)
    branch_name = models.CharField(max_length=200)
    micr_code = models.CharField(max_length=9, blank=True)

    # Financials
    base_rent = models.DecimalField(max_digits=12, decimal_places=2)
    holiday_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2)
    cgst = models.DecimalField(max_digits=12, decimal_places=2)
    sgst = models.DecimalField(max_digits=12, decimal_places=2)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2)

    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        "accounts.AdminUser", null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        db_table = "Bookings"
        indexes = [
            models.Index(fields=["from_date", "to_date"]),
            models.Index(fields=["premise", "from_date"]),
        ]

    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = generate_booking_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_id} - {self.full_name}"


class BookingMigration(models.Model):
    """Stores partial/incomplete booking data before final submission"""

    session_id = models.CharField(max_length=100, unique=True)
    premise = models.ForeignKey(
        Premise, on_delete=models.CASCADE, null=True, blank=True
    )
    slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, null=True, blank=True)
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)
    step_data = models.JSONField(default=dict)
    current_step = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "BookingMigrations"
