from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable

from backend.core.settings import settings

from .data_normalizer import ensure_dict, ensure_list, normalize_provider_status

logger = logging.getLogger(__name__)


DefaultFactory = Callable[[], Any]
RequestFactory = Callable[[], Awaitable[Any]]


@dataclass
class ProviderStatus:
    provider: str
    success: bool
    latency_ms: int | None
    item_count: int = 0
    error: str | None = None
    stale: bool = False

    def as_dict(self) -> dict[str, Any]:
        return normalize_provider_status(
            self.provider,
            success=self.success,
            latency_ms=self.latency_ms,
            item_count=self.item_count,
            error=self.error,
            stale=self.stale,
        )


class ProviderManager:
    def __init__(self, retry_attempts: int | None = None) -> None:
        self.retry_attempts = settings.provider_retry_attempts if retry_attempts is None else retry_attempts

    async def safe_request(
        self,
        provider: str,
        operation: RequestFactory,
        *,
        default_factory: DefaultFactory | None = None,
        expected: str = "any",
    ) -> tuple[Any, ProviderStatus]:
        default_factory = default_factory or (lambda: {} if expected == "dict" else [] if expected == "list" else None)
        started_at = time.perf_counter()
        errors: list[str] = []

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
            except Exception as exc:
                errors.append(str(exc))
                logger.warning(
                    "Provider operation failed for %s on attempt %s: %s",
                    provider,
                    attempt + 1,
                    exc,
                )
                if attempt < self.retry_attempts:
                    await asyncio.sleep(0.25 * (attempt + 1))

        latency_ms = int((time.perf_counter() - started_at) * 1000)
        return default_factory(), ProviderStatus(
            provider=provider,
            success=False,
            latency_ms=latency_ms,
            item_count=0,
            error=" | ".join(errors[-2:]) or "Provider request failed",
        )

    def _sanitize_payload(self, payload: Any, *, expected: str, default_factory: DefaultFactory) -> Any:
        if expected == "dict":
            return ensure_dict(payload)
        if expected == "list":
            return ensure_list(payload)
        if expected == "list[dict]":
            return [ensure_dict(item) for item in ensure_list(payload)]
        return payload if payload is not None else default_factory()


provider_manager = ProviderManager()
