from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_workflow_fields(apps, schema_editor):
    Booking = apps.get_model("bookings", "Booking")
    for booking in Booking.objects.all():
        if not booking.temp_booking_id:
            booking.temp_booking_id = booking.booking_id
        if not booking.payment_status:
            booking.payment_status = "pending"
        if booking.status == "pending":
            booking.status = "pending_approval"
        elif booking.status == "approved":
            booking.status = "awaiting_payment"
        booking.save(update_fields=["temp_booking_id", "payment_status", "status"])


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="booking",
            name="booking_id",
            field=models.CharField(db_index=True, max_length=24, unique=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="temp_booking_id",
            field=models.CharField(blank=True, db_index=True, max_length=24, null=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="final_booking_id",
            field=models.CharField(blank=True, db_index=True, max_length=24, null=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("paid", "Paid"),
                    ("failed", "Failed"),
                    ("refunded", "Refunded"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="rejection_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="rejected_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="slot_locked_until",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="booking",
            name="payment_mode",
            field=models.CharField(
                choices=[
                    ("bank_transfer", "Bank Transfer"),
                    ("qr", "QR Payment"),
                    ("razorpay", "Razorpay"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="booking",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("pending_approval", "Pending Approval"),
                    ("awaiting_payment", "Awaiting Payment"),
                    ("confirmed", "Confirmed"),
                    ("rejected", "Rejected"),
                    ("cancelled", "Cancelled"),
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                ],
                default="pending_approval",
                max_length=24,
            ),
        ),
        migrations.RunPython(backfill_workflow_fields, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="booking",
            name="temp_booking_id",
            field=models.CharField(blank=True, db_index=True, max_length=24, unique=True),
        ),
        migrations.CreateModel(
            name="BookingAuditLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("from_status", models.CharField(blank=True, max_length=24)),
                ("to_status", models.CharField(max_length=24)),
                ("from_payment_status", models.CharField(blank=True, max_length=20)),
                ("to_payment_status", models.CharField(blank=True, max_length=20)),
                ("action", models.CharField(max_length=50)),
                ("remarks", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "booking",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="audit_logs",
                        to="bookings.booking",
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "BookingAuditLogs",
                "indexes": [
                    models.Index(
                        fields=["booking", "created_at"],
                        name="BookingAudi_booking_690cfe_idx",
                    ),
                    models.Index(
                        fields=["action", "created_at"],
                        name="BookingAudi_action_3a16ca_idx",
                    ),
                ],
            },
        ),
    ]
