from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from .views import CancellationRequestView, CancellationViewSet, OTPVerifyView

router = DefaultRouter(trailing_slash="/?")
router.register("records", CancellationViewSet, basename="cancellations")

urlpatterns = [
    re_path(
        r"^request/?$", CancellationRequestView.as_view(), name="cancellation-request"
    ),
    re_path(r"^verify-otp/?$", OTPVerifyView.as_view(), name="verify-otp"),
    re_path(r"^", include(router.urls)),
]
