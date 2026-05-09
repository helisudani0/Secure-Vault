# files_app/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid
from pathlib import Path


FILE_CATEGORY_CHOICES = [
    ("documents", "Documents"),
    ("pdfs", "PDFs"),
    ("photos", "Photos"),
    ("videos", "Videos"),
    ("audio", "Audio"),
    ("archives", "Archives"),
    ("spreadsheets", "Spreadsheets"),
    ("presentations", "Presentations"),
    ("code", "Code"),
    ("other", "Other"),
]

CATEGORY_EXTENSIONS = {
    "pdfs": {".pdf"},
    "photos": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".heic", ".heif", ".bmp", ".tif", ".tiff", ".svg"},
    "videos": {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv", ".wmv"},
    "audio": {".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"},
    "archives": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"},
    "spreadsheets": {".xls", ".xlsx", ".csv", ".ods", ".numbers"},
    "presentations": {".ppt", ".pptx", ".odp", ".key"},
    "code": {
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cs", ".go", ".rs", ".rb", ".php",
        ".html", ".css", ".json", ".xml", ".yml", ".yaml", ".sql", ".sh", ".ps1",
    },
    "documents": {".doc", ".docx", ".txt", ".rtf", ".odt", ".md", ".pages"},
}


def detect_file_category(filename):
    extension = Path(filename or "").suffix.lower()
    for category, extensions in CATEGORY_EXTENSIONS.items():
        if extension in extensions:
            return category
    return "other"


def file_extension(filename):
    return Path(filename or "").suffix.lower()[:24]


def user_directory_path(instance, filename):
    category = instance.category or detect_file_category(filename)
    return f"user_{instance.owner.id}/{category}/{uuid.uuid4().hex}_{filename}"


class SecureFile(models.Model):
    """
    Encrypted file storage with soft delete and expiration support
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="secure_files")
    file = models.FileField(upload_to=user_directory_path)
    original_name = models.CharField(max_length=255)
    category = models.CharField(max_length=24, choices=FILE_CATEGORY_CHOICES, default="other", db_index=True)
    extension = models.CharField(max_length=24, blank=True, db_index=True)
    size = models.BigIntegerField()
    aes_key_owner_wrapped = models.TextField(default="")
    iv = models.TextField(default="")
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
            models.Index(fields=['owner'], name='files_owner_idx'),
            models.Index(fields=['uploaded_at'], name='files_uploaded_idx'),
            models.Index(fields=['owner', 'uploaded_at'], name='files_owner_uploaded_idx'),
            models.Index(fields=['owner', '-uploaded_at'], name='files_app_s_owner_id_f9c0_idx'),
            models.Index(fields=['is_deleted'], name='files_app_s_is_dele_6d3e_idx'),
            models.Index(fields=['expires_at'], name='files_app_s_expires__4e8a_idx'),
            models.Index(fields=['owner', 'category'], name='files_owner_category_idx'),
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

    def is_active(self):
        """Check if file is visible and usable."""
        return not self.is_deleted and not self.is_expired()
    
    def can_download(self):
        """Check if file can be downloaded"""
        if not self.is_active():
            return False
        
        # Download limit not exceeded
        if self.download_limit is not None and self.download_count >= self.download_limit:
            return False
        
        return True
    
    def record_download(self):
        """Record a download and check if limit exceeded"""
        self.download_count += 1
        self.save(update_fields=["download_count"])
    
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
            models.Index(fields=['recipient'], name='wrapped_recipient_idx'),
            models.Index(fields=['file', 'recipient'], name='wrapped_file_recipient_idx'),
            models.Index(fields=['created_at'], name='wrapped_created_idx'),
            models.Index(fields=['recipient', '-created_at'], name='files_app_w_recipie_8f2b_idx'),
            models.Index(fields=['expires_at'], name='files_app_w_expires__7c1d_idx'),
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
            models.Index(fields=['file', '-timestamp'], name='files_app_f_file_id_9a3d_idx'),
            models.Index(fields=['by_user', '-timestamp'], name='files_app_f_by_user_2f4e_idx'),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.file.original_name} by {self.by_user}"

