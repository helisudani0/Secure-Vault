from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.http import JsonResponse
from .serializers import RegisterSerializer
from .models import CustomUser
from django.shortcuts import render, redirect
from .forms import CustomUserCreationForm
from .rate_limit import login_limiter, signup_limiter


def _get_client_ip(request):
    """Get client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or 'unknown'


def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'register.html', {'form': form})


# ----------------------
# User Registration
# ----------------------
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Rate limiting: 3 signups per hour per IP
        client_ip = _get_client_ip(request)
        if not signup_limiter.is_allowed(client_ip):
            remaining = signup_limiter.get_remaining(client_ip)
            return JsonResponse(
                {
                    "error": "Too many signup attempts. Please try again later.",
                    "remaining_attempts": remaining,
                },
                status=429
            )

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        # Handle both versions of simplejwt safely
        try:
            access = str(refresh.access_token)  # newer versions
        except AttributeError:
            access = str(AccessToken.for_user(user))  # fallback

        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "public_key": user.public_key,
                "encrypted_private_key": user.encrypted_private_key
            },
            "access": access,
            "refresh": str(refresh)
        }, status=status.HTTP_201_CREATED)


# ----------------------
# User Login
# ----------------------
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Rate limiting: 5 login attempts per hour per IP
        client_ip = _get_client_ip(request)
        if not login_limiter.is_allowed(client_ip):
            remaining = login_limiter.get_remaining(client_ip)
            return JsonResponse(
                {
                    "error": "Too many login attempts. Please try again later.",
                    "remaining_attempts": remaining,
                },
                status=429
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        # Handle both versions safely
        try:
            access = str(refresh.access_token)
        except AttributeError:
            access = str(AccessToken.for_user(user))

        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "public_key": user.public_key,
                "encrypted_private_key": user.encrypted_private_key
            },
            "access": access,
            "refresh": str(refresh)
        }, status=status.HTTP_200_OK)


# ----------------------
# Profile View
# ----------------------
class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "public_key": user.public_key
        })


# ----------------------
# Token Refresh
# ----------------------
class TokenRefreshView(APIView):
    """Refresh JWT access token using refresh token"""
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create RefreshToken object from the provided refresh token
            refresh = RefreshToken(refresh_token)
            
            # Generate new access token
            new_access = str(refresh.access_token)
            
            return Response({
                "access": new_access,
                "refresh": str(refresh)  # Can also return new refresh token
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

