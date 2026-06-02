from django.conf import settings
from django.db import models
from django.utils import timezone

from premises.models import Premise, TimeSlot


def generate_booking_id():
    """Generate unique booking ID: HSM + YYYYMMDD + sequence"""
    import datetime

    from django.db.models import Count

    prefix = settings.HSM_SETTINGS["BOOKING_ID_PREFIX"]
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")
    count = Booking.objects.filter(created_at__date=today).count() + 1
    return f"{prefix}{date_str}{count:04d}"


class BookingMigration(models.Model):
    """Stores partial/in-progress booking data before completion"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("applicant_filled", "Applicant Details Filled"),
        ("bank_filled", "Bank Details Filled"),
        ("migrated", "Migrated to Booking"),
    ]

    session_id = models.CharField(max_length=100, unique=True)
    premise = models.ForeignKey(Premise, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField(null=True)
    end_date = models.DateField(null=True)
    slot = models.ForeignKey(TimeSlot, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="draft")
    data = models.JSONField(default=dict, help_text="Partial booking JSON data")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hsm_booking_migrations"

    def __str__(self):
        return f"Migration {self.session_id} [{self.status}]"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("partial", "Partial"),
        ("refunded", "Refunded"),
        ("failed", "Failed"),
    ]

    ID_PROOF_CHOICES = [
        ("aadhaar", "Aadhaar Card"),
        ("pan", "PAN Card"),
    ]

    PAYMENT_MODE_CHOICES = [
        ("bank_transfer", "Bank Transfer"),
        ("qr_payment", "QR Payment"),
    ]

    # Identifiers
    booking_id = models.CharField(max_length=20, unique=True, editable=False)
    migration = models.OneToOneField(
        BookingMigration, on_delete=models.SET_NULL, null=True, blank=True
    )

    # Premise & Schedule
    premise = models.ForeignKey(
        Premise, on_delete=models.PROTECT, related_name="bookings"
    )
    slot = models.ForeignKey(TimeSlot, on_delete=models.PROTECT, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveSmallIntegerField()

    # Applicant
    applicant_name = models.CharField(max_length=200)
    applicant_address = models.TextField()
    mobile = models.CharField(max_length=15)
    alt_mobile = models.CharField(max_length=15, blank=True)
    email = models.EmailField()
    function_name = models.CharField(max_length=200)
    function_type = models.CharField(max_length=100)
    guest_count = models.PositiveIntegerField()
    additional_details = models.TextField(blank=True)
    id_proof_type = models.CharField(max_length=20, choices=ID_PROOF_CHOICES)
    id_proof_file = models.FileField(upload_to="id_proofs/", null=True, blank=True)

    # Bank Details (for refund)
    bank_name = models.CharField(max_length=200)
    account_holder = models.CharField(max_length=200)
    account_number_encrypted = models.CharField(max_length=500)  # Store encrypted
    ifsc = models.CharField(max_length=15)
    branch = models.CharField(max_length=200)
    micr = models.CharField(max_length=9, blank=True)

    # Financials
    base_rent = models.DecimalField(max_digits=14, decimal_places=2)
    holiday_charges = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    slot_charges = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=14, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    cgst = models.DecimalField(max_digits=14, decimal_places=2)
    sgst = models.DecimalField(max_digits=14, decimal_places=2)
    total_payable = models.DecimalField(max_digits=14, decimal_places=2)

    # Payment
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )

    # Status & Admin
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_bookings",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hsm_bookings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["booking_id"]),
            models.Index(fields=["mobile"]),
            models.Index(fields=["status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["premise", "start_date", "end_date"]),
        ]

    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = generate_booking_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_id} — {self.applicant_name} | {self.premise.name}"


class Receipt(models.Model):
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="receipt"
    )
    receipt_number = models.CharField(max_length=30, unique=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    pdf_file = models.FileField(upload_to="receipts/", null=True, blank=True)
    is_duplicate = models.BooleanField(default=False)

    class Meta:
        db_table = "hsm_receipts"

    def __str__(self):
        return self.receipt_number
