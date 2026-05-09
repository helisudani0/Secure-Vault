from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.shortcuts import redirect, render
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .forms import CustomUserCreationForm
from .models import CustomUser
from .rate_limit import login_limiter, signup_limiter
from .serializers import LoginSerializer, RegisterSerializer


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or "unknown"


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "public_key": user.public_key,
        "encrypted_private_key": user.encrypted_private_key,
        "email_verified": user.email_verified,
        "storage_used_bytes": user.storage_used_bytes,
        "max_storage_bytes": user.max_storage_bytes,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _token_payload(user):
    refresh = RefreshToken.for_user(user)
    try:
        access = str(refresh.access_token)
    except AttributeError:
        access = str(AccessToken.for_user(user))
    return {
        "user": _user_payload(user),
        "access": access,
        "refresh": str(refresh),
    }


def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.html", {"form": form})


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        client_ip = _get_client_ip(request)
        if not signup_limiter.is_allowed(client_ip):
            return JsonResponse(
                {
                    "error": "Too many signup attempts. Please try again later.",
                    "remaining_attempts": signup_limiter.get_remaining(client_ip),
                },
                status=429,
            )

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.last_login_ip = client_ip
        user.save(update_fields=["last_login_ip"])

        return Response(_token_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        client_ip = _get_client_ip(request)
        if not login_limiter.is_allowed(client_ip):
            return JsonResponse(
                {
                    "error": "Too many login attempts. Please try again later.",
                    "remaining_attempts": login_limiter.get_remaining(client_ip),
                },
                status=429,
            )

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if user.account_locked:
            return Response(
                {"detail": user.lock_reason or "Account is locked"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login_ip = client_ip
        user.save(update_fields=["last_login_ip"])
        return Response(_token_payload(user), status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user), status=status.HTTP_200_OK)


class PublicKeyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        try:
            user = CustomUser.objects.only("username", "public_key").get(username__iexact=username)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user.public_key:
            return Response(
                {"detail": "User has not created encryption keys"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"username": user.username, "public_key": user.public_key},
            status=status.HTTP_200_OK,
        )


class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response(
                {"access": str(refresh.access_token), "refresh": str(refresh)},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
