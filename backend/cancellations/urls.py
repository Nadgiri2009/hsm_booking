from django.urls import path

from .views import (
    AdminCancellationApproveView,
    AdminCancellationListView,
    AdminCancellationRejectView,
    CancellationRequestView,
)

urlpatterns = [
    path("request/", CancellationRequestView.as_view(), name="cancellation-request"),
    path("admin/", AdminCancellationListView.as_view(), name="admin-cancellation-list"),
    path(
        "admin/<int:pk>/approve/",
        AdminCancellationApproveView.as_view(),
        name="admin-cancel-approve",
    ),
    path(
        "admin/<int:pk>/reject/",
        AdminCancellationRejectView.as_view(),
        name="admin-cancel-reject",
    ),
]
