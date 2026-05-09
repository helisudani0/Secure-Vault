# files_app/optimization.py
"""
Query optimization utilities for files app
"""
from django.db.models import Prefetch, Q
from .models import SecureFile, WrappedKey


def get_user_files_optimized(user):
    """
    Get all files (owned + shared) for user with optimal queries
    
    Avoids N+1 queries by using prefetch_related for wrapped keys
    """
    # Prefetch shared file information
    wrapped_keys_prefetch = Prefetch(
        'wrappedkey_set',
        queryset=WrappedKey.objects.filter(recipient=user)
    )
    
    queryset = SecureFile.objects.filter(
        Q(owner=user) | Q(wrappedkey__recipient=user)
    ).distinct().select_related(
        'owner'
    ).prefetch_related(
        wrapped_keys_prefetch
    ).order_by('-uploaded_at')
    
    return queryset


def get_shared_files_for_user(user):
    """
    Get files shared with user (optimized)
    """
    queryset = WrappedKey.objects.filter(
        recipient=user
    ).select_related(
        'file',
        'file__owner'
    ).order_by('-created_at')
    
    return queryset


def get_file_access_log(file_id, user):
    """
    Check if user has access to file (optimized)
    Returns: 'owner', 'shared', or None
    """
    try:
        # Try owner first (most common case)
        file_obj = SecureFile.objects.get(id=file_id, owner=user)
        return 'owner'
    except SecureFile.DoesNotExist:
        pass
    
    # Check if shared
    if WrappedKey.objects.filter(file_id=file_id, recipient=user).exists():
        return 'shared'
    
    return None
