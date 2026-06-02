from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from .views import HolidayViewSet, PremiseViewSet

router = DefaultRouter(trailing_slash="/?")
router.register("", PremiseViewSet, basename="premises")

urlpatterns = [
    re_path(
        r"^$",
        PremiseViewSet.as_view({"get": "list", "post": "create"}),
        name="premise-list-create",
    ),
    re_path(
        r"^(?P<pk>\d+)/slots/?$",
        PremiseViewSet.as_view({"get": "slots"}),
        name="premise-slots",
    ),
    re_path(
        r"^holidays/?$",
        HolidayViewSet.as_view({"get": "list", "post": "create"}),
        name="holiday-list-create",
    ),
    re_path(
        r"^holidays/(?P<pk>\d+)/?$",
        HolidayViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="holiday-detail",
    ),
    re_path(r"^", include(router.urls)),
]
