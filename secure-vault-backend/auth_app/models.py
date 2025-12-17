from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    public_key = models.TextField(null=True, blank=True)
    encrypted_private_key = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.username
