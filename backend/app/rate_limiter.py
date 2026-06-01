"""
Simple in-memory rate limiter for API endpoints.
Uses a sliding window approach with per-IP tracking.
"""
import time
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Rate limit configuration
RATE_LIMITS = {
    # path_prefix: (max_requests, window_seconds)
    "/api/import/": (20, 60),       # 20 imports per minute
    "/api/ai/": (30, 60),           # 30 AI requests per minute
    "/api/clerk-users/": (30, 60),  # 30 user management requests per minute
    "/api/": (200, 60),             # 200 general API requests per minute
}

# Store request timestamps per IP per path prefix
_request_log: dict = defaultdict(list)

# Cleanup interval
_last_cleanup = time.time()
CLEANUP_INTERVAL = 300  # 5 minutes


def _cleanup_old_entries():
    """Remove entries older than the largest window."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    max_window = 120
    cutoff = now - max_window
    keys_to_delete = []
    for key, timestamps in _request_log.items():
        _request_log[key] = [t for t in timestamps if t > cutoff]
        if not _request_log[key]:
            keys_to_delete.append(key)
    for key in keys_to_delete:
        del _request_log[key]


def _get_client_ip(request: Request) -> str:
    """Extract client IP, respecting X-Forwarded-For behind a proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _find_rate_limit(path: str):
    """Find the most specific rate limit for a path."""
    # Check most specific prefixes first (longer paths)
    for prefix in sorted(RATE_LIMITS.keys(), key=len, reverse=True):
        if path.startswith(prefix):
            return RATE_LIMITS[prefix], prefix
    return None, None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces per-IP rate limits on API endpoints."""

    async def dispatch(self, request: Request, call_next):
        # Only rate limit API paths
        path = request.url.path
        if not path.startswith("/api/"):
            return await call_next(request)

        # Skip rate limiting for OPTIONS (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        limit_config, prefix = _find_rate_limit(path)
        if not limit_config:
            return await call_next(request)

        max_requests, window_seconds = limit_config
        client_ip = _get_client_ip(request)
        key = f"{client_ip}:{prefix}"
        now = time.time()

        # Clean old entries periodically
        _cleanup_old_entries()

        # Filter to only timestamps within the window
        cutoff = now - window_seconds
        _request_log[key] = [t for t in _request_log[key] if t > cutoff]

        if len(_request_log[key]) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s."
                },
                headers={
                    "Retry-After": str(window_seconds),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                }
            )

        _request_log[key].append(now)

        response = await call_next(request)
        remaining = max(0, max_requests - len(_request_log[key]))
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
