from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'amount', 'currency', 'status', 'created_at')
    search_fields = ('order_id', 'razorpay_payment_id')
    list_filter = ('status', 'currency')
