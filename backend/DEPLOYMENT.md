Deployment checklist

- Set environment variables on the server:
  - `DEBUG=False`
  - `SECRET_KEY` (secure random value)
  - `ALLOWED_HOSTS` (comma-separated hostnames)
  - Database credentials (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` or use existing `DATABASES` override)
  - `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` for SMTP
  - `SECURE_SSL_REDIRECT=True` (if behind HTTPS)

- Create virtualenv and install pinned dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-frozen.txt
```

- Run migrations and collect static files:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

- Create a superuser (if needed):

```bash
python manage.py createsuperuser
```

- Configure process manager and web server (example using `gunicorn`):

```bash
gunicorn config.wsgi:application --workers 3 --bind 0.0.0.0:8000
```

- Configure HTTPS (reverse proxy with Nginx or AWS ALB); ensure `SECURE_SSL_REDIRECT` and HSTS are enabled.

- Backups: schedule database backups and media backups. For Django managed data, `python manage.py dumpdata` can be used as a simple export but prefer DB-level backups for production.

- Monitoring & Logging: configure logging to a central store and set up health checks.

- Smoke test: run the script `backend/scripts/smoke_test.py` to verify website responds.

