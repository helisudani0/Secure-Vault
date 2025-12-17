# files_app/models.py

from django.db import models
from django.conf import settings
import uuid

def user_directory_path(instance, filename):
    return f"user_{instance.owner.id}/{uuid.uuid4().hex}_{filename}"

class SecureFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="secure_files")
    file = models.FileField(upload_to=user_directory_path)
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    aes_key_owner_wrapped = models.TextField(default="")
    iv = models.BinaryField(default=b"")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_name} ({self.owner.username})"

class WrappedKey(models.Model):
    file = models.ForeignKey(SecureFile, on_delete=models.CASCADE, related_name="wrapped_keys")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    wrapped_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('file', 'recipient')
