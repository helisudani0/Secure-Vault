from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class CustomUser(AbstractUser):
    """
    Extended user model with encryption keys and profile fields
    """
    # Encryption keys
    public_key = models.TextField(null=True, blank=True)
    encrypted_private_key = models.JSONField(null=True, blank=True)
    
    # Profile fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Password reset
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Account security
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    account_locked = models.BooleanField(default=False)
    lock_reason = models.CharField(max_length=255, blank=True, null=True)
    
    # Storage & preferences
    max_storage_bytes = models.BigIntegerField(default=1099511627776)  # 1TB
    storage_used_bytes = models.BigIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    def is_email_verified(self):
        """Check if email is verified"""
        return self.email_verified
    
    def generate_email_verification_token(self):
        """Generate unique email verification token"""
        self.email_verification_token = uuid.uuid4().hex
        self.email_verification_sent_at = timezone.now()
        self.save()
        return self.email_verification_token
    
    def verify_email(self, token):
        """Verify email with token"""
        if self.email_verification_token == token:
            self.email_verified = True
            self.email_verification_token = None
            self.save()
            return True
        return False
    
    def generate_password_reset_token(self):
        """Generate unique password reset token"""
        self.password_reset_token = uuid.uuid4().hex
        self.password_reset_sent_at = timezone.now()
        self.save()
        return self.password_reset_token
    
    def verify_password_reset_token(self, token):
        """Verify password reset token (valid for 1 hour)"""
        if self.password_reset_token != token:
            return False
        
        # Check if token is not older than 1 hour
        if not self.password_reset_sent_at:
            return False
        
        time_diff = timezone.now() - self.password_reset_sent_at
        if time_diff.total_seconds() > 3600:  # 1 hour
            return False
        
        return True
    
    def get_storage_usage_percent(self):
        """Get storage usage as percentage"""
        if self.max_storage_bytes == 0:
            return 0
        return (self.storage_used_bytes / self.max_storage_bytes) * 100
    
    def can_upload(self, file_size_bytes):
        """Check if user can upload file of given size"""
        return (self.storage_used_bytes + file_size_bytes) <= self.max_storage_bytes

