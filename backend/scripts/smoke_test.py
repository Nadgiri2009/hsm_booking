import requests
import sys


def main(url: str = "http://localhost:8000/") -> int:
    try:
        r = requests.get(url, timeout=5)
        print(r.status_code, r.text[:200])
        return 0 if r.status_code < 500 else 2
    except Exception as e:
        print("smoke test failed:", e)
        return 1


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
