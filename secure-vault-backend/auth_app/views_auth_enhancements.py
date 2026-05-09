# auth_app/views_auth_enhancements.py
"""
Additional authentication views for email verification, password reset, and profile management
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import CustomUser
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from .rate_limit import email_verification_limiter, password_reset_limiter

logger = logging.getLogger(__name__)


DEV_EMAIL_BACKENDS = {
    'django.core.mail.backends.console.EmailBackend',
    'django.core.mail.backends.locmem.EmailBackend',
    'django.core.mail.backends.filebased.EmailBackend',
}


def _email_backend_allows_preview():
    return settings.EMAIL_BACKEND in DEV_EMAIL_BACKENDS


def _email_response(detail, url=None):
    payload = {"detail": detail}
    if url and _email_backend_allows_preview():
        payload["verification_url"] = url
    return payload


# ----------------------
# Email Verification
# ----------------------
class RequestEmailVerificationView(APIView):
    """Request email verification link"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            rate_limit_key = f"{user.id}:{request.META.get('REMOTE_ADDR', 'unknown')}"
            if not email_verification_limiter.is_allowed(rate_limit_key):
                return Response({
                    "error": "Too many verification emails requested. Please try again later."
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Check if already verified
            if user.email_verified:
                return Response({
                    "detail": "Email already verified"
                }, status=status.HTTP_200_OK)

            if not user.email:
                return Response({
                    "error": "Add an email address before requesting verification"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = user.generate_email_verification_token()

            verification_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"
            send_mail(
                subject="Verify your Ciphra email",
                message=(
                    "Verify your Ciphra email address by opening this link:\n\n"
                    f"{verification_url}\n\n"
                    "This link expires in 24 hours. If you did not request this, you can ignore it."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response(
                _email_response("Verification email sent", verification_url),
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            logger.error(f"Email verification request error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to send verification email"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyEmailView(APIView):
    """Verify email with token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            token = request.data.get('token')
            
            if not token:
                return Response({
                    "error": "Token is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find user with this token
            try:
                user = CustomUser.objects.get(email_verification_token=token)
            except CustomUser.DoesNotExist:
                return Response({
                    "error": "Invalid or expired token"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify email
            if user.verify_email(token):
                return Response({
                    "detail": "Email verified successfully",
                    "username": user.username,
                    "email": user.email,
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": "Token expired. Request a new verification email."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Email verification error: {str(e)}", exc_info=True)
            return Response({
                "error": "Verification failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------
# Password Reset
# ----------------------
class RequestPasswordResetView(APIView):
    """Request password reset link"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            email = (request.data.get('email') or '').strip().lower()
            
            if not email:
                return Response({
                    "error": "Email is required"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_email(email)
            except DjangoValidationError:
                return Response({
                    "detail": "Password reset email sent if account exists"
                }, status=status.HTTP_200_OK)

            rate_limit_key = f"{email}:{request.META.get('REMOTE_ADDR', 'unknown')}"
            if not password_reset_limiter.is_allowed(rate_limit_key):
                return Response({
                    "error": "Too many password reset requests. Please try again later."
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            try:
                user = CustomUser.objects.get(email__iexact=email, email_verified=True)
            except CustomUser.DoesNotExist:
                # For security, don't reveal if email exists
                return Response({
                    "detail": "Password reset email sent if account exists"
                }, status=status.HTTP_200_OK)
            
            token = user.generate_password_reset_token()

            reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
            send_mail(
                subject="Reset your Ciphra password",
                message=(
                    "Reset your Ciphra password by opening this link:\n\n"
                    f"{reset_url}\n\n"
                    "This link expires in 1 hour. If you did not request this, you can ignore it."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            payload = {"detail": "Password reset email sent"}
            if _email_backend_allows_preview():
                payload["reset_url"] = reset_url
            return Response(payload, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset request error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to process password reset"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """Reset password with token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            token = request.data.get('token')
            new_password = request.data.get('new_password')
            
            if not token or not new_password:
                return Response({
                    "error": "Token and new_password are required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate password
            from .validators import validate_password_strength
            try:
                validate_password_strength(new_password)
            except Exception as e:
                return Response({
                    "error": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find user and verify token
            try:
                user = CustomUser.objects.get(password_reset_token=token)
            except CustomUser.DoesNotExist:
                return Response({
                    "error": "Invalid or expired token"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify token is still valid
            if not user.verify_password_reset_token(token):
                return Response({
                    "error": "Token expired"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_sent_at = None
            user.save()
            
            logger.info(f"Password reset for user {user.username}")
            return Response({
                "detail": "Password reset successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            return Response({
                "error": "Password reset failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------
# Profile Management
# ----------------------
class UpdateProfileView(APIView):
    """Update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request):
        try:
            user = request.user
            
            # Update allowed fields
            if 'email' in request.data:
                email = (request.data.get('email') or '').strip().lower()
                if email:
                    try:
                        validate_email(email)
                    except DjangoValidationError:
                        return Response({
                            "error": "Enter a valid email address"
                        }, status=status.HTTP_400_BAD_REQUEST)

                if email != user.email:
                    # Check if email already exists
                    if email and CustomUser.objects.filter(email__iexact=email).exclude(id=user.id).exists():
                        return Response({
                            "error": "Email already in use"
                        }, status=status.HTTP_400_BAD_REQUEST)
                    user.email = email
                    user.email_verified = False  # Need to re-verify
                    user.email_verification_token = None
                    user.email_verification_sent_at = None
            
            if 'first_name' in request.data:
                user.first_name = request.data.get('first_name')
            
            if 'last_name' in request.data:
                user.last_name = request.data.get('last_name')
            
            user.save()
            logger.info(f"Profile updated for user {user.username}")
            
            return Response({
                "detail": "Profile updated successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email_verified": user.email_verified,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile update error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to update profile"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StorageUsageView(APIView):
    """Get user storage usage info"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            "storage_used_bytes": user.storage_used_bytes,
            "max_storage_bytes": user.max_storage_bytes,
            "usage_percent": user.get_storage_usage_percent(),
            "can_upload": user.can_upload(1024 * 1024)  # 1MB test
        }, status=status.HTTP_200_OK)
