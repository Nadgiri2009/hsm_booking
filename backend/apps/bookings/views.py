from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.db.models import Q
from datetime import timedelta
import decimal

from .models import Booking
from .serializers import (
    BookingSerializer,
    BookingListSerializer,
    CalculationSerializer,
    BOOKING_CONFLICT_MESSAGE,
)
from apps.premises.models import Premise, TimeSlot, Holiday


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related('premise', 'slot').order_by('-created_at')
    serializer_class = BookingSerializer

    def get_permissions(self):
        if self.action in ['create', 'retrieve', 'calculate', 'availability', 'lookup', 'receipt']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        return BookingSerializer

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def availability(self, request):
        premise_id = request.query_params.get('premise_id')
        date_str = request.query_params.get('date')
        if not premise_id or not date_str:
            return Response({'error': 'premise_id and date required'}, status=400)
        booked = Booking.objects.filter(
            premise_id=premise_id, from_date__lte=date_str, to_date__gte=date_str,
            status__in=['pending', 'approved']
        ).values_list('slot_id', flat=True)
        booked_slot_ids = list(set(booked))
        slots = TimeSlot.objects.filter(premise_id=premise_id, is_active=True)
        available_slots = [
            {
                'id': s.id,
                'name': s.name,
                'start_time': str(s.start_time),
                'end_time': str(s.end_time),
                'multiplier': str(s.multiplier),
            }
            for s in slots
            if s.id not in booked_slot_ids
        ]
        return Response({
            'date': date_str,
            'premise_id': int(premise_id),
            'booked_slots': booked_slot_ids,
            'available_slots': available_slots,
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def calculate(self, request):
        ser = CalculationSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        data = ser.validated_data
        try:
            premise = Premise.objects.get(id=data['premise_id'])
            slot = TimeSlot.objects.get(id=data['slot_id'])
        except (Premise.DoesNotExist, TimeSlot.DoesNotExist):
            return Response({'error': 'Premise or slot not found'}, status=404)

        from_date = data['from_date']
        to_date = data['to_date']
        has_conflict = Booking.objects.filter(
            premise_id=premise.id,
            slot_id=slot.id,
            status__in=['pending', 'approved'],
            from_date__lte=to_date,
            to_date__gte=from_date,
        ).exists()
        if has_conflict:
            return Response({'error': BOOKING_CONFLICT_MESSAGE}, status=400)

        days = (to_date - from_date).days + 1

        holidays = Holiday.objects.filter(date__range=[from_date, to_date])
        holiday_dates = set(h.date for h in holidays)
        base = float(premise.base_rent) * days * float(slot.multiplier)
        holiday_charges = sum(float(premise.base_rent) * float(slot.multiplier) * (float(h.charge_multiplier) - 1) for h in holidays)
        deposit = float(premise.security_deposit)
        cgst = base * settings.CGST_RATE
        sgst = base * settings.SGST_RATE

        return Response({'premise': {'id': premise.id, 'name': premise.name}, 'total_days': days, 'base_rent': round(base, 2), 'holiday_charges': round(holiday_charges, 2), 'security_deposit': round(deposit, 2), 'cgst': round(cgst, 2), 'sgst': round(sgst, 2), 'total_payable': round(base + holiday_charges + deposit + cgst + sgst, 2)})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def lookup(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'error': 'query required'}, status=400)
        bookings = Booking.objects.filter(Q(booking_id=query) | Q(mobile=query))
        return Response(BookingListSerializer(bookings, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'pending':
            return Response({'error': 'Only pending bookings can be approved'}, status=400)
        from django.utils import timezone
        booking.status = 'approved'
        booking.approved_at = timezone.now()
        booking.approved_by = request.user
        booking.admin_remarks = request.data.get('remarks', '')
        booking.save()
        return Response({'message': 'Booking approved', 'booking_id': booking.booking_id})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'rejected'
        booking.admin_remarks = request.data.get('remarks', '')
        booking.save()
        return Response({'message': 'Booking rejected'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def receipt(self, request, pk=None):
        if str(pk).isdigit():
            booking = Booking.objects.filter(id=int(pk)).first()
            if not booking:
                booking = Booking.objects.filter(booking_id=pk).first()
        else:
            booking = Booking.objects.filter(booking_id=pk).first()
        if not booking:
            return Response({'error': 'Booking not found'}, status=404)
        from utils.pdf_generator import generate_receipt_pdf
        pdf_buffer = generate_receipt_pdf(booking)
        from django.http import HttpResponse
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Receipt_{booking.booking_id}.pdf"'
        return response


class BookingViewSet(BookingViewSet):
    pass
