# auth_app/urls.py

from django.urls import path
from .views import RegisterView, LoginView, ProfileView, TokenRefreshView, register
from .views_auth_enhancements import (
    RequestEmailVerificationView,
    VerifyEmailView,
    RequestPasswordResetView,
    ResetPasswordView,
    UpdateProfileView,
    StorageUsageView,
)

urlpatterns = [
    # Authentication
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', register, name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile
    path('me/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update_profile'),
    path('storage-usage/', StorageUsageView.as_view(), name='storage_usage'),
    
    # Email verification
    path('email/verify/request/', RequestEmailVerificationView.as_view(), name='request_email_verification'),
    path('email/verify/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Password reset
    path('password/reset/request/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('password/reset/', ResetPasswordView.as_view(), name='reset_password'),
]

