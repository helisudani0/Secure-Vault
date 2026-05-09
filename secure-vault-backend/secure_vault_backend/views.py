import json
import logging

from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger("ciphra.client")

def home(request):
    return JsonResponse({"message": "Ciphra Backend Running"})


def health(request):
    checks = {
        "database": False,
        "cache": False,
    }

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            checks["database"] = cursor.fetchone()[0] == 1
    except Exception:
        checks["database"] = False

    try:
        cache_key = "ciphra-health"
        cache.set(cache_key, "ok", timeout=10)
        checks["cache"] = cache.get(cache_key) == "ok"
    except Exception:
        checks["cache"] = False

    is_healthy = all(checks.values())
    return JsonResponse(
        {
            "status": "ok" if is_healthy else "degraded",
            "checks": checks,
        },
        status=200 if is_healthy else 503,
    )


def _bounded(value, limit=2000):
    if value is None:
        return ""
    return str(value)[:limit]


@csrf_exempt
@require_POST
def client_error(request):
    if len(request.body) > 16 * 1024:
        return JsonResponse({"error": "Payload too large"}, status=413)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    logger.warning(
        "Client error report",
        extra={
            "message": _bounded(payload.get("message"), 500),
            "stack": _bounded(payload.get("stack")),
            "component_stack": _bounded(payload.get("componentStack")),
            "path": _bounded(payload.get("path"), 500),
            "user_agent": _bounded(payload.get("userAgent"), 500),
            "release": _bounded(payload.get("release"), 120),
        },
    )

    return JsonResponse({"detail": "Client error logged"}, status=202)
