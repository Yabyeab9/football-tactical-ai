from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any


def ensure_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def ensure_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def ensure_str(value: Any, default: str = "") -> str:
    if isinstance(value, str):
        return value
    if value is None:
        return default
    if isinstance(value, (int, float, bool)):
        return str(value)
    return default


def ensure_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes"}:
            return True
        if normalized in {"false", "0", "no"}:
            return False
    return default


def coerce_int(value: Any, fallback: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback


def coerce_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def pick(*values: Any, default: Any = None) -> Any:
    for value in values:
        if value not in (None, "", [], {}):
            return value
    return default


def normalize_name(value: Any) -> str:
    return "".join(character for character in ensure_str(value).lower() if character.isalnum())


def build_entity_id(provider: str, raw_id: Any) -> str:
    return f"{provider}__{ensure_str(raw_id, 'unknown')}"


def split_entity_id(entity_id: str, default_provider: str = "football-data") -> tuple[str, str]:
    if "__" in entity_id:
        provider, raw_id = entity_id.split("__", 1)
        return provider, raw_id
    return default_provider, entity_id


def parse_minute(*values: Any) -> int:
    for value in values:
        digits = "".join(character for character in ensure_str(value) if character.isdigit())
        if digits:
            return int(digits)
    return 0


def to_iso(value: Any) -> str | None:
    if isinstance(value, datetime):
        return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time(), tzinfo=UTC).isoformat().replace("+00:00", "Z")
    raw = ensure_str(value)
    if not raw:
        return None
    normalized = raw.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except ValueError:
        return raw


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_iso() -> str:
    return datetime.now(UTC).date().isoformat()


def days_between(first_value: Any, second_value: Any) -> int | None:
    first_iso = to_iso(first_value)
    second_iso = to_iso(second_value)
    if not first_iso or not second_iso:
        return None
    try:
        first_date = datetime.fromisoformat(first_iso.replace("Z", "+00:00"))
        second_date = datetime.fromisoformat(second_iso.replace("Z", "+00:00"))
        return abs((first_date - second_date).days)
    except ValueError:
        return None


def infer_age(date_of_birth: Any) -> int | None:
    iso_value = to_iso(date_of_birth)
    if not iso_value:
        return None
    try:
        birth_date = datetime.fromisoformat(iso_value.replace("Z", "+00:00")).date()
        today = datetime.now(UTC).date()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    except ValueError:
        return None


def normalize_provider_status(
    provider: str,
    *,
    success: bool,
    latency_ms: int | None,
    item_count: int = 0,
    error: str | None = None,
    stale: bool = False,
) -> dict[str, Any]:
    return {
        "provider": provider,
        "success": success,
        "latencyMs": latency_ms,
        "latency_ms": latency_ms,
        "itemCount": item_count,
        "item_count": item_count,
        "error": error,
        "stale": stale,
    }


def normalize_team_ref(
    *,
    provider: str,
    raw_id: Any,
    name: Any,
    short_name: Any = None,
    crest: Any = None,
    provider_ids: dict[str, Any] | None = None,
) -> dict[str, Any]:
    safe_provider_ids = {
        ensure_str(source): ensure_str(source_id)
        for source, source_id in ensure_dict(provider_ids).items()
        if ensure_str(source) and ensure_str(source_id)
    }
    if provider and raw_id not in (None, ""):
        safe_provider_ids.setdefault(provider, ensure_str(raw_id))
    team_id = build_entity_id(provider, raw_id) if provider and raw_id not in (None, "") else None
    short_name_value = ensure_str(short_name) or ensure_str(name) or None
    return {
        "id": team_id,
        "name": ensure_str(name, "Unknown team"),
        "shortName": short_name_value,
        "short_name": short_name_value,
        "crest": ensure_str(crest) or None,
        "providerIds": safe_provider_ids,
        "provider_ids": safe_provider_ids,
    }


def normalize_match_record(
    *,
    provider: str,
    raw_id: Any,
    home_team: dict[str, Any],
    away_team: dict[str, Any],
    status: Any,
    kickoff: Any,
    score_home: Any,
    score_away: Any,
    venue: Any = None,
    competition: dict[str, Any] | None = None,
    minute: Any = 0,
    external_ids: dict[str, Any] | None = None,
    providers: list[str] | None = None,
) -> dict[str, Any]:
    safe_competition = ensure_dict(competition)
    normalized_status = ensure_str(status, "SCHEDULED").upper()
    kickoff_iso = to_iso(kickoff) or utc_now_iso()
    provider_map = {
        ensure_str(source): ensure_str(source_id)
        for source, source_id in ensure_dict(external_ids).items()
        if ensure_str(source) and ensure_str(source_id)
    }
    if provider and raw_id not in (None, ""):
        provider_map.setdefault(provider, ensure_str(raw_id))
    active_providers = sorted({item for item in (providers or [provider]) if item})
    normalized = {
        "id": build_entity_id(provider, raw_id),
        "homeTeam": ensure_str(home_team.get("name"), "Home"),
        "awayTeam": ensure_str(away_team.get("name"), "Away"),
        "status": normalized_status,
        "kickoff": kickoff_iso,
        "score": {
            "home": coerce_int(score_home),
            "away": coerce_int(score_away),
        },
        "venue": ensure_str(venue) or None,
        "source": provider,
        "competition": {
            "id": ensure_str(safe_competition.get("id")) or None,
            "name": ensure_str(safe_competition.get("name"), "Unknown competition"),
            "code": ensure_str(safe_competition.get("code")) or None,
            "country": ensure_str(safe_competition.get("country")) or None,
        },
        "minute": coerce_int(minute),
        "providers": active_providers,
        "externalIds": provider_map,
        "external_ids": provider_map,
        "homeTeamRef": home_team,
        "awayTeamRef": away_team,
        "home_team": home_team,
        "away_team": away_team,
        "scheduledAt": kickoff_iso,
        "scheduled_at": kickoff_iso,
    }
    return normalized


def normalize_player_brief(
    *,
    provider: str,
    raw_id: Any,
    name: Any,
    position: Any = None,
    shirt_number: Any = None,
    nationality: Any = None,
    current_team: dict[str, Any] | None = None,
    role: Any = None,
) -> dict[str, Any]:
    return {
        "id": build_entity_id(provider, raw_id),
        "name": ensure_str(name, "Unknown player"),
        "position": ensure_str(position) or None,
        "shirtNumber": coerce_int(shirt_number) if shirt_number not in (None, "") else None,
        "shirt_number": coerce_int(shirt_number) if shirt_number not in (None, "") else None,
        "nationality": ensure_str(nationality) or None,
        "role": ensure_str(role) or None,
        "currentTeam": ensure_dict(current_team),
        "current_team": ensure_dict(current_team),
    }
