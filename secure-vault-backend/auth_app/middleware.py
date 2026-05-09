# auth_app/middleware.py
"""
Middleware for request/response logging and security headers
"""
import logging
import uuid
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all requests and responses with timing information
    """
    
    def process_request(self, request):
        # Generate request ID
        request.id = str(uuid.uuid4())
        request.start_time = time.time()
        
        # Log request
        client_ip = self._get_client_ip(request)
        logger.info(
            f"API Request: {request.method} {request.path}",
            extra={
                'request_id': request.id,
                'ip_address': client_ip,
                'method': request.method,
                'path': request.path,
            }
        )
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
        else:
            duration = 0
        
        # Log response
        client_ip = self._get_client_ip(request)
        request_id = getattr(request, 'id', 'N/A')
        
        # Log level based on status code
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO
        
        logger.log(
            log_level,
            f"API Response: {request.method} {request.path} - {response.status_code}",
            extra={
                'request_id': request_id,
                'ip_address': client_ip,
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': duration * 1000,
            }
        )
        
        # Add request ID to response headers for tracing
        response['X-Request-ID'] = request_id
        
        return response
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    
    def process_response(self, request, response):
        # Content Security Policy
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'
        
        # X-XSS-Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer-Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions-Policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
