# auth_app/rate_limit.py
"""
Rate limiting utilities for authentication endpoints
"""
from django.core.cache import cache
from django.http import JsonResponse
from datetime import timedelta
import hashlib


class RateLimiter:
    """Simple in-memory rate limiter using Django cache"""
    
    def __init__(self, key_prefix, max_attempts, window_seconds):
        self.key_prefix = key_prefix
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
    
    def get_key(self, identifier):
        """Generate cache key for rate limiting"""
        return f"{self.key_prefix}:{identifier}"
    
    def is_allowed(self, identifier):
        """Check if request is allowed"""
        key = self.get_key(identifier)
        attempts = cache.get(key, 0)
        
        if attempts >= self.max_attempts:
            return False
        
        # Increment and set expiry
        cache.set(key, attempts + 1, self.window_seconds)
        return True
    
    def get_remaining(self, identifier):
        """Get remaining attempts"""
        key = self.get_key(identifier)
        attempts = cache.get(key, 0)
        return max(0, self.max_attempts - attempts)


# Rate limiters for different endpoints
login_limiter = RateLimiter(
    key_prefix="ratelimit:login",
    max_attempts=5,  # 5 attempts
    window_seconds=3600  # Per hour
)

signup_limiter = RateLimiter(
    key_prefix="ratelimit:signup",
    max_attempts=3,  # 3 attempts
    window_seconds=3600  # Per hour
)

file_upload_limiter = RateLimiter(
    key_prefix="ratelimit:upload",
    max_attempts=50,  # 50 uploads
    window_seconds=86400  # Per day
)


def rate_limit_response(limiter, identifier, error_message=None):
    """Helper to create 429 response"""
    remaining = limiter.get_remaining(identifier)
    return JsonResponse(
        {
            "error": error_message or "Rate limit exceeded",
            "remaining_attempts": remaining,
        },
        status=429
    )
