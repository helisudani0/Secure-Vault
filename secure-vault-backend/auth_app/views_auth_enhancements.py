# auth_app/views_auth_enhancements.py
"""
Additional authentication views for email verification, password reset, and profile management
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import CustomUser
import logging

logger = logging.getLogger(__name__)


# ----------------------
# Email Verification
# ----------------------
class RequestEmailVerificationView(APIView):
    """Request email verification link"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            
            # Check if already verified
            if user.email_verified:
                return Response({
                    "detail": "Email already verified"
                }, status=status.HTTP_200_OK)
            
            # Generate verification token
            token = user.generate_email_verification_token()
            
            # TODO: Send verification email with token
            # For now, just return success
            return Response({
                "detail": "Verification email sent",
                "token": token  # For testing only - remove in production
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Email verification request error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to send verification email"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyEmailView(APIView):
    """Verify email with token"""
    
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
                    "detail": "Email verified successfully"
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": "Token verification failed"
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
    
    def post(self, request):
        try:
            email = request.data.get('email')
            
            if not email:
                return Response({
                    "error": "Email is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                # For security, don't reveal if email exists
                return Response({
                    "detail": "Password reset email sent if account exists"
                }, status=status.HTTP_200_OK)
            
            # Generate password reset token
            token = user.generate_password_reset_token()
            
            # TODO: Send password reset email with token
            # For now, just return success
            return Response({
                "detail": "Password reset email sent",
                "token": token  # For testing only - remove in production
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Password reset request error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to process password reset"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """Reset password with token"""
    
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
                email = request.data.get('email')
                if email != user.email:
                    # Check if email already exists
                    if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
                        return Response({
                            "error": "Email already in use"
                        }, status=status.HTTP_400_BAD_REQUEST)
                    user.email = email
                    user.email_verified = False  # Need to re-verify
            
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
