"""Redis caching utilities for performance optimization."""

from __future__ import annotations

import hashlib
import json
import functools
from typing import Any, Callable, Optional

import redis

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)


class RedisClient:
    """Singleton Redis client wrapper with graceful fallback."""

    _instance: Optional["RedisClient"] = None
    _client: Optional[redis.Redis] = None

    def __new__(cls) -> "RedisClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            try:
                self._client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=1,  # Reduced timeout
                    socket_timeout=1,
                )
                # Test connection immediately
                self._client.ping()
                logger.info("Redis connection established", extra={"redis_url": settings.redis_url})
            except (redis.ConnectionError, redis.TimeoutError, Exception) as e:
                message = f"Redis unavailable ({type(e).__name__}), caching disabled: {e}"
                if settings.environment == "local":
                    # Local dev often runs without Redis; avoid noisy startup warnings.
                    logger.debug(message)
                else:
                    logger.warning(message)
                self._client = None

    @property
    def available(self) -> bool:
        return self._client is not None

    def get(self, key: str) -> Optional[str]:
        if not self._client:
            return None
        try:
            return self._client.get(key)
        except redis.RedisError as e:
            logger.warning(f"Redis GET error: {e}")
            return None

    def set(self, key: str, value: str, ttl: int) -> bool:
        if not self._client:
            return False
        try:
            self._client.setex(key, ttl, value)
            return True
        except redis.RedisError as e:
            logger.warning(f"Redis SET error: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern. Returns count deleted."""
        if not self._client:
            return 0
        try:
            keys = self._client.keys(pattern)
            if keys:
                return self._client.delete(*keys)
            return 0
        except redis.RedisError as e:
            logger.warning(f"Redis DELETE pattern error: {e}")
            return 0

    def flush_all(self) -> bool:
        """Flush the entire cache. Use with caution."""
        if not self._client:
            return False
        try:
            self._client.flushdb()
            return True
        except redis.RedisError as e:
            logger.warning(f"Redis FLUSHDB error: {e}")
            return False


# Module-level singleton
redis_client = RedisClient()


def generate_cache_key(prefix: str, data: dict) -> str:
    """Generate a stable cache key from prefix and data dict."""
    serialized = json.dumps(data, sort_keys=True, default=str)
    hash_value = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{hash_value}"


def cache_response(prefix: str, ttl_setting: str = "cache_ttl_search"):
    """
    Decorator to cache FastAPI endpoint responses in Redis.
    
    Args:
        prefix: Cache key prefix (e.g., "search", "map", "detail")
        ttl_setting: Name of the settings attribute for TTL
    
    Usage:
        @cache_response("search", "cache_ttl_search")
        def search_properties(payload: PropertySearchRequest, db: Session = Depends(get_db)):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract cacheable data from kwargs
            cache_data = {}
            
            # Handle different endpoint signatures
            if "payload" in kwargs:
                payload = kwargs["payload"]
                if hasattr(payload, "dict"):
                    cache_data = payload.dict()
                elif hasattr(payload, "model_dump"):
                    cache_data = payload.model_dump()
                else:
                    cache_data = {"payload": str(payload)}
            
            # For GET endpoints, use query params
            for key in ["bbox", "zoom", "limit", "offset", "parcel_id", "property_type", "status"]:
                if key in kwargs:
                    cache_data[key] = kwargs[key]
            
            cache_key = generate_cache_key(prefix, cache_data)
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT for {cache_key}")
                try:
                    response_data = json.loads(cached)
                    # Add cache hit header indicator
                    response_data["_cache_hit"] = True
                    return response_data
                except json.JSONDecodeError:
                    pass  # Fall through to execute function
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result
            ttl = getattr(settings, ttl_setting, 300)
            try:
                # Handle Pydantic models
                if hasattr(result, "dict"):
                    result_data = result.dict()
                elif hasattr(result, "model_dump"):
                    result_data = result.model_dump()
                elif isinstance(result, dict):
                    result_data = result
                else:
                    # Can't cache non-dict responses
                    return result
                
                result_data["_cache_hit"] = False
                redis_client.set(cache_key, json.dumps(result_data, default=str), ttl)
                logger.debug(f"Cache SET for {cache_key}, TTL={ttl}s")
            except (TypeError, ValueError) as e:
                logger.warning(f"Failed to cache response: {e}")
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(prefix: str) -> int:
    """
    Invalidate all cache keys matching prefix pattern.
    
    Args:
        prefix: Cache key prefix to invalidate (e.g., "search", "map")
    
    Returns:
        Number of keys deleted
    """
    pattern = f"{prefix}:*"
    count = redis_client.delete_pattern(pattern)
    logger.info(f"Cache invalidation: {count} keys deleted matching '{pattern}'")
    return count


def invalidate_all_caches() -> int:
    """Invalidate all property-related caches. Called after MLS import."""
    total = 0
    for prefix in ["search", "map", "detail"]:
        total += invalidate_cache(prefix)
    logger.info(f"Full cache invalidation complete: {total} keys deleted")
    return total
