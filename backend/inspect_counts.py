import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django

django.setup()

from apps.premises.models import Premise
from apps.bookings.models import Booking
from apps.payments.models import Payment

print('premises', Premise.objects.count())
print('bookings', Booking.objects.count())
print('payments', Payment.objects.count())
