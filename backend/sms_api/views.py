import decimal
import hashlib
import hmac
import json
import logging

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Payment
from .payment_service import create_order, verify_payment
from .sms_service import send_sms

logger = logging.getLogger(__name__)


@csrf_exempt
def send_sms_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    sms_msg = payload.get("smsMsg")
    mobile_no = payload.get("mobileNo")
    dlt_te_id = payload.get("dltTeId")

    if not sms_msg or not mobile_no:
        return HttpResponseBadRequest("smsMsg and mobileNo are required")

    result = send_sms(sms_msg, mobile_no, dlt_te_id)
    status_code = 200 if result.get("status") == "success" else 500
    return JsonResponse(result, status=status_code)


@csrf_exempt
@require_POST
def create_payment_order(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    amount = payload.get('amount')
    currency = payload.get('currency', 'INR')
    receipt = payload.get('receipt')

    if amount is None:
        return HttpResponseBadRequest('amount is required')

    try:
        actual_amount = int(amount)  # real venue amount in paise
    except Exception:
        return HttpResponseBadRequest('amount must be an integer (paise)')

    # Use the actual amount provided (in paise). Ensure minimum 100 paise.
    try:
        charge_amount = int(actual_amount)
    except Exception:
        charge_amount = 100
    charge_amount = max(charge_amount, 100)

    logger.info('create_payment_order: actual_amount=%s, charge_amount=%s, currency=%s, receipt=%s', actual_amount, charge_amount, currency, receipt)

    

    res = create_order(charge_amount, currency, receipt)
    if not res.get('success'):
        logger.error('create_payment_order: create_order failed: %s', res.get('error'))
        return JsonResponse({'error': res.get('error')}, status=500)

    logger.info('create_payment_order: order created: %s', order.get('id') if (order := res.get('order')) else None)

    order = res.get('order')

    # Save both actual and charged amount in DB
    try:
        Payment.objects.create(
            order_id=order.get('id'),
            amount=actual_amount,        # ← store REAL amount
            currency=order.get('currency'),
            receipt=receipt,
            status=Payment.STATUS_CREATED,
            raw_response=json.dumps(order),
        )
    except Exception:
        logger.exception('Failed to create Payment record')

    return JsonResponse({
        'orderId': order.get('id'),
        'amount': order.get('amount'),   # ← Razorpay gets ₹1 during testing
        'currency': order.get('currency'),
        'keyId': getattr(settings, 'RAZORPAY_KEY_ID', ''),
    })


@csrf_exempt
@require_POST
def verify_payment_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    razorpay_order_id = payload.get("razorpay_order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id")
    razorpay_signature = payload.get("razorpay_signature")
    booking_pk = payload.get("booking_pk")
    booking_id = payload.get("booking_id")

    if not (razorpay_order_id and razorpay_payment_id and razorpay_signature):
        return HttpResponseBadRequest("Missing required fields")

    if not verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        return JsonResponse(
            {"success": False, "error": "Signature verification failed"},
            status=400,
        )

    try:
        with transaction.atomic():
            payment_order = Payment.objects.select_for_update().get(
                order_id=razorpay_order_id
            )
            payment_order.status = Payment.STATUS_PAID
            payment_order.razorpay_payment_id = razorpay_payment_id
            payment_order.razorpay_signature = razorpay_signature
            payment_order.save()

            from apps.bookings.models import Booking, generate_final_booking_id
            from apps.bookings.views import audit_booking
            from apps.payments.models import Payment as BookingPayment

            bookings = Booking.objects.select_for_update()
            if booking_pk:
                booking = bookings.get(pk=booking_pk)
            else:
                booking = bookings.get(booking_id=booking_id or payment_order.receipt)

            if booking.status != "awaiting_payment":
                return JsonResponse(
                    {"success": False, "error": "Booking is not awaiting payment"},
                    status=400,
                )

            old_status = booking.status
            old_payment_status = booking.payment_status
            if not booking.final_booking_id:
                booking.final_booking_id = generate_final_booking_id()
            booking.booking_id = booking.final_booking_id
            booking.status = "confirmed"
            booking.payment_status = "paid"
            booking.payment_mode = "razorpay"
            booking.save()

            BookingPayment.objects.update_or_create(
                booking=booking,
                defaults={
                    "transaction_ref": razorpay_payment_id,
                    "payment_mode": "razorpay",
                    "amount_paid": decimal.Decimal(payment_order.amount) / 100,
                    "payment_date": timezone.now(),
                    "status": "verified",
                },
            )

            receipt = generate_receipt(booking)
            audit_booking(
                booking,
                "payment_success_confirmed",
                old_status,
                old_payment_status,
                f"Razorpay payment {razorpay_payment_id}",
            )

        try:
            receipt_link = f"/api/bookings/{booking.booking_id}/receipt/"
            sms_msg = (
                f"Dear {booking.full_name}, your HSM booking is confirmed. "
                f"Final Booking ID: {booking.booking_id}. Receipt: {receipt_link}. "
                f"Dates: {booking.from_date} to {booking.to_date}. -SMC Solapur"
            )
            send_sms(sms_msg, str(booking.mobile))
        except Exception:
            logger.exception("Failed to send SMS for booking %s", booking.pk)

        return JsonResponse(
            {
                "success": True,
                "message": "Payment verified",
                "finalBookingId": booking.booking_id,
                "receiptNumber": getattr(receipt, "receipt_number", ""),
            }
        )
    except Exception:
        logger.exception("Failed to confirm payment for order %s", razorpay_order_id)
        return JsonResponse(
            {"success": False, "error": "Payment confirmation failed"},
            status=500,
        )


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
    if not webhook_secret:
        logger.error("No RAZORPAY_WEBHOOK_SECRET configured")
        return HttpResponse("Webhook secret not configured", status=500)

    signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
    body = request.body or b""
    computed_signature = hmac.new(
        webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_signature, signature):
        logger.error("Invalid webhook signature")
        return HttpResponse("Invalid signature", status=400)

    try:
        event = json.loads(body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    if event.get("event") == "payment.captured":
        payload = event.get("payload", {})
        payment_entity = payload.get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")
        if order_id:
            try:
                payment = Payment.objects.get(order_id=order_id)
                payment.status = Payment.STATUS_PAID
                payment.razorpay_payment_id = payment_id
                payment.raw_response = json.dumps(payment_entity)
                payment.save()
                logger.info(
                    "Payment %s marked as PAID for order %s", payment_id, order_id
                )
            except Payment.DoesNotExist:
                logger.warning("Webhook payment for unknown order %s", order_id)

    return HttpResponse("ok")


def generate_receipt(booking):
    from apps.payments.models import Receipt

    receipt_number = f"RCT-{booking.booking_id}"
    receipt, _ = Receipt.objects.get_or_create(
        booking=booking,
        defaults={"receipt_number": receipt_number},
    )
    return receipt
