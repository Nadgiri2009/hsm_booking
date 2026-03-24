from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import BasePagination
from .models import Premise, TimeSlot, Holiday
from .serializers import PremiseSerializer, TimeSlotSerializer, HolidaySerializer

class NoPagination(BasePagination):
    """No pagination for small datasets"""
    def paginate_queryset(self, queryset, request, view=None):
        return list(queryset)
    
    def get_paginated_response(self, data):
        return Response(data)

class PremiseViewSet(viewsets.ModelViewSet):
    queryset = Premise.objects.filter(is_active=True)
    serializer_class = PremiseSerializer
    pagination_class = NoPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'slots']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def slots(self, request, pk=None):
        premise = self.get_object()
        slots = TimeSlot.objects.filter(premise=premise, is_active=True)
        return Response(TimeSlotSerializer(slots, many=True).data)


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
