# -*- coding: utf-8 -*-
"""
Run this script either by:
    python seed_data.py           # runs standalone
or
    python manage.py shell -c "exec(open('seed_data.py', encoding='utf-8').read())"

(Note: PowerShell doesn’t support `< filename` redirection.)

Creates initial admin user, premises, time slots, and holidays
"""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from datetime import date

from apps.accounts.models import AdminUser
from apps.premises.models import Holiday, Premise, TimeSlot

# Create superadmin
if not AdminUser.objects.filter(email="admin@solapurcorp.gov.in").exists():
    AdminUser.objects.create_superuser(
        email="admin@solapurcorp.gov.in",
        password="Admin@12345",
        name="HSM Administrator",
    )
    print("✅ Superadmin created: admin@solapurcorp.gov.in / Admin@12345")

# Create premises
premises_data = [
    {
        "name": "Hutatma Smruti Mandir – Main Hall",
        "name_mr": "हुतात्मा स्मृती मंदिर – मुख्य सभागृह",
        "capacity": 500,
        "base_rent": 15000,
        "security_deposit": 25000,
    },
    {
        "name": "VIP Room",
        "name_mr": "व्हीआयपी रूम",
        "capacity": 50,
        "base_rent": 5000,
        "security_deposit": 10000,
    },
    {
        "name": "Dining Hall",
        "name_mr": "डायनिंग हॉल",
        "capacity": 200,
        "base_rent": 8000,
        "security_deposit": 15000,
    },
    {
        "name": "Art Gallery",
        "name_mr": "कला दालन",
        "capacity": 100,
        "base_rent": 6000,
        "security_deposit": 12000,
    },
    {
        "name": "Open Space (Lawn)",
        "name_mr": "खुली जागा",
        "capacity": 300,
        "base_rent": 10000,
        "security_deposit": 20000,
    },
]

for pd in premises_data:
    premise, created = Premise.objects.get_or_create(name=pd["name"], defaults=pd)
    if created:
        # Add default time slots
        TimeSlot.objects.create(
            premise=premise,
            name="Morning Session",
            start_time="06:00",
            end_time="12:00",
            multiplier=0.5,
        )
        TimeSlot.objects.create(
            premise=premise,
            name="Full Day",
            start_time="08:00",
            end_time="22:00",
            multiplier=1.0,
        )
        TimeSlot.objects.create(
            premise=premise,
            name="Evening Session",
            start_time="16:00",
            end_time="23:00",
            multiplier=0.6,
        )
        print(f"✅ Premise created: {premise.name}")

# Create holidays
holidays_data = [
    {"name": "Republic Day", "date": date(2025, 1, 26), "charge_multiplier": 1.5},
    {"name": "Independence Day", "date": date(2025, 8, 15), "charge_multiplier": 1.5},
    {"name": "Gandhi Jayanti", "date": date(2025, 10, 2), "charge_multiplier": 1.5},
    {"name": "Diwali", "date": date(2025, 10, 20), "charge_multiplier": 2.0},
    {"name": "Christmas", "date": date(2025, 12, 25), "charge_multiplier": 1.5},
]

for hd in holidays_data:
    _, created = Holiday.objects.get_or_create(date=hd["date"], defaults=hd)
    if created:
        print(f"✅ Holiday added: {hd['name']}")

print("\n🎉 Seed data loaded successfully!")
print("Admin Login: admin@solapurcorp.gov.in / Admin@12345")
