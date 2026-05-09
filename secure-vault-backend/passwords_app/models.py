import uuid

from django.conf import settings
from django.db import models


class PasswordEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_entries")
    title = models.CharField(max_length=120)
    website_url = models.URLField(blank=True)
    encrypted_payload = models.TextField()
    wrapped_key = models.TextField()
    iv = models.TextField()
    favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["owner", "-updated_at"], name="password_owner_updated_idx"),
            models.Index(fields=["owner", "title"], name="password_owner_title_idx"),
            models.Index(fields=["favorite"], name="password_favorite_idx"),
        ]

    def __str__(self):
        return f"{self.title} ({self.owner.username})"
