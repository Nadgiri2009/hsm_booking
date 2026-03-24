from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, ProfileView

urlpatterns = [
    re_path(r'^login/?$', LoginView.as_view(), name='login'),
    re_path(r'^logout/?$', LogoutView.as_view(), name='logout'),
    re_path(r'^refresh/?$', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^profile/?$', ProfileView.as_view(), name='profile'),
]
