import logging
import requests
import socket
import urllib.parse
from decouple import config

logger = logging.getLogger(__name__)

SMS_APPID     = config('SMS_APPID',     default='MahaITsomc')
SMS_USER      = config('SMS_USER',      default='MahaITsomc')
SMS_PASS      = config('SMS_PASS',      default='mitsomc_10')
SMS_SENDER    = config('SMS_SENDER',    default='MAHGOV')
SMS_DLT_TE_ID = config('SMS_DLT_TE_ID', default='1307162038357069431')  # DLT Template ID for booking confirmation (update as needed)

# Force IPv4 — ACL gateway does not support IPv6
original_getaddrinfo = socket.getaddrinfo

def ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

socket.getaddrinfo = ipv4_getaddrinfo


def send_sms(sms_msg: str, mobile_no: str, dlt_te_id: str = None) -> dict:
    try:
        base_url = 'http://push3.aclgateway.com/servlet/com.aclwireless.pushconnectivity.listeners.TextListener'
        params = {
            'appid':       SMS_APPID,
            'userId':      SMS_USER,
            'pass':        SMS_PASS,
            'contenttype': '1',
            'from':        SMS_SENDER,
            'to':          f'91{mobile_no}',
            'text':        sms_msg,
            'alert':       '1',
            'selfid':      'true',
            'dlrreq':      'true',
        }

        te_id = dlt_te_id or SMS_DLT_TE_ID
        if te_id:
            params['dtm'] = te_id

        url = base_url + '?' + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
        logger.info(f"Sending SMS to {mobile_no}")

        resp = requests.get(url, timeout=15)
        resp.raise_for_status()

        logger.info(f"SMS response: {resp.text}")
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
    finally:
        # Restore original DNS resolution
        socket.getaddrinfo = original_getaddrinfo