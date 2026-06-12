import uuid

from django.db import models
from django.utils import timezone

from apps.premises.models import Premise, TimeSlot


def generate_booking_id():
    from datetime import datetime

    return f"HSM{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:4].upper()}"


def generate_temp_booking_id():
    from datetime import datetime

    return f"TEMP{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"


def generate_final_booking_id():
    from datetime import datetime

    return f"HSM{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending_approval", "Pending Approval"),
        ("awaiting_payment", "Awaiting Payment"),
        ("confirmed", "Confirmed"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
        # Legacy values retained so existing rows remain readable.
        ("pending", "Pending"),
        ("approved", "Approved"),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    PAYMENT_MODE = [
        ("bank_transfer", "Bank Transfer"),
        ("qr", "QR Payment"),
        ("razorpay", "Razorpay"),
    ]
    ID_PROOF_CHOICES = [("aadhaar", "Aadhaar"), ("pan", "PAN")]
    FUNCTION_TYPES = [
        ("marriage", "Marriage"),
        ("birthday", "Birthday"),
        ("corporate", "Corporate"),
        ("conference", "Conference"),
        ("exhibition", "Exhibition"),
        ("other", "Other"),
    ]

    booking_id = models.CharField(max_length=24, unique=True, db_index=True)
    temp_booking_id = models.CharField(
        max_length=24, unique=True, db_index=True, blank=True
    )
    final_booking_id = models.CharField(
        max_length=24, db_index=True, null=True, blank=True
    )
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
    addons_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    addons_summary = models.JSONField(null=True, blank=True)

    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE)
    status = models.CharField(
        max_length=24, choices=STATUS_CHOICES, default="pending_approval"
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    admin_remarks = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    slot_locked_until = models.DateTimeField(null=True, blank=True)
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
        if not self.temp_booking_id:
            self.temp_booking_id = generate_temp_booking_id()
        if not self.booking_id:
            self.booking_id = self.temp_booking_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_id} - {self.full_name}"

    @property
    def display_booking_id(self):
        return self.final_booking_id or self.temp_booking_id or self.booking_id


class BookingAuditLog(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="audit_logs"
    )
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24)
    from_payment_status = models.CharField(max_length=20, blank=True)
    to_payment_status = models.CharField(max_length=20, blank=True)
    action = models.CharField(max_length=50)
    remarks = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        "accounts.AdminUser", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "BookingAuditLogs"
        indexes = [
            models.Index(fields=["booking", "created_at"]),
            models.Index(fields=["action", "created_at"]),
        ]


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


class AuditLog(models.Model):
    """General-purpose audit log for booking and admin actions."""

    user = models.ForeignKey(
        "accounts.AdminUser", null=True, blank=True, on_delete=models.SET_NULL
    )
    username = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=100, blank=True)
    action = models.CharField(max_length=200)
    entity = models.CharField(max_length=200, blank=True)
    entity_id = models.CharField(max_length=100, blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "AuditLogs"
        indexes = [models.Index(fields=["action", "created_at"]), models.Index(fields=["username"])]

    def __str__(self):
        return f"{self.created_at} - {self.action} - {self.username or 'system'}"


class Addon(models.Model):
    """Optional add-on items that can be attached to a booking (chairs, decor, sound, etc.)"""

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    unit_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Addons"

    def __str__(self):
        return f"{self.name} ({self.code})"


class BookingAddon(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="addons")
    addon = models.ForeignKey(Addon, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "BookingAddons"
        indexes = [models.Index(fields=["booking"]), models.Index(fields=["addon"])]

    def __str__(self):
        return f"{self.booking.display_booking_id} - {self.addon.name} x{self.quantity}"
