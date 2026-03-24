import requests

url = 'http://127.0.0.1:8000/api/auth/login/'
payload = {
    'email': 'admin@solapurcorp.gov.in',
    'password': 'Admin@12345'
}

try:
    resp = requests.post(url, json=payload, timeout=10)
    print('Status code:', resp.status_code)
    print('Response headers:')
    for k, v in resp.headers.items():
        print(f'{k}: {v}')
    print('\nResponse body:')
    print(resp.text)
except Exception as e:
    print('Request error:', e)
