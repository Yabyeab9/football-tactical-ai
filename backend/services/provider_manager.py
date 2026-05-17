import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, Optional, Set, Tuple

import httpx

from backend.core.settings import settings
from .data_normalizer import ensure_dict, ensure_list, normalize_provider_status

logger = logging.getLogger(__name__)

DefaultFactory = Callable[[], Any]
RequestFactory = Callable[[], Awaitable[Any]]

@dataclass
class ProviderStatus:
    provider: str
    success: bool
    latency_ms: Optional[int] = None
    item_count: int = 0
    error: Optional[str] = None
    stale: bool = False
    rate_limited: bool = False

    def as_dict(self) -> Dict[str, Any]:
        return normalize_provider_status(
            self.provider,
            success=self.success,
            latency_ms=self.latency_ms,
            item_count=self.item_count,
            error=self.error,
            stale=self.stale,
        )

class ProviderManager:
    """
    Orchestrates multiple data providers with:
    - Exponential backoff retries
    - Cooldown management for 429/Rate limits
    - Request deduplication for in-flight calls
    - Graceful fallbacks
    """
    
    def __init__(self, retry_attempts: Optional[int] = None) -> None:
        self.retry_attempts = settings.provider_retry_attempts if retry_attempts is None else retry_attempts
        self._cooldowns: Dict[str, float] = {}
        self._inflight: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    def is_cooling_down(self, provider: str) -> bool:
        cooldown_until = self._cooldowns.get(provider, 0)
        return time.time() < cooldown_until

    async def safe_request(
        self,
        provider: str,
        operation: RequestFactory,
        *,
        default_factory: Optional[DefaultFactory] = None,
        expected: str = "any",
        request_key: Optional[str] = None,
    ) -> Tuple[Any, ProviderStatus]:
        """
        Executes a provider request safely with retries, deduplication, and cooldown checks.
        """
        default_factory = default_factory or (lambda: {} if expected == "dict" else [] if expected == "list" else None)
        
        # Check cooldown
        if self.is_cooling_down(provider):
            logger.warning("Provider %s is cooling down. Skipping request.", provider)
            return default_factory(), ProviderStatus(
                provider=provider,
                success=False,
                error="Provider cooling down due to rate limits",
                stale=True
            )

        # Deduplication
        if request_key:
            async with self._lock:
                if request_key in self._inflight:
                    logger.info("De-duplicating request for %s: %s", provider, request_key)
                    try:
                        return await asyncio.shield(self._inflight[request_key])
                    except Exception:
                        return default_factory(), ProviderStatus(provider=provider, success=False, error="In-flight request failed")
                
                self._inflight[request_key] = asyncio.get_running_loop().create_future()

        try:
            result = await self._execute_with_retry(provider, operation, expected, default_factory)
            
            if request_key:
                async with self._lock:
                    future = self._inflight.pop(request_key, None)
                    if future and not future.done():
                        future.set_result(result)
            
            return result
        except Exception as exc:
            if request_key:
                async with self._lock:
                    future = self._inflight.pop(request_key, None)
                    if future and not future.done():
                        future.set_exception(exc)
            raise

    async def _execute_with_retry(
        self,
        provider: str,
        operation: RequestFactory,
        expected: str,
        default_factory: DefaultFactory
    ) -> Tuple[Any, ProviderStatus]:
        started_at = time.perf_counter()
        last_error = "Unknown error"
        rate_limited = False

        for attempt in range(self.retry_attempts + 1):
            try:
                payload = await operation()
                normalized_payload = self._sanitize_payload(payload, expected=expected, default_factory=default_factory)
                latency_ms = int((time.perf_counter() - started_at) * 1000)
                item_count = len(normalized_payload) if isinstance(normalized_payload, list) else 1 if normalized_payload else 0
                
                return normalized_payload, ProviderStatus(
                    provider=provider,
                    success=True,
                    latency_ms=latency_ms,
                    item_count=item_count,
                )

            except httpx.HTTPStatusError as exc:
                last_error = str(exc)
                if exc.response.status_code == 429:
                    rate_limited = True
                    # Set cooldown for 60 seconds on 429
                    self._cooldowns[provider] = time.time() + 60
                    logger.error("Provider %s hit rate limit (429). Cooling down.", provider)
                    break # Don't retry 429 immediately
                
                if attempt == self.retry_attempts:
                    break
                
                await self._backoff(attempt)

            except Exception as exc:
                last_error = str(exc)
                logger.warning("Provider %s failed attempt %d: %s", provider, attempt + 1, exc)
                if attempt == self.retry_attempts:
                    break
                await self._backoff(attempt)

        latency_ms = int((time.perf_counter() - started_at) * 1000)
        return default_factory(), ProviderStatus(
            provider=provider,
            success=False,
            latency_ms=latency_ms,
            error=last_error,
            rate_limited=rate_limited
        )

    async def _backoff(self, attempt: int):
        # Exponential backoff: 0.5s, 1s, 2s...
        sleep_time = 0.5 * (2 ** attempt)
        await asyncio.sleep(sleep_time)

    def _sanitize_payload(self, payload: Any, *, expected: str, default_factory: DefaultFactory) -> Any:
        if expected == "dict":
            return ensure_dict(payload)
        if expected == "list":
            return ensure_list(payload)
        if expected == "list[dict]":
            return [ensure_dict(item) for item in ensure_list(payload)]
        return payload if payload is not None else default_factory()

provider_manager = ProviderManager()
