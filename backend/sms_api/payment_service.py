import logging
import os
from django.conf import settings

import razorpay

logger = logging.getLogger(__name__)


def _get_client():
    # Prefer settings (loaded via python-decouple). If empty, fallback to environment vars.
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', None) or os.environ.get('RAZORPAY_KEY_ID')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None) or os.environ.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        logger.error('Razorpay credentials not configured (settings or environment)')
        raise RuntimeError('Razorpay credentials not configured')
    return razorpay.Client(auth=(key_id, key_secret))


def create_order(amount: int, currency: str = 'INR', receipt: str = None) -> dict:
    """Create a Razorpay order. `amount` must be in paise (int).

    Returns dict: {"success": True, "order": order} or {"success": False, "error": str}
    """
    try:
        client = _get_client()
        data = {
            'amount': max(int(amount), 100),  # minimum 100 paise = ₹1
            'currency': currency,
            'receipt': receipt or 'receipt_1',
            'payment_capture': 1,  # auto capture
        }
        logger.info('payment_service.create_order: sending data to razorpay: %s', data)
        order = client.order.create(data=data)
        logger.info('payment_service.create_order: razorpay response: %s', order)
        return {'success': True, 'order': order}
    except Exception as ex:
        logger.error('Error creating Razorpay order: %s', ex, exc_info=True)
        return {'success': False, 'error': str(ex)}


def verify_payment(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """Verify Razorpay payment signature. Returns True if valid, False otherwise."""
    try:
        client = _get_client()
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        }
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError:
        logger.error('Razorpay signature verification failed')
        return False
    except Exception as ex:
        logger.error('Unexpected error verifying Razorpay signature: %s', ex, exc_info=True)
        return False
