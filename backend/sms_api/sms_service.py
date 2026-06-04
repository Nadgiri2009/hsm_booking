import logging
import requests
import urllib.parse
from decouple import config

logger = logging.getLogger(__name__)

# Read credentials from environment via python-decouple (.env)
SMS_APPID = config('SMS_APPID', default='')
SMS_PASS = config('SMS_PASS', default='')
SMS_SENDER = config('SMS_SENDER', default='MAHGOV')


def send_sms(sms_msg: str, mobile_no: str, dlt_te_id: str = None) -> dict:
    """Send SMS using ACL gateway. Returns a dict with status and raw response.

    This function is intentionally small and uses GET to the provider's endpoint.
    """
    try:
        base_url = 'https://push3.aclgateway.com/servlet/com.aclwireless.pushconnectivity.listeners.TextListener'
        params = {
            'appid': 'MahaItsomc',
            'userId': 'MahaItsomc',
            'pass': 'mitsomc_10',
            'contenttype': '1',
            'from': SMS_SENDER,
            'to': f'91{mobile_no}',
            'text': sms_msg,
            'alert': '1',
            'selfid': 'true',
            'dlrreq': 'true',
        }
        if dlt_te_id:
            params['dtm'] = dlt_te_id

        # build safe URL
        url = base_url + '?' + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)

        resp = requests.get(url, timeout=15)
        resp.raise_for_status()

        return {
            'status': 'success',
            'http_status': resp.status_code,
            'provider_response': resp.text,
        }
    except Exception as exc:
        logger.exception('Error sending SMS')
        return {
            'status': 'error',
            'error': str(exc),
        }
