from rest_framework import serializers
from django.utils import timezone
from .models import Booking, BookingMigration, Receipt
from premises.models import Premise, TimeSlot


class BookingCalculationSerializer(serializers.Serializer):
    premise_id = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    slot_id = serializers.IntegerField()

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('Start date must be before end date.')
        if data['start_date'] < timezone.now().date():
            raise serializers.ValidationError('Start date cannot be in the past.')
        return data


class ApplicantDetailsSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    address = serializers.CharField()
    mobile = serializers.RegexField(regex=r'^[6-9]\d{9}$', error_messages={'invalid': 'Invalid mobile number'})
    alt_mobile = serializers.RegexField(regex=r'^[6-9]\d{9}$', required=False, allow_blank=True)
    email = serializers.EmailField()
    function_name = serializers.CharField(max_length=200)
    function_type = serializers.CharField(max_length=100)
    guest_count = serializers.IntegerField(min_value=1)
    details = serializers.CharField(required=False, allow_blank=True)
    id_proof_type = serializers.ChoiceField(choices=['Aadhaar Card', 'PAN Card'])


class BankDetailsSerializer(serializers.Serializer):
    bank_name = serializers.CharField(max_length=200)
    account_holder = serializers.CharField(max_length=200)
    account_number = serializers.RegexField(regex=r'^\d{9,18}$')
    ifsc = serializers.RegexField(regex=r'^[A-Z]{4}0[A-Z0-9]{6}$', error_messages={'invalid': 'Invalid IFSC code'})
    branch = serializers.CharField(max_length=200)
    micr = serializers.RegexField(regex=r'^\d{9}$', required=False, allow_blank=True)


class CreateBookingSerializer(serializers.Serializer):
    premise_id = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    slot_id = serializers.IntegerField()
    applicant = ApplicantDetailsSerializer()
    bank_details = BankDetailsSerializer()
    payment_mode = serializers.ChoiceField(choices=['bank_transfer', 'qr_payment'])

    def validate(self, data):
        from bookings.services import AvailabilityService

        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('Start date must be before end date.')

        if not AvailabilityService.is_slot_available(
            data['premise_id'], data['slot_id'], data['start_date'], data['end_date']
        ):
            raise serializers.ValidationError('The selected slot is not available for these dates.')

        return data


class BookingListSerializer(serializers.ModelSerializer):
    premise_name = serializers.CharField(source='premise.name', read_only=True)
    slot_name = serializers.CharField(source='slot.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_id', 'premise_name', 'slot_name',
            'start_date', 'end_date', 'total_days',
            'applicant_name', 'mobile', 'email', 'function_name', 'guest_count',
            'status', 'payment_status', 'total_payable', 'payment_mode', 'created_at',
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    premise_name = serializers.CharField(source='premise.name', read_only=True)
    slot_name = serializers.CharField(source='slot.name', read_only=True)
    function_type = serializers.CharField(read_only=True)

    class Meta:
        model = Booking
        exclude = ['account_number_encrypted', 'migration']
