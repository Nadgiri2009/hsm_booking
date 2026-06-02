from rest_framework import serializers

from .models import Holiday, Premise, PremiseRate, TimeSlot


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = "__all__"


class PremiseRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiseRate
        fields = "__all__"


class PremiseSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotSerializer(many=True, read_only=True)

    class Meta:
        model = Premise
        fields = [
            "id",
            "name",
            "name_mr",
            "description",
            "capacity",
            "base_rent",
            "security_deposit",
            "is_active",
            "image",
            "time_slots",
        ]


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"
