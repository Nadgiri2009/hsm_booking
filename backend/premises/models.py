from django.db import models


class Premise(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    capacity = models.PositiveIntegerField()
    area_sqft = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    base_rate = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Per day base rate"
    )
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2)
    icon = models.CharField(
        max_length=50, default="location_on", help_text="Material icon name"
    )
    is_active = models.BooleanField(default=True)
    facilities = models.TextField(
        blank=True, help_text="Comma separated list of facilities"
    )
    rules = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hsm_premises"
        ordering = ["sort_order", "name"]
        verbose_name = "Premise"
        verbose_name_plural = "Premises"

    def __str__(self):
        return self.name

    @property
    def is_available(self):
        return self.is_active


class PremiseRate(models.Model):
    RATE_TYPE_CHOICES = [
        ("weekday", "Weekday"),
        ("weekend", "Weekend"),
        ("holiday", "Holiday"),
    ]

    premise = models.ForeignKey(Premise, on_delete=models.CASCADE, related_name="rates")
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hsm_premise_rates"
        unique_together = ["premise", "rate_type", "effective_from"]

    def __str__(self):
        return f"{self.premise.name} - {self.rate_type} - ₹{self.amount}"


class TimeSlot(models.Model):
    premise = models.ForeignKey(Premise, on_delete=models.CASCADE, related_name="slots")
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        help_text="Price multiplier (e.g. 1.5 = 150% of base rate per slot)",
    )
    max_bookings_per_day = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hsm_time_slots"
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.premise.name} | {self.name} ({self.start_time}–{self.end_time})"


class Holiday(models.Model):
    date = models.DateField(unique=True)
    name = models.CharField(max_length=200)
    charge_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.5,
        help_text="e.g. 1.5 = 150% of base rate",
    )
    description = models.TextField(blank=True)

    class Meta:
        db_table = "hsm_holidays"
        ordering = ["date"]

    def __str__(self):
        return f"{self.name} ({self.date})"


class GalleryItem(models.Model):
    TYPE_CHOICES = [("photo", "Photo"), ("video", "Video")]

    premise = models.ForeignKey(
        Premise, on_delete=models.CASCADE, related_name="gallery", null=True, blank=True
    )
    item_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="photo")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.ImageField(upload_to="gallery/", blank=True, null=True)
    url = models.URLField(blank=True, help_text="For video URLs (YouTube/Vimeo)")
    thumbnail = models.ImageField(
        upload_to="gallery/thumbnails/", blank=True, null=True
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hsm_gallery"
        ordering = ["sort_order", "-created_at"]
