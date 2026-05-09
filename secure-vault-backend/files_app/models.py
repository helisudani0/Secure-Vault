# files_app/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


def user_directory_path(instance, filename):
    return f"user_{instance.owner.id}/{uuid.uuid4().hex}_{filename}"


class SecureFile(models.Model):
    """
    Encrypted file storage with soft delete and expiration support
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="secure_files")
    file = models.FileField(upload_to=user_directory_path)
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    aes_key_owner_wrapped = models.TextField(default="")
    iv = models.BinaryField(default=b"")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_delete = models.BooleanField(default=False)  # Auto-delete on expiration
    
    # Access control
    download_limit = models.IntegerField(null=True, blank=True)  # None = unlimited
    download_count = models.IntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['owner', '-uploaded_at']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_name} ({self.owner.username})"
    
    def soft_delete(self):
        """Soft delete the file (mark as deleted, don't actually remove)"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restore a soft-deleted file"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    def is_expired(self):
        """Check if file has expired"""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    def can_download(self):
        """Check if file can be downloaded"""
        # Not deleted
        if self.is_deleted:
            return False
        
        # Not expired
        if self.is_expired():
            return False
        
        # Download limit not exceeded
        if self.download_limit is not None and self.download_count >= self.download_limit:
            return False
        
        return True
    
    def record_download(self):
        """Record a download and check if limit exceeded"""
        self.download_count += 1
        self.save()
        
        # Log to access log
        from .models import FileAccessLog
        FileAccessLog.objects.create(
            file=self,
            action='download',
            by_user=None  # Will be set by view
        )
    
    def get_storage_size_kb(self):
        """Get file size in KB"""
        return self.size / 1024
    
    def get_storage_size_mb(self):
        """Get file size in MB"""
        return self.size / (1024 * 1024)


class WrappedKey(models.Model):
    """
    Wrapped encryption key for sharing files with other users
    """
    file = models.ForeignKey(SecureFile, on_delete=models.CASCADE, related_name="wrapped_keys")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    wrapped_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Sharing settings
    can_reshare = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('file', 'recipient')
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def is_expired(self):
        """Check if share access has expired"""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    def is_active(self):
        """Check if share is still active"""
        return not self.is_expired() and self.file.is_active()


class FileAccessLog(models.Model):
    """
    Log of file access and operations for audit trail
    """
    ACTION_CHOICES = [
        ('upload', 'File Uploaded'),
        ('download', 'File Downloaded'),
        ('share', 'File Shared'),
        ('unshare', 'Share Removed'),
        ('delete', 'File Deleted'),
        ('restore', 'File Restored'),
        ('view_metadata', 'Metadata Viewed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(SecureFile, on_delete=models.CASCADE, related_name="access_logs")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['file', '-timestamp']),
            models.Index(fields=['by_user', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.file.original_name} by {self.by_user}"

