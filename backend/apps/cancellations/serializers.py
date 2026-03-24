from rest_framework import serializers
from .models import Cancellation, Refund

class CancellationSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    class Meta:
        model = Cancellation
        fields = '__all__'
        read_only_fields = ['refund_percentage', 'refund_amount', 'status']

class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = '__all__'
