# files_app/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import SecureFile, WrappedKey
from .serializers import (
    SecureFileSerializer,
    FileListSerializer,
    WrappedKeySerializer,
    FileShareSerializer,
)
from .validators import validate_filename, sanitize_filename
from django.http import FileResponse, Http404
import logging

logger = logging.getLogger(__name__)


class FileUploadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SecureFileSerializer

    def post(self, request):
        try:
            uploaded_file = request.FILES.get('file')
            aes_key_owner_wrapped = request.data.get('aes_key_owner_wrapped')
            iv = request.data.get('iv')

            # Validate inputs
            if not uploaded_file or not aes_key_owner_wrapped or not iv:
                return Response(
                    {'error': 'file, aes_key_owner_wrapped, and iv are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate filename
            try:
                validate_filename(uploaded_file.name)
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Sanitize filename
            sanitized_name = sanitize_filename(uploaded_file.name)

            # Create file record
            file_obj = SecureFile.objects.create(
                owner=request.user,
                file=uploaded_file,
                original_name=sanitized_name,
                size=uploaded_file.size,
                aes_key_owner_wrapped=aes_key_owner_wrapped,
                iv=iv
            )
            
            logger.info(f"File uploaded: {file_obj.id} by user {request.user.username}")
            return Response(SecureFileSerializer(file_obj).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"File upload error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FileListSerializer
    pagination_class = None  # Use default from settings

    def get_queryset(self):
        """
        Optimized query:
        - Owned files: simple filter with user
        - Shared files: prefetch wrapped keys for efficiency
        - No N+1 queries (all joins in one query)
        """
        user = self.request.user
        
        # Get owned files
        owned = SecureFile.objects.filter(
            owner=user
        ).values_list('id', flat=True)
        
        # Get shared files via wrapped keys (uses index on recipient)
        shared = SecureFile.objects.filter(
            wrappedkey__recipient=user
        ).distinct()
        
        # Combine both querysets
        # Using Q objects for cleaner filtering
        from django.db.models import Q
        queryset = SecureFile.objects.filter(
            Q(owner=user) | Q(wrappedkey__recipient=user)
        ).distinct().select_related('owner').order_by('-uploaded_at')
        
        return queryset


class FileDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = get_object_or_404(SecureFile, pk=pk)
            
            # Check access permissions
            is_owner = file_obj.owner == request.user
            is_shared = WrappedKey.objects.filter(
                file=file_obj,
                recipient=request.user
            ).exists()

            if not is_owner and not is_shared:
                logger.warning(
                    f"Unauthorized file download attempt: {pk} by user {request.user.username}"
                )
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get wrapped key
            if is_owner:
                wrapped_key = file_obj.aes_key_owner_wrapped
            else:
                wrapped_key_obj = WrappedKey.objects.get(
                    file=file_obj,
                    recipient=request.user
                )
                wrapped_key = wrapped_key_obj.wrapped_key

            # Return file with wrapped key in headers
            response = FileResponse(
                file_obj.file.open('rb'),
                filename=file_obj.original_name
            )
            response['X-WRAPPED-KEY'] = wrapped_key
            response['X-IV'] = file_obj.iv
            
            logger.info(f"File downloaded: {pk} by user {request.user.username}")
            return response

        except Exception as e:
            logger.error(f"File download error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to download file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetWrappedKeyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = get_object_or_404(SecureFile, pk=pk)
            
            if file_obj.owner == request.user:
                return Response({
                    'wrapped_key': file_obj.aes_key_owner_wrapped,
                    'iv': file_obj.iv
                })
            
            wk = WrappedKey.objects.filter(
                file=file_obj,
                recipient=request.user
            ).first()
            
            if not wk:
                return Response(
                    {'error': 'No wrapped key found'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response({
                'wrapped_key': wk.wrapped_key,
                'iv': file_obj.iv
            })

        except Exception as e:
            logger.error(f"Get wrapped key error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve wrapped key'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShareFileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user)
            
            # Validate input
            serializer = FileShareSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            recipient_username = serializer.validated_data['recipient_username']
            wrapped_key_for_recipient = serializer.validated_data['wrapped_key_for_recipient']

            # Prevent self-sharing
            if recipient_username == request.user.username:
                return Response(
                    {'error': 'Cannot share file with yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get recipient user
            from auth_app.models import CustomUser
            try:
                recipient = CustomUser.objects.get(username=recipient_username)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Recipient user not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not recipient.public_key:
                return Response(
                    {'error': 'Recipient has not set up encryption keys'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create or update wrapped key
            wk, _ = WrappedKey.objects.update_or_create(
                file=file_obj,
                recipient=recipient,
                defaults={'wrapped_key': wrapped_key_for_recipient}
            )
            
            logger.info(
                f"File shared: {pk} from {request.user.username} to {recipient_username}"
            )
            return Response({
                'message': 'File shared successfully',
                'wrapped_key_id': wk.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"File share error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to share file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user)
            filename = file_obj.original_name
            file_obj.file.delete(save=False)
            file_obj.delete()
            
            logger.info(f"File deleted: {pk} ({filename}) by user {request.user.username}")
            return Response(
                {'message': 'File deleted successfully'},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"File delete error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to delete file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SharedWithMeView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WrappedKeySerializer

    def get_queryset(self):
        return WrappedKey.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')

