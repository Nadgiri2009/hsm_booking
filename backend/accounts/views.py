import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger("hsm")


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Log login
        if response.status_code == 200:
            logger.info(
                f"Admin login: {request.data.get('email')} from IP {request.META.get('REMOTE_ADDR')}"
            )
        return response


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"success": True, "message": "Logged out successfully."})
        except Exception as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
            token = get_random_string(48)
            cache.set(f"pwd_reset_{token}", user.id, timeout=3600)

            reset_url = f"{settings.FRONTEND_URL}/admin/reset-password?token={token}"
            send_mail(
                "Password Reset — HSM Admin Portal",
                f"Click to reset your password: {reset_url}\n\nThis link expires in 1 hour.",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response(
            {
                "success": True,
                "message": "If this email exists, a reset link has been sent.",
            }
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        user_id = cache.get(f"pwd_reset_{token}")

        if not user_id:
            return Response(
                {"success": False, "message": "Invalid or expired reset token."},
                status=400,
            )

        try:
            user = User.objects.get(id=user_id)
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            cache.delete(f"pwd_reset_{token}")
            return Response(
                {"success": True, "message": "Password reset successfully."}
            )
        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "User not found."}, status=404
            )


class AdminUserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "superadmin":
            return super().get_queryset()
        return User.objects.filter(id=self.request.user.id)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "superadmin":
            return Response(
                {"message": "Only superadmin can delete users."}, status=403
            )
        return super().destroy(request, *args, **kwargs)
