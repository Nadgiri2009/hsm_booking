from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GalleryItem, Holiday, Premise, PremiseRate, TimeSlot
from .serializers import (
    GallerySerializer,
    HolidaySerializer,
    PremiseDetailSerializer,
    PremiseListSerializer,
    PremiseRateSerializer,
    TimeSlotSerializer,
)


class PremiseListView(generics.ListAPIView):
    """Public: List all active premises"""

    queryset = Premise.objects.filter(is_active=True)
    serializer_class = PremiseListSerializer
    permission_classes = [permissions.AllowAny]


class PremiseDetailView(generics.RetrieveAPIView):
    queryset = Premise.objects.filter(is_active=True)
    serializer_class = PremiseDetailSerializer
    permission_classes = [permissions.AllowAny]


class PremiseTimeSlotsView(generics.ListAPIView):
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return TimeSlot.objects.filter(premise_id=self.kwargs["pk"], is_active=True)


class HolidayListView(generics.ListAPIView):
    queryset = Holiday.objects.all().order_by("date")
    serializer_class = HolidaySerializer
    permission_classes = [permissions.AllowAny]


class GalleryListView(generics.ListAPIView):
    queryset = GalleryItem.objects.filter(is_active=True)
    serializer_class = GallerySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        item_type = self.request.query_params.get("type")
        if item_type:
            qs = qs.filter(item_type=item_type)
        return qs


# Admin Views
class AdminPremiseListCreateView(generics.ListCreateAPIView):
    queryset = Premise.objects.all().order_by("sort_order")
    serializer_class = PremiseDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminPremiseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Premise.objects.all()
    serializer_class = PremiseDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminPremiseRatesView(generics.ListCreateAPIView):
    serializer_class = PremiseRateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PremiseRate.objects.filter(premise_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        serializer.save(premise_id=self.kwargs["pk"])


class AdminHolidayListCreateView(generics.ListCreateAPIView):
    queryset = Holiday.objects.all().order_by("date")
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminHolidayDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminTimeSlotsView(generics.ListCreateAPIView):
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TimeSlot.objects.filter(premise_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        serializer.save(premise_id=self.kwargs["pk"])
