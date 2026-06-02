import os

import django
from django.conf import settings
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

if __name__ == "__main__":
    django.setup()
    print("DB settings:", settings.DATABASES["default"])
    print("connection.NAME:", connection.settings_dict.get("NAME"))
    with connection.cursor() as c:
        c.execute("SELECT DB_NAME()")
        print("current DB:", c.fetchone())
    # list tables via Django introspection
    tables = connection.introspection.table_names()
    print("tables in database:", tables)
    # show column descriptions for each table
    for tbl in tables:
        try:
            desc = connection.introspection.get_table_description(
                connection.cursor(), tbl
            )
            print(f"\n{tbl} columns:")
            for col in desc:
                # column info: name, type_code, display_size, internal_size, precision, scale, null_ok
                print(" ", col[0], col[1])
        except Exception as e:
            print(f"couldn't describe {tbl}: {e}")
    # check row counts for a couple of tables
    for tbl in ["Bookings", "Premises", "AdminUsers"]:
        with connection.cursor() as c:
            try:
                c.execute(f"SELECT COUNT(*) FROM {tbl}")
                print(f"{tbl} row count:", c.fetchone()[0])
            except Exception as e:
                print(f"couldn't count {tbl}: {e}")
