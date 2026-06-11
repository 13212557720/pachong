from __future__ import annotations

import os
from typing import Dict, Iterable, List

from .models import CreatorRecord


def enrich_with_youtube_api(records: Iterable[CreatorRecord]) -> int:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return 0

    ids = sorted(
        {
            record.handle
            for record in records
            if record.platform == "youtube" and record.handle.startswith("UC")
        }
    )
    if not ids:
        return 0

    try:
        from googleapiclient.discovery import build
    except ImportError:
        return 0

    service = build("youtube", "v3", developerKey=api_key)
    by_id: Dict[str, CreatorRecord] = {
        record.handle: record
        for record in records
        if record.handle.startswith("UC")
    }
    enriched = 0

    for batch in _chunks(ids, 50):
        response = (
            service.channels()
            .list(part="snippet,statistics", id=",".join(batch), maxResults=50)
            .execute()
        )
        for item in response.get("items", []):
            record = by_id.get(item.get("id", ""))
            if record is None:
                continue
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            record.name = snippet.get("title") or record.name
            record.description = snippet.get("description") or record.description
            record.subscriber_count = _safe_int(
                statistics.get("subscriberCount"), record.subscriber_count
            )
            record.follower_count = record.subscriber_count
            record.view_count = _safe_int(
                statistics.get("viewCount"), record.view_count
            )
            record.video_count = _safe_int(statistics.get("videoCount"), record.video_count)
            enriched += 1

    return enriched


def _chunks(values: List[str], size: int) -> Iterable[List[str]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def _safe_int(value: object, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
