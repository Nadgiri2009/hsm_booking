import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()

from apps.accounts.models import AdminUser

print(
    "admin exists:", AdminUser.objects.filter(email="admin@solapurcorp.gov.in").exists()
)
print(
    "details:",
    list(AdminUser.objects.filter(email="admin@solapurcorp.gov.in").values()),
)
