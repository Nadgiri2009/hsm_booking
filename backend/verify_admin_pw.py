import os
import sys
import django

# Ensure project and inner apps folder are on sys.path so app modules import correctly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
APPS_DIR = os.path.join(BASE_DIR, 'apps')
if APPS_DIR not in sys.path:
    sys.path.insert(0, APPS_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hsm_project.settings')

django.setup()

from apps.accounts.models import AdminUser

def main():
    u = AdminUser.objects.filter(email='admin@solapurcorp.gov.in').first()
    print('Admin user exists:', bool(u))
    if not u:
        return
    print('id:', u.id)
    print('email:', u.email)
    print('is_active:', u.is_active)
    print("check_password('Admin@12345'):", u.check_password('Admin@12345'))

if __name__ == '__main__':
    main()
