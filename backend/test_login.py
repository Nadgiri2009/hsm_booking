def main() -> None:
    import requests

    url = "http://localhost:8000/api/auth/login/"
    data = {"email": "admin@solapurcorp.gov.in", "password": "Admin@12345"}
    resp = requests.post(url, json=data)
    print(resp.status_code, resp.text)


if __name__ == "__main__":
    main()
