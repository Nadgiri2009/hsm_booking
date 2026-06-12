"""Add addons and booking_addons tables; add booking aggregates.

Generated migration to add Addon and BookingAddon models and update Booking
with addons_total and addons_summary fields.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0003_auditlog"),
    ]

    operations = [
        migrations.CreateModel(
            name="Addon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, null=True)),
                ("unit_charge", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "Addons"},
        ),

        migrations.CreateModel(
            name="BookingAddon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("amount", models.DecimalField(max_digits=12, decimal_places=2)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("addon", models.ForeignKey(on_delete=models.PROTECT, to="bookings.addon")),
                ("booking", models.ForeignKey(on_delete=models.CASCADE, related_name="addons", to="bookings.booking")),
            ],
            options={"db_table": "BookingAddons"},
        ),

        migrations.AddField(
            model_name="booking",
            name="addons_total",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),

        migrations.AddField(
            model_name="booking",
            name="addons_summary",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
