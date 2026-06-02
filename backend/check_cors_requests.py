import requests

url = "http://127.0.0.1:8000/"
headers = {
    "Origin": "http://localhost:63887",
}
try:
    resp = requests.options(url, headers=headers, timeout=5)
    print("Status:", resp.status_code)
    print("Headers:")
    for k, v in resp.headers.items():
        print(f"{k}: {v}")
except Exception as e:
    print("Error:", e)
