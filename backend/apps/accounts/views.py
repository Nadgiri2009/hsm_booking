from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import AdminUserSerializer, CustomTokenObtainPairSerializer


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)  # type: ignore[assignment]
    # mypy: TokenViewBase defines serializer_class as None by default; annotate to avoid a type error
    serializer_class = CustomTokenObtainPairSerializer  # type: ignore[assignment]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logged out successfully"})
        except Exception:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)
