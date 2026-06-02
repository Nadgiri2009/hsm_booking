import pyodbc

conn_str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost\\SQLEXPRESS02;DATABASE=HSMBookingDB;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;"
print(conn_str)
try:
    cnxn = pyodbc.connect(conn_str)
    print("connected")
    cnxn.close()
except Exception as e:
    print("error", e)
