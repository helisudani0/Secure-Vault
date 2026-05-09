import logging

from django.conf import settings
from django.db import transaction
from django.db.models import F, Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from auth_app.models import CustomUser
from auth_app.rate_limit import file_upload_limiter

from .models import FileAccessLog, SecureFile, WrappedKey, detect_file_category, file_extension
from .serializers import (
    FileListSerializer,
    FileShareSerializer,
    SecureFileSerializer,
    WrappedKeySerializer,
)
from .validators import sanitize_filename, validate_filename

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


class FileUploadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SecureFileSerializer

    @transaction.atomic
    def post(self, request):
        client_ip = _get_client_ip(request)
        limiter_key = f"{request.user.id}:{client_ip}"
        if not file_upload_limiter.is_allowed(limiter_key):
            return Response(
                {
                    "error": "Daily upload limit reached. Please try again later.",
                    "remaining_attempts": file_upload_limiter.get_remaining(limiter_key),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        uploaded_file = request.FILES.get("file")
        aes_key_owner_wrapped = request.data.get("aes_key_owner_wrapped")
        iv = request.data.get("iv")

        if not uploaded_file or not aes_key_owner_wrapped or not iv:
            raise ValidationError({"error": "file, aes_key_owner_wrapped, and iv are required"})

        if uploaded_file.size <= 0:
            raise ValidationError({"file": "File is empty"})
        if uploaded_file.size > settings.MAX_FILE_SIZE:
            raise ValidationError({"file": "File exceeds the configured upload limit"})

        active_file_count = SecureFile.objects.filter(owner=request.user, is_deleted=False).count()
        if active_file_count >= settings.MAX_FILES_PER_USER:
            raise ValidationError({"file": "File count limit reached"})
        if not request.user.can_upload(uploaded_file.size):
            raise ValidationError({"file": "Storage limit reached"})

        validate_filename(uploaded_file.name)
        sanitized_name = sanitize_filename(uploaded_file.name)
        category = detect_file_category(sanitized_name)
        extension = file_extension(sanitized_name)

        serializer = self.get_serializer(
            data={
                "original_name": sanitized_name,
                "category": category,
                "extension": extension,
                "size": uploaded_file.size,
                "aes_key_owner_wrapped": aes_key_owner_wrapped,
                "iv": iv,
            }
        )
        serializer.is_valid(raise_exception=True)

        file_obj = SecureFile.objects.create(
            owner=request.user,
            file=uploaded_file,
            original_name=sanitized_name,
            category=category,
            extension=extension,
            size=uploaded_file.size,
            aes_key_owner_wrapped=serializer.validated_data["aes_key_owner_wrapped"],
            iv=serializer.validated_data["iv"],
        )

        CustomUser.objects.filter(pk=request.user.pk).update(
            storage_used_bytes=F("storage_used_bytes") + uploaded_file.size
        )
        FileAccessLog.objects.create(
            file=file_obj,
            action="upload",
            by_user=request.user,
            ip_address=client_ip,
        )

        logger.info("File uploaded: %s by user %s", file_obj.id, request.user.username)
        return Response(SecureFileSerializer(file_obj).data, status=status.HTTP_201_CREATED)


class FileListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FileListSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        return (
            SecureFile.objects.filter(
                Q(owner=user)
                | Q(wrapped_keys__recipient=user, wrapped_keys__expires_at__isnull=True)
                | Q(wrapped_keys__recipient=user, wrapped_keys__expires_at__gt=now),
                is_deleted=False,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .distinct()
            .select_related("owner")
            .order_by("-uploaded_at")
        )


class FileDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def get(self, request, pk):
        file_obj = get_object_or_404(SecureFile.objects.select_for_update(), pk=pk)

        if not file_obj.can_download():
            raise PermissionDenied("File is no longer available")

        wrapped_key = None
        if file_obj.owner_id == request.user.id:
            wrapped_key = file_obj.aes_key_owner_wrapped
        else:
            wrapped_key_obj = WrappedKey.objects.filter(
                file=file_obj,
                recipient=request.user,
            ).select_related("file").first()
            if not wrapped_key_obj or not wrapped_key_obj.is_active():
                raise PermissionDenied("Access denied")
            wrapped_key = wrapped_key_obj.wrapped_key

        SecureFile.objects.filter(pk=file_obj.pk).update(download_count=F("download_count") + 1)
        FileAccessLog.objects.create(
            file=file_obj,
            action="download",
            by_user=request.user,
            ip_address=_get_client_ip(request),
        )

        response = FileResponse(file_obj.file.open("rb"), filename=file_obj.original_name)
        response["X-Wrapped-Key"] = wrapped_key
        response["X-IV"] = file_obj.iv
        return response


class GetWrappedKeyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_obj = get_object_or_404(SecureFile.objects.select_related("owner"), pk=pk, is_deleted=False)

        if not file_obj.is_active():
            raise PermissionDenied("File is no longer available")

        if file_obj.owner_id == request.user.id:
            wrapped_key = file_obj.aes_key_owner_wrapped
        else:
            wrapped_key_obj = WrappedKey.objects.filter(
                file=file_obj,
                recipient=request.user,
            ).first()
            if not wrapped_key_obj or not wrapped_key_obj.is_active():
                raise PermissionDenied("Access denied")
            wrapped_key = wrapped_key_obj.wrapped_key

        FileAccessLog.objects.create(
            file=file_obj,
            action="view_metadata",
            by_user=request.user,
            ip_address=_get_client_ip(request),
        )
        return Response({"wrapped_key": wrapped_key, "iv": file_obj.iv}, status=status.HTTP_200_OK)


class ShareFileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user, is_deleted=False)
        if not file_obj.is_active():
            raise PermissionDenied("File is no longer available")

        serializer = FileShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        recipient_username = serializer.validated_data["recipient_username"]
        wrapped_key_for_recipient = serializer.validated_data["wrapped_key_for_recipient"]

        if recipient_username.lower() == request.user.username.lower():
            raise ValidationError({"recipient_username": "Cannot share a file with yourself"})

        recipient = get_object_or_404(CustomUser, username__iexact=recipient_username)
        if not recipient.public_key:
            raise ValidationError({"recipient_username": "Recipient has not created encryption keys"})

        wrapped_key, created = WrappedKey.objects.update_or_create(
            file=file_obj,
            recipient=recipient,
            defaults={"wrapped_key": wrapped_key_for_recipient},
        )

        FileAccessLog.objects.create(
            file=file_obj,
            action="share",
            by_user=request.user,
            ip_address=_get_client_ip(request),
            details={"recipient": recipient.username, "created": created},
        )

        logger.info(
            "File shared: %s from %s to %s",
            pk,
            request.user.username,
            recipient.username,
        )
        return Response(
            {
                "message": "File shared successfully",
                "wrapped_key_id": wrapped_key.id,
                "recipient_username": recipient.username,
            },
            status=status.HTTP_201_CREATED,
        )


class FileDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user, is_deleted=False)
        file_obj.soft_delete()
        FileAccessLog.objects.create(
            file=file_obj,
            action="delete",
            by_user=request.user,
            ip_address=_get_client_ip(request),
        )
        return Response({"message": "File moved to trash"}, status=status.HTTP_200_OK)


class SharedWithMeView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WrappedKeySerializer
    pagination_class = None

    def get_queryset(self):
        now = timezone.now()
        return (
            WrappedKey.objects.filter(
                recipient=self.request.user,
                file__is_deleted=False,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .filter(Q(file__expires_at__isnull=True) | Q(file__expires_at__gt=now))
            .select_related("file", "file__owner", "recipient")
            .order_by("-created_at")
        )
