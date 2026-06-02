from django.urls import path

from .views import (
    AdminBookingApproveView,
    AdminBookingDetailView,
    AdminBookingListView,
    AdminBookingRejectView,
    AdminDuplicateReceiptView,
    BookedDatesView,
    BookingCalculateView,
    BookingLookupView,
    CreateBookingView,
    ReceiptDownloadView,
)

urlpatterns = [
    # Public
    path("calculate/", BookingCalculateView.as_view(), name="booking-calculate"),
    path("booked-dates/", BookedDatesView.as_view(), name="booked-dates"),
    path("create/", CreateBookingView.as_view(), name="booking-create"),
    path("lookup/", BookingLookupView.as_view(), name="booking-lookup"),
    path(
        "<str:booking_id>/receipt/",
        ReceiptDownloadView.as_view(),
        name="receipt-download",
    ),
    # Admin
    path("admin/", AdminBookingListView.as_view(), name="admin-booking-list"),
    path(
        "admin/<str:booking_id>/",
        AdminBookingDetailView.as_view(),
        name="admin-booking-detail",
    ),
    path(
        "admin/<str:booking_id>/approve/",
        AdminBookingApproveView.as_view(),
        name="admin-approve",
    ),
    path(
        "admin/<str:booking_id>/reject/",
        AdminBookingRejectView.as_view(),
        name="admin-reject",
    ),
    path(
        "admin/<str:booking_id>/duplicate-receipt/",
        AdminDuplicateReceiptView.as_view(),
        name="admin-duplicate-receipt",
    ),
]
