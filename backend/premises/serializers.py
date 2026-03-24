from rest_framework import serializers
from .models import Premise, PremiseRate, TimeSlot, Holiday, GalleryItem


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'name', 'start_time', 'end_time', 'multiplier', 'max_bookings_per_day', 'is_active']


class PremiseRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiseRate
        fields = ['id', 'rate_type', 'amount', 'effective_from', 'effective_to', 'is_active']


class PremiseListSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Premise
        fields = ['id', 'name', 'description', 'capacity', 'base_rate', 'security_deposit',
                  'icon', 'is_active', 'is_available', 'images']


class PremiseDetailSerializer(serializers.ModelSerializer):
    rates = PremiseRateSerializer(many=True, read_only=True)
    slots = TimeSlotSerializer(many=True, read_only=True)
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Premise
        fields = ['id', 'name', 'description', 'capacity', 'area_sqft', 'base_rate', 'security_deposit',
                  'icon', 'is_active', 'is_available', 'facilities', 'rules', 'images', 'sort_order',
                  'rates', 'slots', 'created_at', 'updated_at']


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'date', 'name', 'charge_multiplier', 'description']


class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryItem
        fields = ['id', 'premise', 'item_type', 'title', 'description', 'file', 'url', 'thumbnail', 'sort_order']
