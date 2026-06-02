"""
Simple SQL Server backup script.

Usage:
  Set env vars: DB_NAME, DB_HOST, DB_USER, DB_PASSWORD, BACKUP_PATH (absolute path on DB server)
  Then run: python backup_db.py

Note: BACKUP TO DISK runs on the database server and requires SQL Server service account access to the target path.
"""
import os
import sys
import pyodbc


def main() -> int:
    db_name = os.environ.get("DB_NAME") or os.environ.get("DATABASE_NAME")
    host = os.environ.get("DB_HOST")
    user = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASSWORD")
    backup_path = os.environ.get("BACKUP_PATH")

    if not all([db_name, host, user, password, backup_path]):
        print("Required environment variables: DB_NAME, DB_HOST, DB_USER, DB_PASSWORD, BACKUP_PATH")
        return 2

    conn_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={host};UID={user};PWD={password};Encrypt=no;TrustServerCertificate=yes;"
    )

    try:
        with pyodbc.connect(conn_str, autocommit=True) as conn:
            cursor = conn.cursor()
            sql = f"BACKUP DATABASE [{db_name}] TO DISK = N'{backup_path}' WITH NOFORMAT, NOINIT, NAME = N'{db_name}-full', SKIP, NOREWIND, NOUNLOAD, STATS = 10"
            print("Running:", sql)
            cursor.execute(sql)
            print("Backup started — check SQL Server for progress and completion.")
            return 0
    except Exception as e:
        print("Backup failed:", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
