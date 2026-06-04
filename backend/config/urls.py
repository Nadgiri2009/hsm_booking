from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView


def api_root(request):
    """Root API endpoint with available routes"""
    return JsonResponse(
        {
            "message": "HSM Booking API",
            "version": "1.0",
            "endpoints": {
                "admin": "/admin/",
                "auth": "/api/auth/",
                "premises": "/api/premises/",
                "bookings": "/api/bookings/",
                "payments": "/api/payments/",
                "cancellations": "/api/cancellations/",
                "complaints": "/api/complaints/",
                "api_docs": "/api/docs/",
            },
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"^api/auth(?:/|$)", include("apps.accounts.urls")),
    re_path(r"^api/premises(?:/|$)", include("apps.premises.urls")),
    re_path(r"^api/bookings(?:/|$)", include("apps.bookings.urls")),
    re_path(r"^api/payments(?:/|$)", include("apps.payments.urls")),
    re_path(r"^api/cancellations(?:/|$)", include("apps.cancellations.urls")),
    re_path(r"^api/complaints(?:/|$)", include("apps.complaints.urls")),
    re_path(r"^", include("sms_api.urls")),
    path("api/", api_root, name="api-root"),
    # Serve Angular for all other routes
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)