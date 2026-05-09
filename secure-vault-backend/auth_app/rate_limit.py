# auth_app/rate_limit.py
"""
Rate limiting utilities for authentication endpoints.

Backed by Django cache. In production, CACHE_URL should point to Redis so limits
are shared by every API worker.
"""
import hashlib

from django.core.cache import cache
from django.http import JsonResponse


class RateLimiter:
    """Fixed-window rate limiter using Django's cache backend."""
    
    def __init__(self, key_prefix, max_attempts, window_seconds):
        self.key_prefix = key_prefix
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
    
    def get_key(self, identifier):
        """Generate cache key for rate limiting"""
        digest = hashlib.sha256(str(identifier).encode("utf-8")).hexdigest()
        return f"{self.key_prefix}:{digest}"
    
    def is_allowed(self, identifier):
        """Check if request is allowed"""
        key = self.get_key(identifier)
        if cache.add(key, 1, self.window_seconds):
            return True

        try:
            attempts = cache.incr(key)
        except ValueError:
            cache.set(key, 1, self.window_seconds)
            return True

        return attempts <= self.max_attempts
    
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

password_reset_limiter = RateLimiter(
    key_prefix="ratelimit:password_reset",
    max_attempts=3,
    window_seconds=3600,
)

email_verification_limiter = RateLimiter(
    key_prefix="ratelimit:email_verification",
    max_attempts=5,
    window_seconds=3600,
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
