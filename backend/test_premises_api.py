import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.premises.models import Premise
from apps.premises.serializers import PremiseSerializer

# Get all active premises
premises = Premise.objects.filter(is_active=True)
print(f"Total Active Premises: {premises.count()}")

for p in premises:
    print(f"ID: {p.id}, Name: {p.name}, Capacity: {p.capacity}, Active: {p.is_active}")

# Serialize and print
serializer = PremiseSerializer(premises, many=True)
print("\nSerialized data:")
print(json.dumps(serializer.data, indent=2, default=str))
