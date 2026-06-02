from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet

router = DefaultRouter(trailing_slash="/?")
router.register("", PaymentViewSet, basename="payments")
urlpatterns = [
    re_path(
        r"^$",
        PaymentViewSet.as_view({"get": "list", "post": "create"}),
        name="payment-list-create",
    ),
    re_path(r"^", include(router.urls)),
]
