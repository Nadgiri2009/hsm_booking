from django.urls import path
from . import views

urlpatterns = [
    path('api/send-sms/', views.send_sms_view, name='send_sms'),
    path('api/payment/create/', views.create_payment_order, name='create_payment_order'),
    path('api/payment/verify/', views.verify_payment_view, name='verify_payment_view'),
    path('api/payment/webhook/', views.razorpay_webhook, name='razorpay_webhook'),
]
