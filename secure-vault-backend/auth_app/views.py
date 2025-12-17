from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .serializers import RegisterSerializer
from .models import CustomUser
from django.shortcuts import render, redirect
from .forms import CustomUserCreationForm

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
    def post(self, request):
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
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

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
