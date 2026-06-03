"""
Snippet for integrating python-decouple and django-cors-headers.

Place the following in your `backend/config/settings.py` (or import from here)
and install `python-decouple` and `django-cors-headers`.
"""
from decouple import config

# load SMS credentials from environment
SMS_APPID = config('SMS_APPID')
SMS_PASS = config('SMS_PASS')
SMS_SENDER = config('SMS_SENDER', default='MAHGOV')

# django-cors-headers configuration (allow Angular dev server)
# Add 'corsheaders' to INSTALLED_APPS and put CorsMiddleware near top of MIDDLEWARE
INSTALLED_APPS = [
    # ... existing apps ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... existing middleware ...
]

# Allow only the Angular dev origin during development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
]

# Allow cookies/credentials if needed
CORS_ALLOW_CREDENTIALS = True
