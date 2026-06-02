import os
import sys

import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if os.path.join(BASE_DIR, "apps") not in sys.path:
    sys.path.insert(0, os.path.join(BASE_DIR, "apps"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hsm_project.settings")
django.setup()

from django.conf import settings

print("CORS_ORIGIN_ALLOW_ALL =", getattr(settings, "CORS_ORIGIN_ALLOW_ALL", None))
print("CORS_ALLOWED_ORIGINS =", getattr(settings, "CORS_ALLOWED_ORIGINS", None))
print(
    "CORS_ALLOWED_ORIGIN_REGEXES =",
    getattr(settings, "CORS_ALLOWED_ORIGIN_REGEXES", None),
)
print(
    "CorsMiddleware in MIDDLEWARE:",
    any("corsheaders.middleware.CorsMiddleware" in m for m in settings.MIDDLEWARE),
)
print("INSTALLED_APPS contains corsheaders:", "corsheaders" in settings.INSTALLED_APPS)
print("MIDDLEWARE sample:")
for i, m in enumerate(settings.MIDDLEWARE[:8], 1):
    print(i, m)
