from __future__ import annotations

import json
import re
import unicodedata
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import parse_qs, urljoin, urlparse

from bs4 import BeautifulSoup

from .models import CreatorRecord


BASE_URL = "https://us.youtubers.me"


def parse_int(text: str) -> int:
    cleaned = re.sub(r"[^\d]", "", text or "")
    return int(cleaned) if cleaned else 0


def parse_first_int(text: str) -> int:
    match = re.search(r"\d+", text or "")
    return int(match.group(0)) if match else 0


def parse_compact_number(text: str) -> int:
    value = (text or "").strip().replace(",", "")
    chinese_match = re.search(r"(\d+(?:\.\d+)?)\s*万", value)
    if chinese_match:
        return int(float(chinese_match.group(1)) * 10_000)
    match = re.search(r"(\d+(?:\.\d+)?)\s*([KMB])?", value, flags=re.IGNORECASE)
    if not match:
        return parse_int(value)

    number = float(match.group(1))
    suffix = (match.group(2) or "").upper()
    multiplier = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix, 1)
    return int(number * multiplier)


def parse_optional_year(text: str) -> Optional[int]:
    match = re.search(r"\b(19\d{2}|20\d{2})\b", text or "")
    return int(match.group(1)) if match else None


def discover_rank_pages(html: str, country_slug: str, base_url: str = BASE_URL) -> Dict[int, str]:
    soup = BeautifulSoup(html, "lxml")
    pages: Dict[int, str] = {}
    pattern = re.compile(
        rf"/{re.escape(country_slug)}/all/top-(\d+)-youtube-channels-in-{re.escape(country_slug)}$"
    )

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        match = pattern.search(href)
        if not match:
            continue
        limit = int(match.group(1))
        pages[limit] = urljoin(base_url, href)

    return pages


def parse_rank_table(
    html: str,
    *,
    country: str,
    source_url: str,
    source_page_limit: int,
    scraped_at: str,
    base_url: str = BASE_URL,
) -> List[CreatorRecord]:
    soup = BeautifulSoup(html, "lxml")
    table = soup.find("table", class_="top-charts")
    if table is None:
        return []

    records: List[CreatorRecord] = []
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 7:
            continue

        rank = parse_int(cells[0].get_text(" ", strip=True))
        channel_anchor = cells[1].find("a", href=True)
        channel_name = cells[1].get_text(" ", strip=True)
        if channel_anchor is not None:
            channel_name = channel_anchor.get_text(" ", strip=True) or channel_name

        if not rank or not channel_name:
            continue

        category_anchor = cells[5].find("a")
        category = (
            category_anchor.get_text(" ", strip=True)
            if category_anchor is not None
            else cells[5].get_text(" ", strip=True)
        )
        profile_href = channel_anchor["href"].strip() if channel_anchor is not None else ""
        profile_url = urljoin(base_url, profile_href)
        subscriber_count = parse_int(cells[2].get_text(" ", strip=True))

        records.append(
            CreatorRecord(
                platform="youtube",
                country=country,
                rank=rank,
                name=channel_name,
                handle=_slug_from_profile_url(profile_url),
                platform_user_id=_slug_from_profile_url(profile_url),
                follower_count=subscriber_count,
                subscriber_count=subscriber_count,
                view_count=parse_int(cells[3].get_text(" ", strip=True)),
                video_count=parse_int(cells[4].get_text(" ", strip=True)),
                category=category,
                profile_url=profile_url,
                source_url=source_url,
                source_name="YouTubers.me",
                scraped_at=scraped_at,
                description=_format_started_year(cells[6].get_text(" ", strip=True)),
            )
        )

    return records


def filter_by_subscribers(
    records: Iterable[CreatorRecord], min_subscribers: int
) -> List[CreatorRecord]:
    return [record for record in records if record.subscriber_count >= min_subscribers]


def filter_by_followers(
    records: Iterable[CreatorRecord], min_followers: int
) -> List[CreatorRecord]:
    return [record for record in records if record.follower_count >= min_followers]


def filter_instagram_mexico_records(
    records: Iterable[CreatorRecord], min_followers: int
) -> List[CreatorRecord]:
    return [
        record
        for record in records
        if record.follower_count >= min_followers and is_mexico_location(record.ip_location)
    ]


def parse_hypeauditor_instagram(
    html: str,
    *,
    country: str,
    source_url: str,
    scraped_at: str,
) -> List[CreatorRecord]:
    soup = BeautifulSoup(html, "lxml")
    records: List[CreatorRecord] = []

    for row in soup.select(".row"):
        rank_cell = row.select_one(".row-cell.rank")
        contributor = row.select_one(".row-cell.contributor")
        subscribers = row.select_one(".row-cell.subscribers")
        if not rank_cell or not contributor or not subscribers:
            continue

        rank = parse_first_int(rank_cell.get_text(" ", strip=True))
        handle_tag = contributor.select_one(".contributor__content-username")
        name_tag = contributor.select_one(".contributor__content-fullname")
        handle = handle_tag.get_text(" ", strip=True) if handle_tag else ""
        name = name_tag.get_text(" ", strip=True) if name_tag else handle
        follower_count = parse_compact_number(subscribers.get_text(" ", strip=True))
        if not rank or not handle or not follower_count:
            continue

        category_tag = row.select_one(".row-cell.category")
        category = category_tag.get_text(" ", strip=True) if category_tag else ""

        records.append(
            CreatorRecord(
                platform="instagram",
                country=country,
                rank=rank,
                name=name,
                handle=handle,
                platform_user_id=handle,
                follower_count=follower_count,
                subscriber_count=0,
                view_count=0,
                video_count=0,
                category=category,
                profile_url=f"https://www.instagram.com/{handle}/",
                source_url=source_url,
                source_name="HypeAuditor",
                scraped_at=scraped_at,
            )
        )

    return records


def parse_scrumball_instagram(
    html: str,
    *,
    country: str,
    source_url: str,
    scraped_at: str,
) -> List[CreatorRecord]:
    soup = BeautifulSoup(html, "lxml")
    records: List[CreatorRecord] = []
    seen_handles = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if "instagram.com/" not in href:
            continue
        handle = _instagram_handle_from_url(href)
        if not handle or handle in seen_handles:
            continue

        card = _find_scrumball_card(anchor)
        if card is None:
            continue
        text = card.get_text(" ", strip=True)
        follower_count = _metric_before_label(text, "Followers")
        if not follower_count:
            continue

        name = _scrumball_name(card, handle)
        seen_handles.add(handle)
        records.append(
            CreatorRecord(
                platform="instagram",
                country=country,
                rank=len(records) + 1,
                name=name or handle,
                handle=handle,
                platform_user_id=handle,
                follower_count=follower_count,
                subscriber_count=0,
                view_count=_metric_before_label(text, "Avg.Views"),
                video_count=0,
                category="",
                profile_url=f"https://www.instagram.com/{handle}/",
                source_url=source_url,
                source_name="Scrumball",
                source_mode="public_mexico_ranking",
                scraped_at=scraped_at,
                ip_location="Mexico" if "Mexico" in text else "",
                description=_extract_engagement_rate(text),
            )
        )

    return records


def parse_facebook_wikipedia_table(
    html: str,
    *,
    source_url: str,
    scraped_at: str,
) -> List[CreatorRecord]:
    soup = BeautifulSoup(html, "lxml")
    table = _find_facebook_table(soup)
    if table is None:
        return []

    records: List[CreatorRecord] = []
    for row in table.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 3:
            continue
        if cells[0].get_text(" ", strip=True).lower() == "rank":
            continue

        rank = parse_int(cells[0].get_text(" ", strip=True))
        name_cell = cells[1]
        name_anchor = name_cell.find("a", href=True)
        name = (
            name_anchor.get_text(" ", strip=True)
            if name_anchor is not None
            else name_cell.get_text(" ", strip=True)
        )
        followers_millions_text = cells[2].get_text(" ", strip=True)
        follower_count = parse_millions(followers_millions_text)
        if not rank or not name or not follower_count:
            continue

        profile_url = ""
        if name_anchor is not None:
            profile_url = urljoin("https://en.wikipedia.org", name_anchor["href"])

        records.append(
            CreatorRecord(
                platform="facebook",
                country="global",
                rank=rank,
                name=name,
                handle="",
                platform_user_id=_wikipedia_slug(profile_url),
                follower_count=follower_count,
                subscriber_count=0,
                view_count=0,
                video_count=0,
                category="",
                profile_url=profile_url,
                source_url=source_url,
                source_name="Wikipedia",
                scraped_at=scraped_at,
            )
        )

    return records


def parse_instagram_following_payload(
    payload: Dict[str, Any],
    *,
    country: str,
    source_url: str,
    scraped_at: str,
) -> List[CreatorRecord]:
    users = payload.get("users")
    if not isinstance(users, list):
        return []

    records: List[CreatorRecord] = []
    for index, user in enumerate(users, start=1):
        if not isinstance(user, dict):
            continue

        handle = str(user.get("username") or "").strip().lstrip("@")
        platform_user_id = str(user.get("id") or user.get("pk") or "").strip()
        if not handle and not platform_user_id:
            continue

        name = str(user.get("full_name") or handle).strip()
        follower_count = _coerce_int(user.get("followers_count"))
        description = str(user.get("biography") or "").strip()

        records.append(
            CreatorRecord(
                platform="instagram",
                country=country,
                rank=index,
                name=name,
                handle=handle,
                platform_user_id=platform_user_id,
                follower_count=follower_count,
                subscriber_count=0,
                view_count=0,
                video_count=0,
                category="",
                profile_url=f"https://www.instagram.com/{handle}/" if handle else "",
                source_url=source_url,
                source_name="Instagram",
                source_mode="browser_following",
                scraped_at=scraped_at,
                description=description,
                is_verified=_optional_bool(user.get("is_verified")),
                is_private=_optional_bool(user.get("is_private")),
                raw_json=json.dumps(user, ensure_ascii=False, sort_keys=True),
            )
        )

    return records


def parse_instagram_graphql_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    user = _find_instagram_user_object(payload)
    if not isinstance(user, dict):
        return {}

    return {
        "platform_user_id": str(user.get("id") or user.get("pk") or "").strip(),
        "handle": str(user.get("username") or "").strip().lstrip("@"),
        "name": str(user.get("full_name") or user.get("name") or "").strip(),
        "follower_count": _coerce_int(
            user.get("follower_count")
            or user.get("followers_count")
            or user.get("edge_followed_by", {}).get("count")
        ),
        "description": str(user.get("biography") or "").strip(),
        "is_verified": _optional_bool(user.get("is_verified")),
        "is_private": _optional_bool(user.get("is_private")),
    }


def parse_instagram_wbloks_ip_location(text: str) -> str:
    payload = (text or "").strip()
    payload = re.sub(r"^for\s*\(\s*;\s*;\s*\)\s*;", "", payload)
    if not payload:
        return ""

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return ""

    for value in _walk_json_values(data):
        if isinstance(value, dict):
            initial = value.get("initial")
            if isinstance(initial, str) and initial.strip():
                return initial.strip()
        if isinstance(value, str) and is_mexico_location(value):
            return value.strip()
    return ""


def is_mexico_location(value: str) -> bool:
    normalized = unicodedata.normalize("NFKD", value or "")
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()
    return any(token in normalized for token in ["mexico", "mx", "墨西哥"])


def parse_facebook_search_cards(
    html: str,
    *,
    country: str,
    source_url: str,
    scraped_at: str,
) -> List[CreatorRecord]:
    soup = BeautifulSoup(html, "lxml")
    cards = soup.select(".facebook-page-card")
    if not cards:
        cards = soup.select('[role="article"]')

    records: List[CreatorRecord] = []
    for index, card in enumerate(cards, start=1):
        anchor = _first_facebook_anchor(card)
        if anchor is None:
            continue

        name = anchor.get_text(" ", strip=True)
        profile_url = _normalize_facebook_url(anchor.get("href", ""))
        card_text = card.get_text(" ", strip=True)
        follower_count = _parse_facebook_followers(card_text)
        if not name or not profile_url or not follower_count:
            continue

        records.append(
            CreatorRecord(
                platform="facebook",
                country=country,
                rank=index,
                name=name,
                handle=_facebook_handle(profile_url),
                platform_user_id=_facebook_handle(profile_url),
                follower_count=follower_count,
                subscriber_count=0,
                view_count=0,
                video_count=0,
                category="",
                profile_url=profile_url,
                source_url=source_url,
                source_name="Facebook",
                source_mode="browser_search",
                scraped_at=scraped_at,
                description=_card_description(card, name),
            )
        )

    return records


def parse_detail_page(html: str, base_url: str = BASE_URL) -> Dict[str, str]:
    soup = BeautifulSoup(html, "lxml")
    description = ""
    for selector in [
        ("meta", {"name": "description"}),
        ("meta", {"property": "og:description"}),
    ]:
        tag = soup.find(*selector)
        if tag and tag.get("content"):
            description = tag["content"].strip()
            break

    youtube_url = ""
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if "youtube.com/" in href or "youtu.be/" in href:
            youtube_url = urljoin(base_url, href)
            break

    official_channel_id = ""
    if youtube_url:
        match = re.search(r"/channel/(UC[\w-]+)", youtube_url)
        if match:
            official_channel_id = match.group(1)

    return {
        "description": description,
        "youtube_channel_url": youtube_url,
        "official_channel_id": official_channel_id,
    }


def _slug_from_profile_url(profile_url: str) -> str:
    match = re.search(r"/([^/]+)/youtuber-stats/?$", profile_url)
    return match.group(1) if match else ""


def _format_started_year(text: str) -> str:
    year = parse_optional_year(text)
    return f"Started: {year}" if year else ""


def _instagram_handle_from_url(url: str) -> str:
    match = re.search(r"instagram\.com/([^/?#]+)/?", url)
    if not match:
        return ""
    handle = match.group(1).strip().lstrip("@")
    return "" if handle in {"p", "reel", "stories", "explore"} else handle


def _find_scrumball_card(anchor):
    node = anchor
    for _ in range(8):
        node = node.parent
        if node is None:
            return None
        text = node.get_text(" ", strip=True)
        if "Followers" in text and "Avg.Views" in text:
            return node
    return None


def _scrumball_name(card, handle: str) -> str:
    for anchor in card.find_all("a", href=True):
        text = anchor.get_text(" ", strip=True)
        if not text:
            continue
        compact = text.replace(" ", "")
        if compact.lstrip("@") == handle:
            continue
        if "instagram.com/" in anchor["href"]:
            return text
    text = card.get_text(" ", strip=True)
    marker = f"@ {handle}"
    return text.split(marker)[0].strip() if marker in text else ""


def _metric_before_label(text: str, label: str) -> int:
    match = re.search(rf"(\d+(?:\.\d+)?\s*[KMB]?)\s+{re.escape(label)}", text, re.IGNORECASE)
    return parse_compact_number(match.group(1)) if match else 0


def _extract_engagement_rate(text: str) -> str:
    match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*Engagement Rate", text, re.IGNORECASE)
    return f"Engagement Rate: {match.group(1)}%" if match else ""


def _find_facebook_table(soup: BeautifulSoup):
    for table in soup.find_all("table"):
        headers = [header.get_text(" ", strip=True).lower() for header in table.find_all("th")]
        joined = " ".join(headers)
        if "rank" in joined and "page name" in joined and "followers" in joined:
            return table
    return None


def parse_millions(text: str) -> int:
    value = (text or "").replace(",", "")
    match = re.search(r"\d+(?:\.\d+)?", value)
    return int(float(match.group(0)) * 1_000_000) if match else 0


def _coerce_int(value: Any) -> int:
    if isinstance(value, bool) or value is None:
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    return parse_compact_number(str(value))


def _optional_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    return None


def _find_instagram_user_object(value: Any) -> Dict[str, Any] | None:
    if isinstance(value, dict):
        if isinstance(value.get("user"), dict):
            return value["user"]
        if "username" in value and ("id" in value or "pk" in value):
            return value
        for child in value.values():
            found = _find_instagram_user_object(child)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _find_instagram_user_object(child)
            if found is not None:
                return found
    return None


def _walk_json_values(value: Any):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from _walk_json_values(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_json_values(child)


def _first_facebook_anchor(card):
    for anchor in card.find_all("a", href=True):
        href = anchor["href"]
        if "facebook.com" in href or href.startswith("/"):
            text = anchor.get_text(" ", strip=True)
            if text:
                return anchor
    return None


def _normalize_facebook_url(href: str) -> str:
    url = urljoin("https://www.facebook.com", href)
    parsed = urlparse(url)
    if parsed.path.rstrip("/") == "/profile.php":
        profile_id = parse_qs(parsed.query).get("id", [""])[0]
        if profile_id:
            return f"https://www.facebook.com/profile.php?id={profile_id}"
    return url.split("?")[0].rstrip("/")


def _facebook_handle(profile_url: str) -> str:
    parsed = urlparse(profile_url)
    if parsed.path.rstrip("/") == "/profile.php":
        return parse_qs(parsed.query).get("id", ["profile.php"])[0]
    match = re.search(r"facebook\.com/([^/?#]+)", profile_url)
    return match.group(1) if match else ""


def _wikipedia_slug(profile_url: str) -> str:
    match = re.search(r"/wiki/([^/?#]+)", profile_url)
    return match.group(1) if match else ""


def _card_description(card, name: str) -> str:
    text = card.get_text(" ", strip=True)
    text = re.sub(re.escape(name), "", text, count=1).strip()
    text = re.sub(r"\d+(?:\.\d+)?\s*[KMB]?\s+followers", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"\d+(?:\.\d+)?\s*万?位粉丝", "", text).strip()
    return re.sub(r"\s+", " ", text)


def _parse_facebook_followers(text: str) -> int:
    patterns = [
        r"(\d+(?:\.\d+)?\s*[KMB]?)\s+followers",
        r"(\d+(?:\.\d+)?\s*万?)位粉丝",
        r"(\d+(?:\.\d+)?\s*万?)\s*位粉丝",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return parse_compact_number(match.group(1))
    return 0
