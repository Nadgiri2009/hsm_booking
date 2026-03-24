"""Notification utilities for SMS and Email"""
from django.core.mail import send_mail
from django.conf import settings

def send_booking_confirmation(booking):
    subject = f'Booking Confirmation – {booking.booking_id}'
    message = f"""
Dear {booking.full_name},

Your booking at Hutatma Smruti Mandir has been received.

Booking ID: {booking.booking_id}
Premise: {booking.premise.name}
Date: {booking.from_date} to {booking.to_date}
Total Amount: ₹{booking.total_payable}
Status: {booking.status.upper()}

Please keep this Booking ID for future reference.

Regards,
Solapur Municipal Corporation
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL or 'noreply@solapurcorporation.gov.in', [booking.email], fail_silently=True)

def send_cancellation_otp(booking, otp):
    subject = 'Cancellation OTP – Hutatma Smruti Mandir'
    message = f"""
Dear {booking.full_name},

Your OTP for cancellation of Booking ID {booking.booking_id} is: {otp}

This OTP is valid for 10 minutes.

Regards,
Solapur Municipal Corporation
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL or 'noreply@solapurcorporation.gov.in', [booking.email], fail_silently=True)
