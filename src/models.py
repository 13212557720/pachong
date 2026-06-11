from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict


@dataclass
class CreatorRecord:
    platform: str
    country: str
    rank: int
    name: str
    handle: str
    follower_count: int
    subscriber_count: int
    view_count: int
    video_count: int
    category: str
    profile_url: str
    source_url: str
    source_name: str
    scraped_at: str
    description: str = ""
    platform_user_id: str = ""
    ip_location: str = ""
    is_verified: bool | None = None
    is_private: bool | None = None
    source_mode: str = "public"
    raw_json: str = ""

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)
