from django.urls import path

from .views import (
    AdminHolidayDetailView,
    AdminHolidayListCreateView,
    AdminPremiseDetailView,
    AdminPremiseListCreateView,
    AdminPremiseRatesView,
    AdminTimeSlotsView,
    GalleryListView,
    HolidayListView,
    PremiseDetailView,
    PremiseListView,
    PremiseTimeSlotsView,
)

urlpatterns = [
    # Public
    path("", PremiseListView.as_view(), name="premise-list"),
    path("<int:pk>/", PremiseDetailView.as_view(), name="premise-detail"),
    path("<int:pk>/slots/", PremiseTimeSlotsView.as_view(), name="premise-slots"),
    path("holidays/", HolidayListView.as_view(), name="holiday-list"),
    path("gallery/", GalleryListView.as_view(), name="gallery-list"),
    # Admin
    path("admin/", AdminPremiseListCreateView.as_view(), name="admin-premise-list"),
    path(
        "admin/<int:pk>/", AdminPremiseDetailView.as_view(), name="admin-premise-detail"
    ),
    path(
        "admin/<int:pk>/rates/",
        AdminPremiseRatesView.as_view(),
        name="admin-premise-rates",
    ),
    path(
        "admin/<int:pk>/slots/",
        AdminTimeSlotsView.as_view(),
        name="admin-premise-slots",
    ),
    path(
        "admin/holidays/",
        AdminHolidayListCreateView.as_view(),
        name="admin-holiday-list",
    ),
    path(
        "admin/holidays/<int:pk>/",
        AdminHolidayDetailView.as_view(),
        name="admin-holiday-detail",
    ),
]
