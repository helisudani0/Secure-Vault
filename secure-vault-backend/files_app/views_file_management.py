# files_app/views_file_management.py
"""
File management views for delete, restore, expiration, and sharing controls
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import SecureFile, WrappedKey, FileAccessLog
import logging

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Get client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR', 'unknown')


class FileDeleteView(APIView):
    """Soft delete a file"""
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, file_id):
        try:
            # Get file owned by user
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            # Soft delete
            file_obj.soft_delete()
            
            # Log access
            FileAccessLog.objects.create(
                file=file_obj,
                action='delete',
                by_user=request.user,
                ip_address=_get_client_ip(request)
            )
            
            logger.info(f"File {file_id} deleted by user {request.user.username}")
            return Response({
                "detail": "File deleted successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"File delete error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to delete file"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileRestoreView(APIView):
    """Restore a soft-deleted file"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        try:
            # Get file owned by user
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user,
                is_deleted=True
            )
            
            # Restore
            file_obj.restore()
            
            # Log access
            FileAccessLog.objects.create(
                file=file_obj,
                action='restore',
                by_user=request.user,
                ip_address=_get_client_ip(request)
            )
            
            logger.info(f"File {file_id} restored by user {request.user.username}")
            return Response({
                "detail": "File restored successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"File restore error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to restore file"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileExpireView(APIView):
    """Set or update file expiration"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        try:
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            expires_at = request.data.get('expires_at')
            auto_delete = request.data.get('auto_delete', False)
            
            if expires_at:
                try:
                    # Parse ISO format datetime
                    expire_time = timezone.datetime.fromisoformat(expires_at)
                    file_obj.expires_at = expire_time
                except (ValueError, AttributeError):
                    return Response({
                        "error": "Invalid datetime format. Use ISO format."
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                file_obj.expires_at = None
            
            file_obj.auto_delete = auto_delete
            file_obj.save()
            
            logger.info(f"File {file_id} expiration set by user {request.user.username}")
            return Response({
                "detail": "File expiration updated",
                "expires_at": file_obj.expires_at,
                "auto_delete": file_obj.auto_delete
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"File expiration error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to update expiration"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileDownloadLimitView(APIView):
    """Set download limits on shared files"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        try:
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            download_limit = request.data.get('download_limit')
            
            if download_limit is not None:
                try:
                    download_limit = int(download_limit)
                    if download_limit < 0:
                        return Response({
                            "error": "Download limit must be >= 0"
                        }, status=status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return Response({
                        "error": "Download limit must be an integer"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            file_obj.download_limit = download_limit
            file_obj.save()
            
            logger.info(f"File {file_id} download limit set by user {request.user.username}")
            return Response({
                "detail": "Download limit updated",
                "download_limit": file_obj.download_limit,
                "current_downloads": file_obj.download_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Download limit error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to update download limit"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileAccessLogView(APIView):
    """Get access logs for a file"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        try:
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            logs = FileAccessLog.objects.filter(file=file_obj).order_by('-timestamp')[:100]
            
            return Response({
                "file_id": str(file_obj.id),
                "original_name": file_obj.original_name,
                "logs": [
                    {
                        "id": str(log.id),
                        "action": log.get_action_display(),
                        "by_user": log.by_user.username if log.by_user else None,
                        "ip_address": log.ip_address,
                        "timestamp": log.timestamp.isoformat(),
                        "details": log.details
                    }
                    for log in logs
                ]
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Access log retrieval error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to retrieve access logs"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateShareSettingsView(APIView):
    """Update sharing settings (expiration, reshare permission)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id, recipient_id):
        try:
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            wrapped_key = get_object_or_404(
                WrappedKey,
                file=file_obj,
                recipient_id=recipient_id
            )
            
            # Update settings
            if 'expires_at' in request.data:
                expires_at = request.data.get('expires_at')
                if expires_at:
                    try:
                        wrapped_key.expires_at = timezone.datetime.fromisoformat(expires_at)
                    except (ValueError, AttributeError):
                        return Response({
                            "error": "Invalid datetime format"
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    wrapped_key.expires_at = None
            
            if 'can_reshare' in request.data:
                wrapped_key.can_reshare = request.data.get('can_reshare', False)
            
            wrapped_key.save()
            
            logger.info(f"Share settings updated for file {file_id} by user {request.user.username}")
            return Response({
                "detail": "Share settings updated",
                "expires_at": wrapped_key.expires_at,
                "can_reshare": wrapped_key.can_reshare
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Share settings update error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to update share settings"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RevokeShareView(APIView):
    """Revoke file sharing with a user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, file_id, recipient_id):
        try:
            file_obj = get_object_or_404(
                SecureFile,
                id=file_id,
                owner=request.user
            )
            
            wrapped_key = get_object_or_404(
                WrappedKey,
                file=file_obj,
                recipient_id=recipient_id
            )
            
            recipient_username = wrapped_key.recipient.username
            wrapped_key.delete()
            
            # Log access
            FileAccessLog.objects.create(
                file=file_obj,
                action='unshare',
                by_user=request.user,
                ip_address=_get_client_ip(request),
                details={'revoked_from': recipient_username}
            )
            
            logger.info(f"Share revoked for file {file_id} from user {recipient_username} by {request.user.username}")
            return Response({
                "detail": f"Sharing revoked for {recipient_username}"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Share revocation error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to revoke sharing"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrashListView(APIView):
    """List soft-deleted files"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            files = SecureFile.objects.filter(
                owner=request.user,
                is_deleted=True
            ).values(
                'id', 'original_name', 'size', 'deleted_at'
            ).order_by('-deleted_at')
            
            return Response({
                "files": list(files)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Trash list error: {str(e)}", exc_info=True)
            return Response({
                "error": "Failed to retrieve trash"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
