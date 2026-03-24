import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()
from django.apps import apps
config = apps.get_app_config('apps.premises')
print('premises models:', list(config.get_models()))
