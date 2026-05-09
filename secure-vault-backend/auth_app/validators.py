# auth_app/validators.py
"""
Custom validators for Ciphra.
"""
import re
from django.core.exceptions import ValidationError


def validate_username(username):
    """Validate username format"""
    if not username:
        raise ValidationError("Username is required")
    
    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters")
    
    if len(username) > 30:
        raise ValidationError("Username must be at most 30 characters")
    
    # Only allow alphanumeric and underscores
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError("Username can only contain letters, numbers, and underscores")


def validate_password_strength(password):
    """Validate password strength"""
    if not password:
        raise ValidationError("Password is required")
    
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters")
    
    if len(password) > 128:
        raise ValidationError("Password is too long")


def validate_master_password_strength(password):
    """Validate master password strength (stricter than login password)"""
    if not password:
        raise ValidationError("Master password is required")
    
    if len(password) < 12:
        raise ValidationError("Master password must be at least 12 characters")
    
    if len(password) > 256:
        raise ValidationError("Master password is too long")


def validate_filename(filename):
    """Validate and sanitize filename"""
    if not filename:
        raise ValidationError("Filename is required")
    
    if len(filename) > 255:
        raise ValidationError("Filename is too long (max 255 characters)")
    
    # Reject paths and special characters
    if any(char in filename for char in ['/', '\\', '\x00', '\n', '\r']):
        raise ValidationError("Filename contains invalid characters")
    
    return filename


def sanitize_filename(filename):
    """Sanitize filename by removing/replacing potentially dangerous characters"""
    # Remove null bytes, newlines
    filename = filename.replace('\x00', '').replace('\n', '').replace('\r', '')
    
    # Replace path separators with underscore
    filename = filename.replace('/', '_').replace('\\', '_')
    
    return filename


def validate_file_size(size_bytes, max_size_bytes=None):
    """Validate file size"""
    if not max_size_bytes:
        max_size_bytes = 104857600  # 100MB default
    
    if size_bytes <= 0:
        raise ValidationError("File size must be greater than 0")
    
    if size_bytes > max_size_bytes:
        raise ValidationError(f"File size exceeds maximum allowed size ({max_size_bytes / 1024 / 1024:.0f}MB)")


def validate_file_type(filename, allowed_extensions=None):
    """Validate file type by extension"""
    if not filename:
        raise ValidationError("Filename is required")
    
    # If no restrictions, allow all
    if allowed_extensions is None:
        return True
    
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    if ext not in allowed_extensions:
        raise ValidationError(f"File type '{ext}' is not allowed")
    
    return True
