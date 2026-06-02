from django.core.validators import MinValueValidator
from django.db import models


class Premise(models.Model):
    name = models.CharField(max_length=200)
    name_mr = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    capacity = models.PositiveIntegerField()
    base_rent = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    security_deposit = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to="premises/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Premises"

    def __str__(self):
        return self.name


class PremiseRate(models.Model):
    premise = models.ForeignKey(Premise, on_delete=models.CASCADE, related_name="rates")
    rate_type = models.CharField(
        max_length=50,
        choices=[
            ("weekday", "Weekday"),
            ("weekend", "Weekend"),
            ("holiday", "Holiday"),
        ],
    )
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "PremiseRates"


class TimeSlot(models.Model):
    premise = models.ForeignKey(
        Premise, on_delete=models.CASCADE, related_name="time_slots"
    )
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "TimeSlots"

    def __str__(self):
        return f"{self.premise.name} - {self.name}"


class Holiday(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField(unique=True, db_index=True)
    charge_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Holidays"
        ordering = ["date"]

    def __str__(self):
        return f"{self.name} ({self.date})"
