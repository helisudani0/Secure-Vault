# files_app/validators.py
"""
Validators for file operations
"""
import base64
from django.core.exceptions import ValidationError


def validate_wrapped_key(wrapped_key_str):
    """Validate wrapped key format"""
    if not wrapped_key_str:
        raise ValidationError("Wrapped key is required")
    
    if not isinstance(wrapped_key_str, str):
        raise ValidationError("Wrapped key must be a string")
    
    # Check if it's valid base64
    try:
        base64.b64decode(wrapped_key_str)
    except Exception:
        raise ValidationError("Wrapped key must be valid base64")
    
    # Check reasonable size (RSA-4096 encrypted data should be < 1KB)
    if len(wrapped_key_str) > 2000:
        raise ValidationError("Wrapped key is too large")


def validate_iv(iv_str):
    """Validate IV format"""
    if not iv_str:
        raise ValidationError("IV is required")
    
    if not isinstance(iv_str, str):
        raise ValidationError("IV must be a string")
    
    # Check if it's valid base64
    try:
        decoded = base64.b64decode(iv_str)
    except Exception:
        raise ValidationError("IV must be valid base64")
    
    # IV should be 12 bytes (96 bits) for AES-GCM
    if len(decoded) != 12:
        raise ValidationError("IV must be 12 bytes (got {})".format(len(decoded)))


def validate_recipient_username(username):
    """Validate recipient username"""
    if not username:
        raise ValidationError("Recipient username is required")
    
    if len(username) > 30:
        raise ValidationError("Invalid username length")
    
    if not str(username).replace('_', '').isalnum():
        raise ValidationError("Invalid username format")
