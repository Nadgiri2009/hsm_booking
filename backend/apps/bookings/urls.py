from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet

router = DefaultRouter(trailing_slash="/?")
router.register("", BookingViewSet, basename="bookings")

urlpatterns = [
    re_path(
        r"^$",
        BookingViewSet.as_view({"get": "list", "post": "create"}),
        name="booking-list-create",
    ),
    re_path(
        r"^availability/?$",
        BookingViewSet.as_view({"get": "availability"}),
        name="booking-availability",
    ),
    re_path(
        r"^calculate/?$",
        BookingViewSet.as_view({"post": "calculate"}),
        name="booking-calculate",
    ),
    re_path(
        r"^lookup/?$", BookingViewSet.as_view({"get": "lookup"}), name="booking-lookup"
    ),
    re_path(
        r"^(?P<pk>[^/.]+)/receipt/?$",
        BookingViewSet.as_view({"get": "receipt"}),
        name="booking-receipt",
    ),
    re_path(
        r"^(?P<pk>[^/.]+)/approve/?$",
        BookingViewSet.as_view({"post": "approve"}),
        name="booking-approve",
    ),
    re_path(
        r"^(?P<pk>[^/.]+)/reject/?$",
        BookingViewSet.as_view({"post": "reject"}),
        name="booking-reject",
    ),
    re_path(r"^", include(router.urls)),
]
