# files_app/validators.py
"""
Validators for file operations
"""
import base64
import os
from django.core.exceptions import ValidationError


def validate_filename(filename):
    """Validate filename for security"""
    if not filename:
        raise ValidationError("Filename is required")
    
    if len(filename) > 255:
        raise ValidationError("Filename is too long (max 255 characters)")
    
    # Prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise ValidationError("Invalid filename - contains directory separators")
    
    # Prevent null bytes
    if "\x00" in filename:
        raise ValidationError("Invalid filename - contains null bytes")
    
    return filename


def sanitize_filename(filename):
    """Sanitize filename by removing potentially dangerous characters"""
    # Remove any path components
    filename = os.path.basename(filename)
    
    # Remove null bytes
    filename = filename.replace("\x00", "")
    
    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")
    
    # Ensure filename is not empty after sanitization
    if not filename:
        filename = "file"
    
    # Truncate if too long
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        max_name_len = 255 - len(ext)
        filename = name[:max_name_len] + ext
    
    return filename


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
