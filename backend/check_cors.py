import urllib.request

url = "http://127.0.0.1:8000/api/auth/login/"
req = urllib.request.Request(url, method="OPTIONS")
# Include Origin header to simulate browser preflight
req.add_header("Origin", "http://localhost:63887")
req.add_header("Access-Control-Request-Method", "POST")
req.add_header("Access-Control-Request-Headers", "content-type")
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        print("Status:", resp.status)
        print("Headers:")
        for k, v in resp.getheaders():
            print(f"{k}: {v}")
except Exception as e:
    print("Error:", e)
