from django.db import models

class Complaint(models.Model):
    STATUS = [('open','Open'),('in_progress','In Progress'),('resolved','Resolved'),('closed','Closed')]
    name = models.CharField(max_length=200)
    email = models.EmailField()
    mobile = models.CharField(max_length=10)
    booking_id = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=300)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='open')
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} - {self.name}'


class ContactMessage(models.Model):
    STATUS = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved')
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    mobile = models.CharField(max_length=10)
    subject = models.CharField(max_length=300)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ContactMessages'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} - {self.name}'
