from django.conf import settings
from django.db import models


class Complaint(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    mobile = models.CharField(max_length=15)
    subject = models.CharField(max_length=300)
    message = models.TextField()
    booking_id = models.CharField(
        max_length=20, blank=True, help_text="Optional related booking"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    admin_remarks = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hsm_complaints"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} — {self.name} [{self.status}]"
