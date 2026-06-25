from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Iterator, Mapping, Protocol
from urllib.parse import urljoin, urlparse

import pandas as pd
import requests


DEFAULT_OUT_DIR = Path("output_youtube_mexico_10k_1000k")
SEARCH_PARAMS_CHANNELS = "EgIQAg%3D%3D"
ABOUT_BROWSE_PARAMS = "EgVhYm91dLgBAJIDAPIGBgoCMgBKAA%3D%3D"
CHANNELS_BATCH_SIZE = 50
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149 Safari/537.36"
)

MEXICO_COUNTRY_VALUES = {"mx", "mexico", "méxico", "墨西哥"}
MEXICO_TERMS = [
    "mexico",
    "méxico",
    "mexicana",
    "mexicano",
    "cdmx",
    "ciudad de mexico",
    "ciudad de méxico",
    "guadalajara",
    "monterrey",
    "jalisco",
    "puebla",
    "tijuana",
    "queretaro",
    "querétaro",
    "yucatan",
    "yucatán",
    "cancun",
    "cancún",
    "guanajuato",
    "oaxaca",
    "veracruz",
    "nuevo leon",
    "nuevo león",
    "baja california",
    "michoacan",
    "michoacán",
    "sinaloa",
    "sonora",
    "chiapas",
    "chihuahua",
    "coahuila",
    "durango",
    "hidalgo",
    "morelos",
    "nayarit",
    "san luis potosi",
    "san luis potosí",
    "tabasco",
    "tamaulipas",
    "tlaxcala",
    "aguascalientes",
    "colima",
    "campeche",
    "zacatecas",
]
EXCLUDE_TERMS = [
    "new mexico",
    "albuquerque",
    "santa fe",
    "las cruces",
    "koat",
    "krqe",
    "kob 4",
]

PREFIXES = [
    "mexico",
    "méxico",
    "mexican",
    "mexicana",
    "mexicano",
    "cdmx",
    "ciudad de mexico",
    "ciudad de méxico",
    "guadalajara",
    "monterrey",
    "jalisco",
    "puebla",
    "tijuana",
    "queretaro",
    "querétaro",
    "yucatan",
    "yucatán",
    "cancun",
    "cancún",
    "guanajuato",
    "oaxaca",
    "veracruz",
    "nuevo leon",
    "nuevo león",
    "baja california",
    "michoacan",
    "michoacán",
    "sinaloa",
    "sonora",
    "chiapas",
    "chihuahua",
    "coahuila",
    "durango",
    "hidalgo",
    "morelos",
    "nayarit",
    "san luis potosi",
    "san luis potosí",
    "tabasco",
    "tamaulipas",
    "tlaxcala",
    "aguascalientes",
    "colima",
    "campeche",
    "zacatecas",
]

TOPICS = [
    "vlog",
    "youtuber",
    "creador de contenido",
    "influencer",
    "canal",
    "lifestyle",
    "travel vlog",
    "viajes",
    "turismo",
    "food vlog",
    "comida",
    "cocina",
    "recetas",
    "beauty youtuber",
    "maquillaje",
    "fitness",
    "tech youtuber",
    "tecnologia",
    "gaming",
    "moda",
    "familia vlog",
    "mama vlog",
    "emprendedor",
    "negocios",
    "real estate",
    "bienes raices",
    "relocation",
    "news",
    "noticias",
    "musica",
    "musica regional",
    "corridos",
    "banda",
    "mariachi",
    "educacion",
    "autos",
    "motos",
    "podcast",
    "humor",
    "finanzas",
    "marketing",
    "fotografia",
    "salud",
    "medicina",
    "arquitectura",
    "diseño",
    "manualidades",
    "anime",
    "kpop",
    "futbol",
    "baseball",
    "historia",
    "misterio",
    "review",
    "unboxing",
    "tutorial",
]

SUBSCRIBER_BANDS = [
    "10 mil suscriptores",
    "20 mil suscriptores",
    "50 mil suscriptores",
    "100 mil suscriptores",
    "200 mil suscriptores",
    "500 mil suscriptores",
    "10k subscribers",
    "20k subscribers",
    "50k subscribers",
    "100k subscribers",
    "200k subscribers",
    "500k subscribers",
]

CHANNEL_QUERY_NOUNS = [
    "canal",
    "canales",
    "youtuber",
    "youtubers",
    "creador",
    "creadores",
    "influencer",
    "influencers",
]

ALPHABET_SUFFIXES = list("abcdefghijklmnopqrstuvwxyz")
GENERIC_PREFIXES = {"mexico", "mexican", "mexicana", "mexicano"}

LOCAL_QUERY_TEMPLATES = [
    "youtubers de {prefix}",
    "canales de {prefix}",
    "creadores de {prefix}",
    "influencers de {prefix}",
    "canal de youtube {prefix}",
    "youtube {prefix}",
    "vlogger {prefix}",
    "videos de {prefix}",
    "desde {prefix}",
    "en {prefix} youtube",
]


@dataclass
class Candidate:
    channel_id: str
    profile_url: str
    handle: str
    name: str
    subscriber_count_hint: int
    description: str
    source_query: str
    source_url: str
    source_api: str
    discovered_at: str

    @property
    def channel_key(self) -> str:
        return self.channel_id or self.profile_url


@dataclass
class ValidatedChannel:
    channel_id: str
    name: str
    handle: str
    subscriber_count: int
    view_count: int
    video_count: int
    profile_url: str
    country: str
    country_source: str
    source_query: str
    source_api: str
    is_strict_mexico: bool
    reject_reason: str
    scraped_at: str
    email: str = ""
    website_url: str = ""
    instagram_url: str = ""
    facebook_url: str = ""
    tiktok_url: str = ""
    twitter_url: str = ""
    other_urls: str = ""
    all_external_urls: str = ""
    description: str = ""

    @property
    def channel_key(self) -> str:
        return self.channel_id or self.profile_url


class SearchClient(Protocol):
    def bootstrap(self) -> None:
        ...

    @property
    def client_version(self) -> str:
        ...

    def search_page(self, query: str) -> dict[str, Any]:
        ...

    def video_search_page(self, query: str) -> dict[str, Any]:
        ...

    def continuation_page(self, token: str) -> dict[str, Any]:
        ...


class ChannelApiClient(Protocol):
    def fetch_channels(self, channel_ids: list[str]) -> list[dict[str, Any]]:
        ...


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def normalize_country(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).lower()


def is_mexico_country(value: str) -> bool:
    normalized = normalize_country(value)
    return normalized in MEXICO_COUNTRY_VALUES or normalized.startswith("mexico ")


def mexico_evidence(*parts: str) -> str:
    haystack = "\n".join(part for part in parts if part).lower()
    if any(term in haystack for term in EXCLUDE_TERMS):
        return ""
    for term in MEXICO_TERMS:
        if term in haystack:
            return term
    return ""


def parse_subscribers(text: str) -> int:
    value = (text or "").replace(",", "").strip()
    match = re.search(r"(\d+(?:\.\d+)?)\s*万\s*位?订阅", value)
    if match:
        return int(float(match.group(1)) * 10_000)
    match = re.search(
        r"(\d+(?:\.\d+)?)\s*(K|M|B)?\s*(?:subscribers|subs|suscriptores|位?订阅者)",
        value,
        re.I,
    )
    if not match:
        return 0
    multiplier = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(
        (match.group(2) or "").upper(), 1
    )
    return int(float(match.group(1)) * multiplier)


def safe_int(value: object, default: int = 0) -> int:
    try:
        return int(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return default


def parse_int_text(text: str) -> int:
    cleaned = re.sub(r"[^\d]", "", text or "")
    return int(cleaned) if cleaned else 0


def text_from_runs(value: Any) -> str:
    if not isinstance(value, dict):
        return ""
    if isinstance(value.get("simpleText"), str):
        return value["simpleText"]
    runs = value.get("runs")
    if isinstance(runs, list):
        return "".join(str(run.get("text", "")) for run in runs if isinstance(run, dict))
    return ""


def view_model_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if not isinstance(value, dict):
        return ""
    if isinstance(value.get("content"), str):
        return value["content"]
    if isinstance(value.get("simpleText"), str):
        return value["simpleText"]
    return text_from_runs(value)


def walk(value: Any) -> Iterator[Any]:
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def find_channel_renderers(data: Any) -> list[dict[str, Any]]:
    return [
        node["channelRenderer"]
        for node in walk(data)
        if isinstance(node, dict) and isinstance(node.get("channelRenderer"), dict)
    ]


def find_video_renderers(data: Any) -> list[dict[str, Any]]:
    return [
        node["videoRenderer"]
        for node in walk(data)
        if isinstance(node, dict) and isinstance(node.get("videoRenderer"), dict)
    ]


def find_continuation_token(data: Any) -> str:
    for node in walk(data):
        if not isinstance(node, dict):
            continue
        command = node.get("continuationCommand")
        if isinstance(command, dict) and command.get("token"):
            return str(command["token"])
    return ""


def renderer_to_candidate(renderer: dict[str, Any], query: str, scraped_at: str) -> Candidate:
    endpoint = renderer.get("navigationEndpoint", {})
    browse = endpoint.get("browseEndpoint", {})
    meta = endpoint.get("commandMetadata", {}).get("webCommandMetadata", {})
    path = meta.get("url") or browse.get("canonicalBaseUrl") or ""
    profile_url = urljoin("https://www.youtube.com", path)
    sub_text = text_from_runs(renderer.get("videoCountText"))
    if not sub_text:
        sub_text = (
            renderer.get("videoCountText", {})
            .get("accessibility", {})
            .get("accessibilityData", {})
            .get("label", "")
        )
    return Candidate(
        channel_id=str(renderer.get("channelId") or browse.get("browseId") or ""),
        profile_url=profile_url,
        handle=path.rstrip("/").split("/")[-1] if path else "",
        name=text_from_runs(renderer.get("title")),
        subscriber_count_hint=parse_subscribers(sub_text),
        description=text_from_runs(renderer.get("descriptionSnippet")),
        source_query=query,
        source_url="youtubei://search",
        source_api="youtubei",
        discovered_at=scraped_at,
    )


def video_renderer_to_candidate(
    renderer: dict[str, Any], query: str, scraped_at: str
) -> Candidate | None:
    owner_run: dict[str, Any] = {}
    for key in ["longBylineText", "ownerText", "shortBylineText"]:
        value = renderer.get(key)
        if not isinstance(value, dict):
            continue
        for run in value.get("runs") or []:
            if not isinstance(run, dict):
                continue
            endpoint = run.get("navigationEndpoint", {})
            browse = endpoint.get("browseEndpoint", {})
            if isinstance(browse, dict) and browse.get("browseId"):
                owner_run = run
                break
        if owner_run:
            break

    if not owner_run:
        return None

    endpoint = owner_run.get("navigationEndpoint", {})
    browse = endpoint.get("browseEndpoint", {})
    meta = endpoint.get("commandMetadata", {}).get("webCommandMetadata", {})
    channel_id = str(browse.get("browseId") or "")
    path = meta.get("url") or browse.get("canonicalBaseUrl") or ""
    if not path and channel_id:
        path = f"/channel/{channel_id}"
    profile_url = urljoin("https://www.youtube.com", path)
    title = text_from_runs(renderer.get("title"))
    description = text_from_runs(renderer.get("descriptionSnippet"))
    owner_name = str(owner_run.get("text") or "")
    return Candidate(
        channel_id=channel_id,
        profile_url=profile_url,
        handle=path.rstrip("/").split("/")[-1] if path else "",
        name=owner_name,
        subscriber_count_hint=0,
        description=" ".join(part for part in [title, description] if part),
        source_query=query,
        source_url="youtubei://search_video",
        source_api="youtubei_video",
        discovered_at=scraped_at,
    )


def build_queries() -> list[str]:
    primary_prefixes = [prefix for prefix in PREFIXES if prefix.isascii()]
    accent_prefixes = [prefix for prefix in PREFIXES if not prefix.isascii()]
    broad_prefixes = primary_prefixes + accent_prefixes
    local_prefixes = [prefix for prefix in primary_prefixes if prefix not in GENERIC_PREFIXES]
    generic_prefixes = [prefix for prefix in primary_prefixes if prefix in GENERIC_PREFIXES]
    seeds: list[str] = [
        "mexico youtuber",
        "mexican youtuber",
        "creador de contenido mexico",
        "influencer mexico youtube",
        "canal mexicano 100 mil suscriptores",
        "canales mexicanos pequeños",
        "youtube channel mexico 100k subscribers",
        "small youtuber mexico",
        "mexico creator business email",
    ]
    for year in [2024, 2025, 2026]:
        seeds.append(f"youtubers mexicanos {year}")
        seeds.append(f"canales mexicanos {year}")

    # Broad searches discover the widest pool early. Letter shards are useful
    # for long-tail discovery, but generic shards often repeat the same channels,
    # so keep them behind city/topic and subscriber-band searches.
    for prefix in primary_prefixes:
        for topic in TOPICS:
            seeds.append(f"{prefix} {topic}")

    for prefix in local_prefixes:
        for template in LOCAL_QUERY_TEMPLATES:
            seeds.append(template.format(prefix=prefix))

    for prefix in accent_prefixes:
        for topic in TOPICS:
            seeds.append(f"{prefix} {topic}")

    for prefix in local_prefixes:
        for topic in TOPICS:
            for letter in ALPHABET_SUFFIXES:
                seeds.append(f"{prefix} {topic} {letter}")

    for prefix in generic_prefixes:
        for topic in TOPICS:
            for letter in ALPHABET_SUFFIXES:
                seeds.append(f"{prefix} {topic} {letter}")

    for prefix in local_prefixes:
        for noun in CHANNEL_QUERY_NOUNS:
            seeds.append(f"{prefix} {noun}")
            for letter in ALPHABET_SUFFIXES:
                seeds.append(f"{prefix} {noun} {letter}")

    for prefix in generic_prefixes:
        for noun in CHANNEL_QUERY_NOUNS:
            seeds.append(f"{prefix} {noun}")
            for letter in ALPHABET_SUFFIXES:
                seeds.append(f"{prefix} {noun} {letter}")

    for number in range(10):
        seeds.append(f"mexico youtube {number}")
        seeds.append(f"canal mexico {number}")
        seeds.append(f"youtuber mexico {number}")
        seeds.append(f"canal mexicano {number}")

    for letter in ALPHABET_SUFFIXES:
        seeds.append(f"mexico youtuber {letter}")
        seeds.append(f"canal mexicano {letter}")
        seeds.append(f"youtuber mexicano {letter}")
        seeds.append(f"creador mexicano {letter}")

    for prefix in broad_prefixes:
        for topic in TOPICS:
            for band in SUBSCRIBER_BANDS:
                seeds.append(f"{prefix} {topic} {band}")

    for prefix in broad_prefixes:
        for noun in CHANNEL_QUERY_NOUNS:
            for band in SUBSCRIBER_BANDS:
                seeds.append(f"{prefix} {noun} {band}")

    seen: set[str] = set()
    queries: list[str] = []
    for query in seeds:
        normalized = re.sub(r"\s+", " ", query).strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        queries.append(normalized)
    return queries


def chunks(values: list[str], size: int) -> Iterator[list[str]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def first_email(text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text or "")
    return match.group(0) if match else ""


def extract_urls(text: str) -> list[str]:
    urls: list[str] = []
    blocked_domains = [
        "youtube.com",
        "youtu.be",
        "googlevideo.com",
        "gstatic.com",
        "google.com",
        "google.cn",
        "googleapis.com",
        "googleusercontent.com",
        "ytimg.com",
        "ggpht.com",
        "schema.org",
        "w3.org",
    ]
    for match in re.finditer(r"https?://[^\s\"'<>\\]+", text or ""):
        url = match.group(0).rstrip(").,;]")
        lowered = url.lower()
        if any(domain in lowered for domain in blocked_domains):
            continue
        if url not in urls:
            urls.append(url)
    return urls


def classify_urls(urls: list[str]) -> dict[str, str]:
    buckets = {
        "website_url": "",
        "instagram_url": "",
        "facebook_url": "",
        "tiktok_url": "",
        "twitter_url": "",
        "other_urls": "",
        "all_external_urls": " | ".join(urls),
    }
    others: list[str] = []
    for url in urls:
        lowered = url.lower()
        if "instagram.com" in lowered and not buckets["instagram_url"]:
            buckets["instagram_url"] = url
        elif "facebook.com" in lowered and not buckets["facebook_url"]:
            buckets["facebook_url"] = url
        elif "tiktok.com" in lowered and not buckets["tiktok_url"]:
            buckets["tiktok_url"] = url
        elif ("twitter.com" in lowered or "x.com" in lowered) and not buckets["twitter_url"]:
            buckets["twitter_url"] = url
        elif not any(
            domain in lowered
            for domain in ["instagram.com", "facebook.com", "tiktok.com", "twitter.com", "x.com"]
        ):
            if not buckets["website_url"]:
                buckets["website_url"] = url
            else:
                others.append(url)
        else:
            others.append(url)
    buckets["other_urls"] = " | ".join(others)
    return buckets


class YouTubeIClient:
    _metadata_lock = threading.Lock()
    _cached_api_key = ""
    _cached_client_version = ""

    def __init__(self, session: requests.Session | None = None) -> None:
        self.session = session or requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/json",
            }
        )
        self.api_key = ""
        self._client_version = ""

    @property
    def client_version(self) -> str:
        return self._client_version

    def bootstrap(self) -> None:
        with self._metadata_lock:
            if self._cached_api_key and self._cached_client_version:
                self.api_key = self._cached_api_key
                self._client_version = self._cached_client_version
                return

            last_error: Exception | None = None
            for delay in (1.0, 2.0, 4.0):
                try:
                    html = self.session.get(
                        "https://www.youtube.com/results?search_query=mexico", timeout=15
                    ).text
                    api_match = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
                    version_match = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html)
                    if not api_match or not version_match:
                        raise RuntimeError("Could not extract YouTube internal API metadata")
                    self.api_key = api_match.group(1)
                    self._client_version = version_match.group(1)
                    self.__class__._cached_api_key = self.api_key
                    self.__class__._cached_client_version = self._client_version
                    return
                except Exception as exc:  # pragma: no cover - exercised by live runs
                    last_error = exc
                    time.sleep(delay)
            assert last_error is not None
            raise last_error

    def context(self) -> dict[str, Any]:
        return {"client": {"clientName": "WEB", "clientVersion": self.client_version}}

    def post(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"https://www.youtube.com/youtubei/v1/{endpoint}?key={self.api_key}"
        last_error: Exception | None = None
        for delay in (0.5, 1.0, 2.0):
            try:
                response = self.session.post(url, json=payload, timeout=12)
                response.raise_for_status()
                return response.json()
            except Exception as exc:  # pragma: no cover - exercised by live runs
                last_error = exc
                time.sleep(delay)
        assert last_error is not None
        raise last_error

    def search_page(self, query: str) -> dict[str, Any]:
        return self.post(
            "search",
            {"context": self.context(), "query": query, "params": SEARCH_PARAMS_CHANNELS},
        )

    def video_search_page(self, query: str) -> dict[str, Any]:
        return self.post("search", {"context": self.context(), "query": query})

    def continuation_page(self, token: str) -> dict[str, Any]:
        return self.post("search", {"context": self.context(), "continuation": token})


class YouTubeDataApiClient:
    def __init__(self, api_key: str, session: requests.Session | None = None) -> None:
        self.api_key = api_key
        self.session = session or requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            }
        )

    def fetch_channels(self, channel_ids: list[str]) -> list[dict[str, Any]]:
        if not channel_ids:
            return []
        response = self.session.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={
                "key": self.api_key,
                "part": "snippet,statistics,brandingSettings",
                "id": ",".join(channel_ids),
                "maxResults": min(len(channel_ids), CHANNELS_BATCH_SIZE),
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        return [item for item in data.get("items", []) if isinstance(item, dict)]


class AboutClient:
    def __init__(self, *, use_youtubei: bool = True) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
            }
        )
        self.use_youtubei = use_youtubei
        self.youtubei_client: YouTubeIClient | None = None

    def fetch(
        self,
        profile_url: str,
        *,
        channel_id: str = "",
        collect_contact: bool = False,
    ) -> dict[str, Any]:
        if self.use_youtubei and channel_id:
            details = self.fetch_youtubei(channel_id, collect_contact=collect_contact)
            if has_about_payload(details):
                return details
        return self.fetch_html(profile_url, collect_contact=collect_contact)

    def fetch_youtubei(self, channel_id: str, *, collect_contact: bool = False) -> dict[str, Any]:
        try:
            if self.youtubei_client is None:
                self.youtubei_client = YouTubeIClient()
                self.youtubei_client.bootstrap()
            data = self.youtubei_client.post(
                "browse",
                {
                    "context": self.youtubei_client.context(),
                    "browseId": channel_id,
                    "params": ABOUT_BROWSE_PARAMS,
                },
            )
        except Exception:
            return default_about()
        return parse_about_browse_response(data, collect_contact=collect_contact)

    def fetch_html(self, profile_url: str, *, collect_contact: bool = False) -> dict[str, Any]:
        url = profile_url.rstrip("/") + "/about"
        try:
            response = self.session.get(url, timeout=(6, 8), stream=True)
            response.raise_for_status()
            chunks: list[str] = []
            total = 0
            for chunk in response.iter_content(chunk_size=65536, decode_unicode=True):
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= 2_000_000:
                    break
            html = "".join(chunks)
        except Exception:
            return default_about()

        return parse_about_html(html, collect_contact=collect_contact)


def has_about_payload(details: Mapping[str, Any]) -> bool:
    return bool(
        details.get("country")
        or details.get("subscriber_count")
        or details.get("video_count")
        or details.get("view_count")
    )


def parse_about_browse_response(data: Mapping[str, Any], *, collect_contact: bool) -> dict[str, Any]:
    model: dict[str, Any] = {}
    for node in walk(data):
        if not isinstance(node, dict):
            continue
        candidate = node.get("aboutChannelViewModel")
        if isinstance(candidate, dict):
            model = candidate
            break

    if not model:
        return default_about()

    description = view_model_text(model.get("description"))
    link_urls: list[str] = []
    for raw_link in model.get("links", []) or []:
        if not isinstance(raw_link, dict):
            continue
        link_model = raw_link.get("channelExternalLinkViewModel")
        if not isinstance(link_model, dict):
            continue
        link = link_model.get("link")
        if not isinstance(link, dict):
            continue
        url = normalize_external_url(view_model_text(link))
        if url and url not in link_urls:
            link_urls.append(url)

    combined = "\n".join([description, *link_urls])
    urls = classify_urls(extract_urls(combined)) if collect_contact else classify_urls([])
    return {
        "country": view_model_text(model.get("country")),
        "subscriber_count": parse_subscribers(view_model_text(model.get("subscriberCountText"))),
        "video_count": parse_int_text(view_model_text(model.get("videoCountText"))),
        "view_count": parse_int_text(view_model_text(model.get("viewCountText"))),
        "email": first_email(combined) if collect_contact else "",
        "description": description[:1000],
        **urls,
    }


def normalize_external_url(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if raw.startswith("www."):
        return "https://" + raw
    parsed = urlparse(raw)
    if parsed.scheme in {"http", "https"}:
        return raw
    if "." in raw and " " not in raw:
        return "https://" + raw
    return raw


def parse_about_html(html: str, *, collect_contact: bool) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    json_text = ""
    match = re.search(r"var ytInitialData = (.*?);\s*</script>", html, flags=re.S)
    if match:
        json_text = match.group(1)
    combined = f"{text}\n{json_text}"
    description = ""
    match = re.search(r'"description"\s*:\s*"([^"]{20,1200})"', json_text)
    if match:
        description = match.group(1).encode("utf-8", "ignore").decode(
            "unicode_escape", "ignore"
        )

    country = ""
    subscriber_count = 0
    video_count = 0
    view_count = 0
    for key, target in [
        ("country", "country"),
        ("subscriberCountText", "subscriber_count"),
        ("videoCountText", "video_count"),
        ("viewCountText", "view_count"),
    ]:
        match = re.search(rf'"{key}"\s*:\s*"([^"]+)"', json_text)
        if not match:
            continue
        value = match.group(1)
        if target == "country":
            country = value
        elif target == "subscriber_count":
            subscriber_count = parse_subscribers(value)
        elif target == "video_count":
            video_count = parse_int_text(value)
        elif target == "view_count":
            view_count = parse_int_text(value)

    urls = classify_urls(extract_urls(combined)) if collect_contact else classify_urls([])
    return {
        "country": country,
        "subscriber_count": subscriber_count,
        "video_count": video_count,
        "view_count": view_count,
        "email": first_email(combined) if collect_contact else "",
        "description": description[:1000] or text[:1000],
        **urls,
    }


def default_about() -> dict[str, Any]:
    return {
        "country": "",
        "subscriber_count": 0,
        "video_count": 0,
        "view_count": 0,
        "email": "",
        "description": "",
        "website_url": "",
        "instagram_url": "",
        "facebook_url": "",
        "tiktok_url": "",
        "twitter_url": "",
        "other_urls": "",
        "all_external_urls": "",
    }


class CrawlState:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.create_schema()

    def close(self) -> None:
        self.conn.close()

    def create_schema(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS queries (
                query TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                pages_done INTEGER NOT NULL DEFAULT 0,
                candidates_found INTEGER NOT NULL DEFAULT 0,
                last_error TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS candidates (
                channel_key TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                profile_url TEXT NOT NULL,
                handle TEXT NOT NULL,
                name TEXT NOT NULL,
                subscriber_count_hint INTEGER NOT NULL DEFAULT 0,
                description TEXT NOT NULL,
                source_query TEXT NOT NULL,
                source_url TEXT NOT NULL,
                source_api TEXT NOT NULL,
                discovered_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS validated_channels (
                channel_key TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                name TEXT NOT NULL,
                handle TEXT NOT NULL,
                subscriber_count INTEGER NOT NULL DEFAULT 0,
                view_count INTEGER NOT NULL DEFAULT 0,
                video_count INTEGER NOT NULL DEFAULT 0,
                profile_url TEXT NOT NULL,
                country TEXT NOT NULL,
                country_source TEXT NOT NULL,
                source_query TEXT NOT NULL,
                source_api TEXT NOT NULL,
                is_strict_mexico INTEGER NOT NULL DEFAULT 0,
                reject_reason TEXT NOT NULL DEFAULT '',
                scraped_at TEXT NOT NULL,
                email TEXT NOT NULL DEFAULT '',
                website_url TEXT NOT NULL DEFAULT '',
                instagram_url TEXT NOT NULL DEFAULT '',
                facebook_url TEXT NOT NULL DEFAULT '',
                tiktok_url TEXT NOT NULL DEFAULT '',
                twitter_url TEXT NOT NULL DEFAULT '',
                other_urls TEXT NOT NULL DEFAULT '',
                all_external_urls TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS rejections (
                channel_key TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                profile_url TEXT NOT NULL,
                name TEXT NOT NULL,
                subscriber_count INTEGER NOT NULL DEFAULT 0,
                country TEXT NOT NULL DEFAULT '',
                country_source TEXT NOT NULL DEFAULT '',
                source_query TEXT NOT NULL DEFAULT '',
                source_api TEXT NOT NULL DEFAULT '',
                reject_reason TEXT NOT NULL,
                scraped_at TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    def query_completed(self, query: str) -> bool:
        row = self.conn.execute(
            "SELECT status FROM queries WHERE query = ?", (query,)
        ).fetchone()
        return bool(row and row["status"] == "completed")

    def mark_query(
        self,
        query: str,
        *,
        status: str,
        pages_done: int = 0,
        candidates_found: int = 0,
        last_error: str = "",
    ) -> None:
        self.conn.execute(
            """
            INSERT INTO queries (
                query, status, pages_done, candidates_found, last_error, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(query) DO UPDATE SET
                status = excluded.status,
                pages_done = excluded.pages_done,
                candidates_found = excluded.candidates_found,
                last_error = excluded.last_error,
                updated_at = excluded.updated_at
            """,
            (query, status, pages_done, candidates_found, last_error[:500], utc_now()),
        )
        self.conn.commit()

    def has_channel(self, channel_key: str) -> bool:
        if not channel_key:
            return True
        for table in ["validated_channels", "rejections", "candidates"]:
            row = self.conn.execute(
                f"SELECT 1 FROM {table} WHERE channel_key = ?", (channel_key,)
            ).fetchone()
            if row:
                return True
        return False

    def add_candidates(self, candidates: Iterable[Candidate]) -> int:
        rows = [candidate for candidate in candidates if candidate.channel_key]
        self.conn.executemany(
            """
            INSERT OR IGNORE INTO candidates (
                channel_key, channel_id, profile_url, handle, name,
                subscriber_count_hint, description, source_query, source_url,
                source_api, discovered_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    candidate.channel_key,
                    candidate.channel_id,
                    candidate.profile_url,
                    candidate.handle,
                    candidate.name,
                    candidate.subscriber_count_hint,
                    candidate.description,
                    candidate.source_query,
                    candidate.source_url,
                    candidate.source_api,
                    candidate.discovered_at,
                )
                for candidate in rows
            ],
        )
        self.conn.commit()
        return self.conn.total_changes

    def pending_candidates(
        self,
        limit: int,
        *,
        min_subscribers: int = 10_000,
        max_subscribers: int = 1_000_000,
    ) -> list[Candidate]:
        query = """
            SELECT c.*
            FROM candidates c
            LEFT JOIN validated_channels v ON v.channel_key = c.channel_key
            LEFT JOIN rejections r ON r.channel_key = c.channel_key
            WHERE v.channel_key IS NULL
              AND r.channel_key IS NULL
              AND c.channel_id != ''
            ORDER BY
              CASE
                WHEN c.subscriber_count_hint BETWEEN ? AND ? THEN 0
                WHEN c.subscriber_count_hint = 0 AND c.source_api = 'youtubei_video' THEN 1
                WHEN c.subscriber_count_hint = 0 THEN 3
                ELSE 2
              END,
              c.discovered_at,
              c.rowid
            LIMIT ?
        """
        rows = self.conn.execute(query, (min_subscribers, max_subscribers, limit)).fetchall()
        return [
            Candidate(
                channel_id=row["channel_id"],
                profile_url=row["profile_url"],
                handle=row["handle"],
                name=row["name"],
                subscriber_count_hint=row["subscriber_count_hint"],
                description=row["description"],
                source_query=row["source_query"],
                source_url=row["source_url"],
                source_api=row["source_api"],
                discovered_at=row["discovered_at"],
            )
            for row in rows
        ]

    def add_validated(self, rows: Iterable[ValidatedChannel]) -> None:
        rows = list(rows)
        if not rows:
            return
        self.conn.executemany(
            """
            INSERT OR REPLACE INTO validated_channels (
                channel_key, channel_id, name, handle, subscriber_count, view_count,
                video_count, profile_url, country, country_source, source_query,
                source_api, is_strict_mexico, reject_reason, scraped_at, email,
                website_url, instagram_url, facebook_url, tiktok_url, twitter_url,
                other_urls, all_external_urls, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    row.channel_key,
                    row.channel_id,
                    row.name,
                    row.handle,
                    row.subscriber_count,
                    row.view_count,
                    row.video_count,
                    row.profile_url,
                    row.country,
                    row.country_source,
                    row.source_query,
                    row.source_api,
                    int(row.is_strict_mexico),
                    row.reject_reason,
                    row.scraped_at,
                    row.email,
                    row.website_url,
                    row.instagram_url,
                    row.facebook_url,
                    row.tiktok_url,
                    row.twitter_url,
                    row.other_urls,
                    row.all_external_urls,
                    row.description,
                )
                for row in rows
            ],
        )
        self.conn.commit()

    def add_rejections(self, rows: Iterable[ValidatedChannel]) -> None:
        rows = [row for row in rows if row.reject_reason]
        if not rows:
            return
        self.conn.executemany(
            """
            INSERT OR REPLACE INTO rejections (
                channel_key, channel_id, profile_url, name, subscriber_count,
                country, country_source, source_query, source_api, reject_reason,
                scraped_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    row.channel_key,
                    row.channel_id,
                    row.profile_url,
                    row.name,
                    row.subscriber_count,
                    row.country,
                    row.country_source,
                    row.source_query,
                    row.source_api,
                    row.reject_reason,
                    row.scraped_at,
                )
                for row in rows
            ],
        )
        self.conn.commit()

    def accepted_count(self) -> int:
        row = self.conn.execute("SELECT COUNT(*) AS count FROM validated_channels").fetchone()
        return int(row["count"] if row else 0)

    def strict_mexico_count(self) -> int:
        row = self.conn.execute(
            "SELECT COUNT(*) AS count FROM validated_channels WHERE is_strict_mexico = 1"
        ).fetchone()
        return int(row["count"] if row else 0)

    def candidate_count(self) -> int:
        row = self.conn.execute("SELECT COUNT(*) AS count FROM candidates").fetchone()
        return int(row["count"] if row else 0)

    def counts(self) -> dict[str, int]:
        result: dict[str, int] = {}
        for name in ["queries", "candidates", "validated_channels", "rejections"]:
            row = self.conn.execute(f"SELECT COUNT(*) AS count FROM {name}").fetchone()
            result[name] = int(row["count"] if row else 0)
        result["accepted_channels"] = self.accepted_count()
        result["strict_mexico_channels"] = self.strict_mexico_count()
        return result

    def accepted_dataframe(self, *, collect_contact: bool) -> pd.DataFrame:
        rows = self.conn.execute(
            """
            SELECT *
            FROM validated_channels
            ORDER BY is_strict_mexico DESC, subscriber_count DESC, name COLLATE NOCASE
            """
        ).fetchall()
        data = [dict(row) for row in rows]
        columns = export_columns(collect_contact=collect_contact)
        df = pd.DataFrame(data)
        if df.empty:
            return pd.DataFrame(columns=[column for _, column in columns])
        df["is_strict_mexico"] = df["is_strict_mexico"].map(lambda value: "是" if value else "否")
        return df[[key for key, _ in columns]].rename(columns=dict(columns))

    def rejected_dataframe(self) -> pd.DataFrame:
        rows = self.conn.execute(
            """
            SELECT *
            FROM rejections
            ORDER BY scraped_at, name COLLATE NOCASE
            """
        ).fetchall()
        df = pd.DataFrame([dict(row) for row in rows])
        columns = {
            "channel_id": "频道ID",
            "name": "名称",
            "profile_url": "频道链接",
            "subscriber_count": "订阅数",
            "country": "国家",
            "country_source": "国家来源",
            "source_query": "来源关键词",
            "source_api": "来源接口",
            "reject_reason": "拒绝原因",
            "scraped_at": "采集时间",
        }
        if df.empty:
            return pd.DataFrame(columns=list(columns.values()))
        return df[list(columns)].rename(columns=columns)

    def candidates_dataframe(self) -> pd.DataFrame:
        rows = self.conn.execute(
            """
            SELECT *
            FROM candidates
            ORDER BY discovered_at, source_query, name COLLATE NOCASE
            """
        ).fetchall()
        df = pd.DataFrame([dict(row) for row in rows])
        columns = {
            "channel_id": "频道ID",
            "name": "名称",
            "handle": "账号",
            "subscriber_count_hint": "订阅数(搜索页)",
            "profile_url": "频道链接",
            "source_query": "来源关键词",
            "source_url": "来源链接",
            "source_api": "来源接口",
            "discovered_at": "发现时间",
            "description": "简介",
        }
        if df.empty:
            return pd.DataFrame(columns=list(columns.values()))
        return df[list(columns)].rename(columns=columns)


def export_columns(*, collect_contact: bool) -> list[tuple[str, str]]:
    columns = [
        ("channel_id", "频道ID"),
        ("name", "名称"),
        ("handle", "账号"),
        ("subscriber_count", "订阅数"),
        ("view_count", "观看量"),
        ("video_count", "视频数"),
        ("profile_url", "频道链接"),
        ("country", "国家"),
        ("country_source", "国家来源"),
        ("source_query", "来源关键词"),
        ("source_api", "来源接口"),
        ("is_strict_mexico", "是否严格墨西哥"),
        ("reject_reason", "拒绝原因"),
        ("scraped_at", "采集时间"),
        ("description", "简介"),
    ]
    if collect_contact:
        columns[14:14] = [
            ("email", "邮箱"),
            ("website_url", "官网链接"),
            ("instagram_url", "Instagram链接"),
            ("facebook_url", "Facebook链接"),
            ("tiktok_url", "TikTok链接"),
            ("twitter_url", "X/Twitter链接"),
            ("other_urls", "其他链接"),
            ("all_external_urls", "全部外链"),
        ]
    return columns


def official_channel_to_validated(
    item: Mapping[str, Any],
    candidate: Candidate,
    *,
    min_subscribers: int,
    max_subscribers: int,
    strict_country: bool,
    scraped_at: str,
) -> ValidatedChannel:
    snippet = item.get("snippet", {}) if isinstance(item.get("snippet"), dict) else {}
    statistics = item.get("statistics", {}) if isinstance(item.get("statistics"), dict) else {}
    branding = item.get("brandingSettings", {}) if isinstance(item.get("brandingSettings"), dict) else {}
    branding_channel = (
        branding.get("channel", {}) if isinstance(branding.get("channel"), dict) else {}
    )

    channel_id = str(item.get("id") or candidate.channel_id)
    country = str(snippet.get("country") or branding_channel.get("country") or "")
    country_source = "snippet.country" if snippet.get("country") else ""
    if not country_source and branding_channel.get("country"):
        country_source = "brandingSettings.channel.country"
    subscriber_count = safe_int(statistics.get("subscriberCount"))
    view_count = safe_int(statistics.get("viewCount"))
    video_count = safe_int(statistics.get("videoCount"))

    reject_reason = ""
    if not subscriber_count:
        reject_reason = "missing_subscriber_count"
    elif subscriber_count < min_subscribers:
        reject_reason = "below_min_subscribers"
    elif subscriber_count > max_subscribers:
        reject_reason = "above_max_subscribers"
    elif strict_country and country and not is_mexico_country(country):
        reject_reason = "not_mexico_country"
    elif strict_country and not country:
        reject_reason = "missing_country"

    is_strict_mexico = not reject_reason and is_mexico_country(country)
    return ValidatedChannel(
        channel_id=channel_id,
        name=str(snippet.get("title") or candidate.name),
        handle=candidate.handle,
        subscriber_count=subscriber_count,
        view_count=view_count,
        video_count=video_count,
        profile_url=candidate.profile_url,
        country=country,
        country_source=country_source,
        source_query=candidate.source_query,
        source_api=candidate.source_api,
        is_strict_mexico=is_strict_mexico,
        reject_reason=reject_reason,
        scraped_at=scraped_at,
        description=str(snippet.get("description") or candidate.description)[:1000],
    )


def apply_about_fallback(
    row: ValidatedChannel,
    about: Mapping[str, Any],
    *,
    strict_country: bool,
    collect_contact: bool,
    min_subscribers: int = 10_000,
    max_subscribers: int = 1_000_000,
) -> ValidatedChannel:
    country = str(about.get("country") or "")
    if country and not row.country:
        row.country = country
        row.country_source = "about.country"
    if row.reject_reason == "missing_country" and is_mexico_country(country):
        row.country = country
        row.country_source = "about.country"
        row.reject_reason = ""
        row.is_strict_mexico = True
    elif row.reject_reason == "missing_country" and strict_country:
        row.country = country
        row.country_source = "about.country" if country else ""
        row.reject_reason = "not_mexico_about_country" if country else "missing_country"
        row.is_strict_mexico = False

    subscriber_count = safe_int(about.get("subscriber_count"))
    video_count = safe_int(about.get("video_count"))
    view_count = safe_int(about.get("view_count"))
    if subscriber_count:
        row.subscriber_count = subscriber_count
    if video_count:
        row.video_count = video_count
    if view_count:
        row.view_count = view_count

    if collect_contact:
        for key in [
            "email",
            "website_url",
            "instagram_url",
            "facebook_url",
            "tiktok_url",
            "twitter_url",
            "other_urls",
            "all_external_urls",
        ]:
            setattr(row, key, str(about.get(key) or ""))
    if about.get("description") and not row.description:
        row.description = str(about["description"])[:1000]

    if not row.subscriber_count:
        row.reject_reason = "missing_subscriber_count"
        row.is_strict_mexico = False
    elif row.subscriber_count < min_subscribers:
        row.reject_reason = "below_min_subscribers"
        row.is_strict_mexico = False
    elif row.subscriber_count > max_subscribers:
        row.reject_reason = "above_max_subscribers"
        row.is_strict_mexico = False
    elif strict_country and row.country and not is_mexico_country(row.country):
        row.reject_reason = "not_mexico_about_country"
        row.is_strict_mexico = False
    elif strict_country and not row.country:
        row.reject_reason = "missing_country"
        row.is_strict_mexico = False
    else:
        row.reject_reason = ""
        row.is_strict_mexico = is_mexico_country(row.country)
    return row


def validate_candidates(
    candidates: list[Candidate],
    api_client: ChannelApiClient | None,
    *,
    min_subscribers: int,
    max_subscribers: int,
    strict_country: bool,
    allow_about_only: bool,
    collect_contact: bool,
    about_workers: int,
    scraped_at: str,
) -> tuple[list[ValidatedChannel], list[ValidatedChannel]]:
    by_id = {candidate.channel_id: candidate for candidate in candidates if candidate.channel_id}
    accepted: list[ValidatedChannel] = []
    rejected: list[ValidatedChannel] = []
    rows: list[ValidatedChannel] = []
    returned_ids: set[str] = set()

    if api_client is not None:
        for batch in chunks(list(by_id), CHANNELS_BATCH_SIZE):
            for item in api_client.fetch_channels(batch):
                channel_id = str(item.get("id") or "")
                candidate = by_id.get(channel_id)
                if candidate is None:
                    continue
                returned_ids.add(channel_id)
                rows.append(
                    official_channel_to_validated(
                        item,
                        candidate,
                        min_subscribers=min_subscribers,
                        max_subscribers=max_subscribers,
                        strict_country=strict_country,
                        scraped_at=scraped_at,
                    )
                )

    for channel_id, candidate in by_id.items():
        if channel_id in returned_ids:
            continue
        if api_client is None and allow_about_only:
            subscriber_count = candidate.subscriber_count_hint
            reject_reason = ""
            if not subscriber_count:
                reject_reason = "missing_country" if strict_country else "missing_subscriber_count"
            elif subscriber_count < min_subscribers:
                reject_reason = "below_min_subscribers"
            elif subscriber_count > max_subscribers:
                reject_reason = "above_max_subscribers"
            elif strict_country:
                reject_reason = "missing_country"
            rows.append(
                ValidatedChannel(
                    channel_id=candidate.channel_id,
                    name=candidate.name,
                    handle=candidate.handle,
                    subscriber_count=subscriber_count,
                    view_count=0,
                    video_count=0,
                    profile_url=candidate.profile_url,
                    country="",
                    country_source="",
                    source_query=candidate.source_query,
                    source_api=candidate.source_api,
                    is_strict_mexico=False,
                    reject_reason=reject_reason,
                    scraped_at=scraped_at,
                    description=candidate.description,
                )
            )
        else:
            rejected.append(
                ValidatedChannel(
                    channel_id=candidate.channel_id,
                    name=candidate.name,
                    handle=candidate.handle,
                    subscriber_count=0,
                    view_count=0,
                    video_count=0,
                    profile_url=candidate.profile_url,
                    country="",
                    country_source="",
                    source_query=candidate.source_query,
                    source_api=candidate.source_api,
                    is_strict_mexico=False,
                    reject_reason="official_api_not_returned",
                    scraped_at=scraped_at,
                    description=candidate.description,
                )
            )

    rows = enrich_rows_with_about(
        rows,
        strict_country=strict_country,
        collect_contact=collect_contact,
        about_workers=about_workers,
        min_subscribers=min_subscribers,
        max_subscribers=max_subscribers,
    )

    for row in rows:
        if row.reject_reason:
            rejected.append(row)
        else:
            accepted.append(row)
    return accepted, rejected


def enrich_rows_with_about(
    rows: list[ValidatedChannel],
    *,
    strict_country: bool,
    collect_contact: bool,
    about_workers: int,
    min_subscribers: int = 10_000,
    max_subscribers: int = 1_000_000,
) -> list[ValidatedChannel]:
    needs_about = [
        row
        for row in rows
        if (strict_country and row.reject_reason == "missing_country")
        or row.reject_reason == "missing_subscriber_count"
        or (collect_contact and not row.reject_reason)
    ]
    if not needs_about:
        return rows

    thread_about_clients = threading.local()

    def fetch(row: ValidatedChannel) -> tuple[ValidatedChannel, dict[str, Any]]:
        client = getattr(thread_about_clients, "client", None)
        if client is None:
            client = AboutClient()
            thread_about_clients.client = client
        return row, client.fetch(
            row.profile_url,
            channel_id=row.channel_id,
            collect_contact=collect_contact,
        )

    with ThreadPoolExecutor(max_workers=max(1, about_workers)) as executor:
        futures = [executor.submit(fetch, row) for row in needs_about]
        for future in as_completed(futures):
            row, about = future.result()
            apply_about_fallback(
                row,
                about,
                strict_country=strict_country,
                collect_contact=collect_contact,
                min_subscribers=min_subscribers,
                max_subscribers=max_subscribers,
            )
    return rows


def discover_candidates_for_query(
    client: SearchClient,
    query: str,
    *,
    max_pages: int,
    sleep_seconds: float,
    scraped_at: str,
) -> tuple[list[Candidate], int]:
    candidates: list[Candidate] = []
    seen: set[str] = set()

    def add_candidate(candidate: Candidate | None) -> None:
        if candidate is None or not candidate.channel_key or not candidate.name:
            return
        if candidate.channel_key in seen:
            return
        if not mexico_evidence(candidate.name, candidate.handle, candidate.description, query):
            return
        seen.add(candidate.channel_key)
        candidates.append(candidate)

    def collect_pages(data: dict[str, Any], *, include_video_owners: bool) -> int:
        pages_done = 0
        for _ in range(max_pages):
            pages_done += 1
            for renderer in find_channel_renderers(data):
                add_candidate(renderer_to_candidate(renderer, query, scraped_at))
            if include_video_owners:
                for renderer in find_video_renderers(data):
                    add_candidate(video_renderer_to_candidate(renderer, query, scraped_at))
            token = find_continuation_token(data)
            if not token:
                break
            time.sleep(sleep_seconds)
            data = client.continuation_page(token)
        return pages_done

    pages_done = collect_pages(client.search_page(query), include_video_owners=False)
    pages_done += collect_pages(client.video_search_page(query), include_video_owners=True)
    return candidates, pages_done


def export_outputs(
    state: CrawlState,
    out_dir: Path,
    *,
    collect_contact: bool,
    summary: Mapping[str, Any],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    accepted = state.accepted_dataframe(collect_contact=collect_contact)
    rejected = state.rejected_dataframe()
    min_k = safe_int(summary.get("min_subscribers")) // 1000
    max_k = safe_int(summary.get("max_subscribers")) // 1000
    range_slug = f"{min_k}k_{max_k}k" if min_k and max_k else "10k_1000k"
    accepted_csv = out_dir / f"youtube_mexico_{range_slug}_channels.csv"
    accepted_xlsx = out_dir / f"youtube_mexico_{range_slug}_channels.xlsx"
    rejected_csv = out_dir / "rejected_channels.csv"
    summary_path = out_dir / "crawl_summary.json"
    accepted.to_csv(accepted_csv, index=False, encoding="utf-8-sig")
    accepted.to_excel(accepted_xlsx, index=False)
    rejected.to_csv(rejected_csv, index=False, encoding="utf-8-sig")
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def export_candidate_outputs(
    state: CrawlState,
    out_dir: Path,
    *,
    summary: Mapping[str, Any],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    candidates = state.candidates_dataframe()
    candidates_csv = out_dir / "youtube_mexico_candidate_ids.csv"
    candidates_xlsx = out_dir / "youtube_mexico_candidate_ids.xlsx"
    summary_path = out_dir / "crawl_summary.json"
    candidates.to_csv(candidates_csv, index=False, encoding="utf-8-sig")
    candidates.to_excel(candidates_xlsx, index=False)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def run_crawl(
    *,
    out_dir: Path,
    min_subscribers: int,
    max_subscribers: int,
    target_rows: int,
    candidate_target: int,
    discovery_only: bool,
    strict_country: bool,
    resume: bool,
    query_limit: int,
    max_pages_per_query: int,
    search_workers: int,
    about_workers: int,
    sleep_seconds: float,
    collect_contact: bool,
    allow_about_only: bool,
    api_key: str,
    search_client: SearchClient | None = None,
    api_client: ChannelApiClient | None = None,
    queries: list[str] | None = None,
) -> dict[str, Any]:
    if not discovery_only and api_client is None and not api_key and not allow_about_only:
        raise SystemExit(
            "YOUTUBE_API_KEY is required for strict 40k-scale crawling. "
            "Set YOUTUBE_API_KEY or pass --allow-about-only for slow fallback."
        )

    out_dir.mkdir(parents=True, exist_ok=True)
    state_path = out_dir / "crawl_state.sqlite"
    if state_path.exists() and not resume:
        state_path.unlink()
    state = CrawlState(state_path)
    started_at = utc_now()
    summary: dict[str, Any] = {}
    try:
        if api_client is None:
            if api_key:
                api_client = YouTubeDataApiClient(api_key)

        client_versions: list[str] = []
        thread_clients = threading.local()

        if search_client is not None:
            search_client.bootstrap()
            client_versions.append(search_client.client_version)

        def get_search_client() -> SearchClient:
            if search_client is not None:
                return search_client
            client = getattr(thread_clients, "client", None)
            if client is None:
                client = YouTubeIClient()
                client.bootstrap()
                thread_clients.client = client
                client_versions.append(client.client_version)
            return client

        query_list = queries or build_queries()
        if query_limit:
            query_list = query_list[:query_limit]

        def validate_pending_batches(label: str) -> None:
            while state.accepted_count() < target_rows:
                pending = state.pending_candidates(
                    CHANNELS_BATCH_SIZE * 10,
                    min_subscribers=min_subscribers,
                    max_subscribers=max_subscribers,
                )
                if not pending:
                    break
                accepted, rejected = validate_candidates(
                    pending,
                    api_client,
                    min_subscribers=min_subscribers,
                    max_subscribers=max_subscribers,
                    strict_country=strict_country,
                    allow_about_only=allow_about_only,
                    collect_contact=collect_contact,
                    about_workers=about_workers,
                    scraped_at=utc_now(),
                )
                state.add_validated(accepted)
                state.add_rejections(rejected)
                print(
                    f"validated {label} accepted+{len(accepted)} rejected+{len(rejected)} "
                    f"total={state.accepted_count()} strict_mx={state.strict_mexico_count()}"
                )
                if not accepted and not rejected:
                    break

        def discover(query: str) -> tuple[str, list[Candidate], int, str]:
            try:
                candidates, pages_done = discover_candidates_for_query(
                    get_search_client(),
                    query,
                    max_pages=max_pages_per_query,
                    sleep_seconds=sleep_seconds,
                    scraped_at=started_at,
                )
                return query, candidates, pages_done, ""
            except Exception as exc:
                return query, [], 0, str(exc)

        if not discovery_only:
            validate_pending_batches("seeded")

        with ThreadPoolExecutor(max_workers=max(1, search_workers)) as search_executor:
            for group_start in range(0, len(query_list), max(1, search_workers)):
                if discovery_only:
                    if candidate_target and state.candidate_count() >= candidate_target:
                        break
                elif state.accepted_count() >= target_rows:
                    break
                group = query_list[group_start : group_start + max(1, search_workers)]
                group = [query for query in group if not (resume and state.query_completed(query))]
                if not group:
                    continue
                for query in group:
                    state.mark_query(query, status="running")

                futures = [search_executor.submit(discover, query) for query in group]
                for future in as_completed(futures):
                    query, candidates, pages_done, error = future.result()
                    if error:
                        state.mark_query(query, status="failed", last_error=error)
                        print(f"query failed query={query} error={error}")
                        continue
                    inserted_before = state.counts()["candidates"]
                    state.add_candidates(candidates)
                    inserted_after = state.counts()["candidates"]
                    state.mark_query(
                        query,
                        status="completed",
                        pages_done=pages_done,
                        candidates_found=max(0, inserted_after - inserted_before),
                    )
                    print(
                        f"query={query} pages={pages_done} candidates={len(candidates)} "
                        f"unique_candidates={state.candidate_count()} accepted={state.accepted_count()}"
                    )

                if discovery_only:
                    continue

                validate_pending_batches("batch")

        # Validate any remaining discovered candidates after all query groups finish.
        if not discovery_only:
            validate_pending_batches("remaining")

        counts = state.counts()
        summary = {
            "started_at": started_at,
            "finished_at": utc_now(),
            "target_rows": target_rows,
            "candidate_target": candidate_target,
            "discovery_only": discovery_only,
            "accepted_rows": counts["accepted_channels"],
            "target_met": counts["accepted_channels"] >= target_rows,
            "min_subscribers": min_subscribers,
            "max_subscribers": max_subscribers,
            "strict_country": strict_country,
            "collect_contact": collect_contact,
            "allow_about_only": allow_about_only,
            "youtubei_client_version": client_versions[0] if client_versions else "",
            **counts,
        }
        if discovery_only:
            summary["target_met"] = (
                counts["candidates"] >= candidate_target if candidate_target else True
            )
            export_candidate_outputs(state, out_dir, summary=summary)
        else:
            export_outputs(state, out_dir, collect_contact=collect_contact, summary=summary)
        return summary
    finally:
        state.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fast strict Mexico YouTube channel crawler using youtubei discovery and official channels.list validation."
    )
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--min-subscribers", type=int, default=10_000)
    parser.add_argument("--max-subscribers", type=int, default=1_000_000)
    parser.add_argument("--target-rows", type=int, default=40_000)
    parser.add_argument(
        "--candidate-target",
        type=int,
        default=0,
        help="Stop discovery after this many unique candidate channel IDs. 0 means no candidate cap.",
    )
    parser.add_argument(
        "--discovery-only",
        action="store_true",
        help="Only collect candidate channel IDs from youtubei search; skip country/detail validation.",
    )
    parser.add_argument("--strict-country", action="store_true", default=True)
    parser.add_argument("--no-strict-country", action="store_false", dest="strict_country")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--query-limit", type=int, default=0)
    parser.add_argument("--max-pages-per-query", type=int, default=8)
    parser.add_argument("--search-workers", type=int, default=4)
    parser.add_argument("--about-workers", type=int, default=12)
    parser.add_argument("--sleep", type=float, default=0.1)
    parser.add_argument("--collect-contact", action="store_true")
    parser.add_argument("--allow-about-only", action="store_true")
    parser.add_argument(
        "--api-key",
        default=os.getenv("YOUTUBE_API_KEY", ""),
        help="YouTube Data API key. Defaults to YOUTUBE_API_KEY.",
    )
    return parser


def validate_args(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
    if args.min_subscribers < 0:
        parser.error("--min-subscribers must be >= 0")
    if args.max_subscribers < args.min_subscribers:
        parser.error("--max-subscribers must be >= --min-subscribers")
    if args.target_rows < 1:
        parser.error("--target-rows must be >= 1")
    if args.candidate_target < 0:
        parser.error("--candidate-target must be >= 0")
    if args.max_pages_per_query < 1:
        parser.error("--max-pages-per-query must be >= 1")
    if args.search_workers < 1:
        parser.error("--search-workers must be >= 1")
    if args.about_workers < 1:
        parser.error("--about-workers must be >= 1")
    if args.sleep < 0:
        parser.error("--sleep must be >= 0")


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    validate_args(parser, args)
    summary = run_crawl(
        out_dir=Path(args.out_dir),
        min_subscribers=args.min_subscribers,
        max_subscribers=args.max_subscribers,
        target_rows=args.target_rows,
        candidate_target=args.candidate_target,
        discovery_only=args.discovery_only,
        strict_country=args.strict_country,
        resume=args.resume,
        query_limit=args.query_limit,
        max_pages_per_query=args.max_pages_per_query,
        search_workers=args.search_workers,
        about_workers=args.about_workers,
        sleep_seconds=args.sleep,
        collect_contact=args.collect_contact,
        allow_about_only=args.allow_about_only,
        api_key=args.api_key,
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if args.discovery_only:
        return 0 if summary.get("candidates", 0) else 1
    return 0 if summary.get("accepted_rows", 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())
