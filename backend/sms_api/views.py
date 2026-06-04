import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.decorators.http import require_POST
from django.http import HttpResponse
import hmac
import hashlib
import logging

from .sms_service import send_sms
from .payment_service import create_order, verify_payment
from .models import Payment

logger = logging.getLogger(__name__)


@csrf_exempt
def send_sms_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    sms_msg = payload.get('smsMsg')
    mobile_no = payload.get('mobileNo')
    dlt_te_id = payload.get('dltTeId')

    if not sms_msg or not mobile_no:
        return HttpResponseBadRequest('smsMsg and mobileNo are required')

    result = send_sms(sms_msg, mobile_no, dlt_te_id)

    status_code = 200 if result.get('status') == 'success' else 500
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
        # amount coming from front-end is expected in paise (integer)
        amount_int = int(amount)
    except Exception:
        return HttpResponseBadRequest('amount must be an integer (paise)')

    res = create_order(amount_int, currency, receipt)
    if not res.get('success'):
        return JsonResponse({'error': res.get('error')}, status=500)

    order = res.get('order')
    # persist payment order in DB
    try:
        Payment.objects.create(
            order_id=order.get('id'),
            amount=order.get('amount'),
            currency=order.get('currency'),
            receipt=receipt,
            status=Payment.STATUS_CREATED,
            raw_response=json.dumps(order),
        )
    except Exception:
        logger.exception('Failed to create Payment record')
    return JsonResponse({
        'orderId': order.get('id'),
        'amount': order.get('amount'),
        'currency': order.get('currency'),
        'keyId': getattr(settings, 'RAZORPAY_KEY_ID', ''),
    })


@csrf_exempt
@require_POST
def verify_payment_view(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    razorpay_order_id = payload.get('razorpay_order_id')
    razorpay_payment_id = payload.get('razorpay_payment_id')
    razorpay_signature = payload.get('razorpay_signature')

    if not (razorpay_order_id and razorpay_payment_id and razorpay_signature):
        return HttpResponseBadRequest('Missing required fields')

    ok = verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if ok:
        # update DB order status to PAID
        try:
            p = Payment.objects.get(order_id=razorpay_order_id)
            p.status = Payment.STATUS_PAID
            p.razorpay_payment_id = razorpay_payment_id
            p.razorpay_signature = razorpay_signature
            p.save()
        except Payment.DoesNotExist:
            logger.warning('Payment record not found for order %s', razorpay_order_id)

        return JsonResponse({'success': True, 'message': 'Payment verified'})
    else:
        return JsonResponse({'success': False, 'error': 'Signature verification failed'}, status=400)


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    # Validate webhook signature using HMAC SHA256
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None)
    if not webhook_secret:
        logger.error('No RAZORPAY_WEBHOOK_SECRET configured')
        return HttpResponse('Webhook secret not configured', status=500)

    signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
    body = request.body or b''

    computed_signature = hmac.new(
        webhook_secret.encode('utf-8'), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_signature, signature):
        logger.error('Invalid webhook signature')
        return HttpResponse('Invalid signature', status=400)

    try:
        event = json.loads(body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    # handle payment.captured
    if event.get('event') == 'payment.captured':
        payload = event.get('payload', {})
        payment_entity = payload.get('payment', {}).get('entity', {})
        order_id = payment_entity.get('order_id')
        payment_id = payment_entity.get('id')
        # mark DB order as paid
        if order_id:
            try:
                p = Payment.objects.get(order_id=order_id)
                p.status = Payment.STATUS_PAID
                p.razorpay_payment_id = payment_id
                p.raw_response = json.dumps(payment_entity)
                p.save()
                logger.info('Payment %s marked as PAID for order %s', payment_id, order_id)
            except Payment.DoesNotExist:
                logger.warning('Webhook payment for unknown order %s', order_id)

    return HttpResponse('ok')
