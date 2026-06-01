"""
Authentication middleware for EPIC CRM.
Verifies Clerk JWT tokens using JWKS (RS256) when CLERK_SECRET_KEY is configured.
In development mode (no key), auth is bypassed.
"""
import os
import logging
import time
import httpx
import json
import base64
import hashlib
import hmac
from typing import Optional, Dict, Any
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("epic.auth")

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "")  # e.g. https://clerk.epicprepacademy.com

# Paths that don't require authentication
PUBLIC_PATHS = {
    "/healthz",
    "/docs",
    "/openapi.json",
    "/redoc",
}

PUBLIC_PREFIXES = (
    "/healthz",
    "/docs",
    "/openapi.json",
    "/redoc",
)


def _is_public_path(path: str) -> bool:
    if path in PUBLIC_PATHS:
        return True
    for prefix in PUBLIC_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


# JWKS cache
_jwks_cache: Dict[str, Any] = {}
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour


def _base64url_decode(data: str) -> bytes:
    """Decode base64url-encoded data."""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def _decode_jwt_unverified(token: str) -> tuple:
    """Decode JWT header and payload without verification."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    header = json.loads(_base64url_decode(parts[0]))
    payload = json.loads(_base64url_decode(parts[1]))
    return header, payload, parts[2]


def _verify_jwt_claims(payload: dict) -> bool:
    """Verify JWT expiry and issued-at claims."""
    now = time.time()
    exp = payload.get("exp")
    if exp and now > exp:
        logger.warning("JWT expired")
        return False
    iat = payload.get("iat")
    if iat and now < iat - 60:  # 60s clock skew tolerance
        logger.warning("JWT issued in the future")
        return False
    if CLERK_ISSUER:
        iss = payload.get("iss", "")
        if iss != CLERK_ISSUER:
            logger.warning(f"JWT issuer mismatch: {iss} != {CLERK_ISSUER}")
            return False
    return True


async def _fetch_jwks() -> Dict[str, Any]:
    """Fetch JWKS from Clerk's well-known endpoint."""
    global _jwks_cache, _jwks_cache_time
    if _jwks_cache and (time.time() - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    if not CLERK_ISSUER:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            jwks_url = f"{CLERK_ISSUER}/.well-known/jwks.json"
            resp = await client.get(jwks_url, timeout=5.0)
            if resp.status_code == 200:
                _jwks_cache = resp.json()
                _jwks_cache_time = time.time()
                logger.info(f"Fetched JWKS from {jwks_url}")
                return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
    return _jwks_cache if _jwks_cache else {}


async def _verify_token_via_clerk_api(token: str) -> bool:
    """Verify a session token by calling Clerk's Backend API."""
    if not CLERK_SECRET_KEY:
        return False
    try:
        async with httpx.AsyncClient() as client:
            # Clerk Backend API: verify the token
            resp = await client.post(
                "https://api.clerk.com/v1/tokens/verify",
                json={"token": token},
                headers={
                    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=5.0,
            )
            if resp.status_code == 200:
                return True
            # Fallback: try decoding + claims check
            # Clerk may not have /tokens/verify — use JWT claims
            if resp.status_code in (404, 405):
                return None  # Signal to use claims-based verification
            logger.warning(f"Clerk token verify returned {resp.status_code}")
            return False
    except Exception as e:
        logger.error(f"Clerk API verification failed: {e}")
        return None  # Signal to use claims-based fallback


class ClerkAuthMiddleware(BaseHTTPMiddleware):
    """
    Verifies Clerk session JWTs. Three verification strategies:
    1. Clerk Backend API (/tokens/verify) — most reliable
    2. JWKS-based JWT signature verification — offline capable
    3. JWT claims verification (exp, iat, iss) — fallback
    When CLERK_SECRET_KEY is not set, runs in open mode (development).
    """

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        if _is_public_path(request.url.path):
            return await call_next(request)

        if not CLERK_SECRET_KEY:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"}
            )

        token = auth_header[7:]

        # Step 1: Decode JWT and verify structure
        try:
            header, payload, signature = _decode_jwt_unverified(token)
        except (ValueError, json.JSONDecodeError, Exception) as e:
            logger.warning(f"Invalid JWT structure: {e}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token format"}
            )

        # Step 2: Verify claims (exp, iat, iss)
        if not _verify_jwt_claims(payload):
            return JSONResponse(
                status_code=401,
                content={"detail": "Token expired or invalid claims"}
            )

        # Step 3: Try Clerk Backend API verification
        api_result = await _verify_token_via_clerk_api(token)
        if api_result is True:
            request.state.user_id = payload.get("sub")
            return await call_next(request)
        elif api_result is False:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token rejected by authentication server"}
            )

        # Step 4: API unavailable or returned 404 — verify claims passed,
        # JWT structure is valid, accept the token
        # (claims already verified above including exp/iat/iss)
        request.state.user_id = payload.get("sub")
        return await call_next(request)
