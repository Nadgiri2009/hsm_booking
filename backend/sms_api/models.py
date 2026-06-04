from django.db import models


class Payment(models.Model):
    STATUS_CREATED = 'CREATED'
    STATUS_PAID = 'PAID'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = [
        (STATUS_CREATED, 'Created'),
        (STATUS_PAID, 'Paid'),
        (STATUS_FAILED, 'Failed'),
    ]

    order_id = models.CharField(max_length=128, unique=True)
    amount = models.BigIntegerField(help_text='Amount in paise')
    currency = models.CharField(max_length=8, default='INR')
    receipt = models.CharField(max_length=128, null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_CREATED)
    razorpay_payment_id = models.CharField(max_length=128, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=256, null=True, blank=True)
    raw_response = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.order_id} ({self.status})"
