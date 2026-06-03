import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

from .sms_service import send_sms


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
