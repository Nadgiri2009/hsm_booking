from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from .views import ComplaintViewSet, ContactMessageViewSet

router = DefaultRouter(trailing_slash="/?")
router.register("", ComplaintViewSet, basename="complaints")

urlpatterns = [
    re_path(
        r"^$",
        ComplaintViewSet.as_view({"get": "list", "post": "create"}),
        name="complaint-list-create",
    ),
    re_path(
        r"^contacts/?$",
        ContactMessageViewSet.as_view({"post": "create", "get": "list"}),
        name="contact-list-create",
    ),
    re_path(
        r"^contacts/(?P<pk>\d+)/?$",
        ContactMessageViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="contact-detail",
    ),
    re_path(r"^", include(router.urls)),
]
