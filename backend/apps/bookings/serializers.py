from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from apps.premises.serializers import PremiseSerializer, TimeSlotSerializer

from .models import Booking

BOOKING_CONFLICT_MESSAGE = (
    "No booking available for the date & time selected. "
    "Please select another date, time & slot (session)."
)


class BookingSerializer(serializers.ModelSerializer):
    premise_detail = PremiseSerializer(source="premise", read_only=True)
    slot_detail = TimeSlotSerializer(source="slot", read_only=True)

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = [
            "booking_id",
            "temp_booking_id",
            "final_booking_id",
            "status",
            "payment_status",
            "created_at",
            "approved_at",
            "approved_by",
            "rejected_at",
            "slot_locked_until",
        ]

    def validate(self, attrs):
        from_date = attrs.get("from_date", getattr(self.instance, "from_date", None))
        to_date = attrs.get("to_date", getattr(self.instance, "to_date", None))
        premise = attrs.get("premise", getattr(self.instance, "premise", None))
        slot = attrs.get("slot", getattr(self.instance, "slot", None))

        if from_date and to_date and from_date > to_date:
            raise serializers.ValidationError(
                {"to_date": "To date must be on or after from date."}
            )

        if premise and slot and from_date and to_date:
            conflicts = Booking.objects.filter(
                premise=premise,
                slot=slot,
                from_date__lte=to_date,
                to_date__gte=from_date,
            ).filter(
                Q(
                    status__in=[
                        "pending_approval",
                        "awaiting_payment",
                        "confirmed",
                        "pending",
                        "approved",
                    ]
                )
                | Q(
                    status="rejected",
                    rejected_at__gt=timezone.now() - timedelta(minutes=10),
                )
            )
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
            if conflicts.exists():
                raise serializers.ValidationError(
                    {"non_field_errors": [BOOKING_CONFLICT_MESSAGE]}
                )

        return attrs


class BookingListSerializer(serializers.ModelSerializer):
    premise_name = serializers.CharField(source="premise.name", read_only=True)
    slot_name = serializers.CharField(source="slot.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_id",
            "temp_booking_id",
            "final_booking_id",
            "full_name",
            "mobile",
            "email",
            "premise_name",
            "slot_name",
            "from_date",
            "to_date",
            "total_payable",
            "status",
            "payment_status",
            "created_at",
        ]


class AvailabilitySerializer(serializers.Serializer):
    premise_id = serializers.IntegerField()
    date = serializers.DateField()


class CalculationSerializer(serializers.Serializer):
    premise_id = serializers.IntegerField()
    slot_id = serializers.IntegerField()
    from_date = serializers.DateField()
    to_date = serializers.DateField()

    def validate(self, attrs):
        if attrs["from_date"] > attrs["to_date"]:
            raise serializers.ValidationError(
                {"to_date": "To date must be on or after from date."}
            )
        return attrs
