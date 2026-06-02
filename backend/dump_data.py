import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()

from apps.accounts.models import AdminUser
from apps.bookings.models import Booking
from apps.cancellations.models import Cancellation, Refund
from apps.complaints.models import Complaint
from apps.payments.models import Payment
from apps.premises.models import Holiday, Premise, TimeSlot

print("AdminUsers:")
for u in AdminUser.objects.all().values():
    print(u)

print("\nPremises:")
for p in Premise.objects.all().values():
    print(p)

print("\nTimeSlots:")
for t in TimeSlot.objects.all().values():
    print(t)

print("\nHolidays:")
for h in Holiday.objects.all().values():
    print(h)

print("\nBookings:")
for b in Booking.objects.all().values():
    print(b)

print("\nPayments:")
for p in Payment.objects.all().values():
    print(p)

print("\nCancellations:")
for c in Cancellation.objects.all().values():
    print(c)

print("\nRefunds:")
for r in Refund.objects.all().values():
    print(r)

print("\nComplaints:")
for c in Complaint.objects.all().values():
    print(c)
