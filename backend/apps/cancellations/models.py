from django.db import models
from apps.bookings.models import Booking

class Cancellation(models.Model):
    STATUS = [('requested','Requested'),('otp_verified','OTP Verified'),('approved','Approved'),('rejected','Rejected')]
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='cancellation')
    reason = models.TextField()
    cancellation_date = models.DateField(auto_now_add=True)
    refund_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS, default='requested')
    otp = models.CharField(max_length=6, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)
    otp_verified = models.BooleanField(default=False)
    admin_remarks = models.TextField(blank=True)
    approved_by = models.ForeignKey('accounts.AdminUser', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Cancellations'

class Refund(models.Model):
    STATUS = [('pending','Pending'),('processing','Processing'),('completed','Completed'),('failed','Failed')]
    cancellation = models.OneToOneField(Cancellation, on_delete=models.CASCADE, related_name='refund')
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    bank_name = models.CharField(max_length=200)
    account_holder = models.CharField(max_length=200)
    account_number = models.CharField(max_length=50)
    ifsc_code = models.CharField(max_length=15)
    utr_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Refunds'
