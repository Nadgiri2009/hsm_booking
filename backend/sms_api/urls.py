from django.urls import path
from .views import send_sms_view

urlpatterns = [
    path('api/send-sms/', send_sms_view, name='send_sms'),
]
