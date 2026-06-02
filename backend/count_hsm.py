import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()
from django.db import connection

cur = connection.cursor()
for tbl in ["hsm_bookings", "hsm_premises", "hsm_admin_users"]:
    cur.execute(f"SELECT COUNT(*) FROM {tbl}")
    print(tbl, cur.fetchone()[0])
