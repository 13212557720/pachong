from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import pandas as pd
import requests


DEFAULT_OUT_DIR = Path("output_youtube_mexico_50k_500k_youtubei")
SEARCH_PARAMS_CHANNELS = "EgIQAg%3D%3D"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149 Safari/537.36"
)

PREFIXES = [
    "mexico",
    "méxico",
    "mexican",
    "cdmx",
    "ciudad de mexico",
    "guadalajara",
    "monterrey",
    "jalisco",
    "puebla",
    "tijuana",
    "queretaro",
    "yucatan",
    "cancun",
    "guanajuato",
    "oaxaca",
    "veracruz",
    "nuevo leon",
    "baja california",
    "michoacan",
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
    "tabasco",
    "tamaulipas",
]

TOPICS = [
    "vlog",
    "youtuber",
    "creador de contenido",
    "influencer",
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
    "gaming",
    "moda",
    "familia vlog",
    "mama vlog",
    "emprendedor",
    "negocios",
    "real estate",
    "relocation",
    "news",
    "noticias",
    "musica",
    "musica regional",
    "corridos",
    "banda",
    "educacion",
    "autos",
    "motos",
    "podcast",
    "humor",
    "finanzas",
    "marketing",
    "fotografia",
    "salud",
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
    "michoacan",
    "michoacán",
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


@dataclass
class Lead:
    platform: str
    country: str
    name: str
    handle: str
    channel_id: str
    subscriber_count: int
    profile_url: str
    email: str
    website_url: str
    instagram_url: str
    facebook_url: str
    tiktok_url: str
    twitter_url: str
    other_urls: str
    all_external_urls: str
    location: str
    description: str
    source_query: str
    source_url: str
    about_url: str
    mexico_evidence: str
    scraped_at: str


def build_queries() -> list[str]:
    seeds = [
        "mexico youtuber",
        "mexican youtuber",
        "creador de contenido mexico",
        "influencer mexico youtube",
        "canal mexicano 100 mil suscriptores",
        "canales mexicanos pequeños",
        "mexico creator business email",
    ]
    for prefix in PREFIXES:
        for topic in TOPICS:
            seeds.append(f"{prefix} {topic}")
    seen = set()
    out = []
    for query in seeds:
        if query in seen:
            continue
        seen.add(query)
        out.append(query)
    return out


def text_from_runs(value: Any) -> str:
    if not isinstance(value, dict):
        return ""
    if isinstance(value.get("simpleText"), str):
        return value["simpleText"]
    runs = value.get("runs")
    if isinstance(runs, list):
        return "".join(str(run.get("text", "")) for run in runs if isinstance(run, dict))
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


def walk(value: Any):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def find_channel_renderers(data: Any) -> list[dict[str, Any]]:
    return [node["channelRenderer"] for node in walk(data) if isinstance(node, dict) and "channelRenderer" in node]


def find_continuation_token(data: Any) -> str:
    for node in walk(data):
        if isinstance(node, dict) and "continuationCommand" in node:
            token = node["continuationCommand"].get("token", "")
            if token:
                return token
    return ""


def first_email(text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text or "")
    return match.group(0) if match else ""


def extract_urls(text: str) -> list[str]:
    urls = []
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
    others = []
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
        elif not any(domain in lowered for domain in ["instagram.com", "facebook.com", "tiktok.com", "twitter.com", "x.com"]):
            if not buckets["website_url"]:
                buckets["website_url"] = url
            else:
                others.append(url)
        else:
            others.append(url)
    buckets["other_urls"] = " | ".join(others)
    return buckets


def mexico_evidence(*parts: str) -> str:
    haystack = "\n".join(part for part in parts if part).lower()
    if any(term in haystack for term in EXCLUDE_TERMS):
        return ""
    for term in MEXICO_TERMS:
        if term in haystack:
            return term
    return ""


class YouTubeIClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/json",
            }
        )
        self.api_key = ""
        self.client_version = ""

    def bootstrap(self) -> None:
        last_error = None
        for delay in (1.0, 2.0, 4.0):
            try:
                html = self.session.get("https://www.youtube.com/results?search_query=mexico", timeout=15).text
                self.api_key = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html).group(1)
                self.client_version = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html).group(1)
                return
            except Exception as exc:
                last_error = exc
                time.sleep(delay)
        assert last_error is not None
        raise last_error

    def context(self) -> dict[str, Any]:
        return {"client": {"clientName": "WEB", "clientVersion": self.client_version}}

    def post(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"https://www.youtube.com/youtubei/v1/{endpoint}?key={self.api_key}"
        last_error = None
        for delay in (0.5, 1.0, 2.0):
            try:
                response = self.session.post(url, json=payload, timeout=12)
                response.raise_for_status()
                return response.json()
            except Exception as exc:
                last_error = exc
                time.sleep(delay)
        assert last_error is not None
        raise last_error

    def search_page(self, query: str) -> dict[str, Any]:
        return self.post(
            "search",
            {"context": self.context(), "query": query, "params": SEARCH_PARAMS_CHANNELS},
        )

    def continuation_page(self, token: str) -> dict[str, Any]:
        return self.post("search", {"context": self.context(), "continuation": token})

    def about_details(self, profile_url: str) -> dict[str, str]:
        url = profile_url.rstrip("/") + "/about"
        try:
            html = self.session.get(url, timeout=12).text
        except Exception:
            return {
                "email": "",
                "location": "",
                "description": "",
                "website_url": "",
                "instagram_url": "",
                "facebook_url": "",
                "tiktok_url": "",
                "twitter_url": "",
                "other_urls": "",
                "all_external_urls": "",
            }
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        json_text = ""
        match = re.search(r"var ytInitialData = (.*?);</script>", html)
        if match:
            json_text = match.group(1)
        combined = f"{text}\n{json_text}"
        description = ""
        match = re.search(r'"description"\s*:\s*"([^"]{20,1200})"', json_text)
        if match:
            description = match.group(1).encode("utf-8", "ignore").decode("unicode_escape", "ignore")
        urls = classify_urls(extract_urls(combined))
        return {
            "email": first_email(combined),
            "location": "",
            "description": description[:1000] or text[:1000],
            **urls,
        }


def renderer_to_item(renderer: dict[str, Any], query: str) -> dict[str, Any]:
    endpoint = renderer.get("navigationEndpoint", {})
    browse = endpoint.get("browseEndpoint", {})
    meta = endpoint.get("commandMetadata", {}).get("webCommandMetadata", {})
    path = meta.get("url") or browse.get("canonicalBaseUrl") or ""
    profile_url = urljoin("https://www.youtube.com", path)
    sub_text = text_from_runs(renderer.get("videoCountText"))
    if not sub_text:
        sub_text = renderer.get("videoCountText", {}).get("accessibility", {}).get("accessibilityData", {}).get("label", "")
    return {
        "name": text_from_runs(renderer.get("title")),
        "handle": path.rstrip("/").split("/")[-1] if path else text_from_runs(renderer.get("subscriberCountText")),
        "channel_id": renderer.get("channelId") or browse.get("browseId", ""),
        "subscriber_count": parse_subscribers(sub_text),
        "profile_url": profile_url,
        "description": text_from_runs(renderer.get("descriptionSnippet")),
        "source_query": query,
        "source_url": "youtubei://search",
    }


def write_outputs(rows: list[Lead], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame([asdict(row) for row in rows])
    if not df.empty:
        df = df.rename(
            columns={
                "platform": "平台",
                "country": "国家/地区",
                "name": "名称",
                "handle": "账号",
                "channel_id": "频道ID",
                "subscriber_count": "订阅数",
                "profile_url": "频道链接",
                "email": "邮箱",
                "website_url": "官网链接",
                "instagram_url": "Instagram链接",
                "facebook_url": "Facebook链接",
                "tiktok_url": "TikTok链接",
                "twitter_url": "X/Twitter链接",
                "other_urls": "其他链接",
                "all_external_urls": "全部外链",
                "location": "所在地/地址",
                "description": "简介",
                "source_query": "来源关键词",
                "source_url": "来源链接",
                "about_url": "简介页链接",
                "mexico_evidence": "墨西哥判断依据",
                "scraped_at": "采集时间",
            }
        )
    df.to_csv(out_dir / "youtube_mexico_50k_500k_youtubei.csv", index=False, encoding="utf-8-sig")
    df.to_excel(out_dir / "youtube_mexico_50k_500k_youtubei.xlsx", index=False)
    clean_output_files(out_dir)


def load_existing(out_dir: Path) -> list[Lead]:
    path = out_dir / "youtube_mexico_50k_500k_youtubei.csv"
    if not path.exists():
        return []
    df = pd.read_csv(path)
    df = df.rename(
        columns={
            "平台": "platform",
            "国家/地区": "country",
            "名称": "name",
            "账号": "handle",
            "频道ID": "channel_id",
            "订阅数": "subscriber_count",
            "频道链接": "profile_url",
            "邮箱": "email",
            "官网链接": "website_url",
            "Instagram链接": "instagram_url",
            "Facebook链接": "facebook_url",
            "TikTok链接": "tiktok_url",
            "X/Twitter链接": "twitter_url",
            "其他链接": "other_urls",
            "全部外链": "all_external_urls",
            "所在地/地址": "location",
            "简介": "description",
            "来源关键词": "source_query",
            "来源链接": "source_url",
            "简介页链接": "about_url",
            "墨西哥判断依据": "mexico_evidence",
            "采集时间": "scraped_at",
        }
    )
    rows = []
    for raw in df.to_dict("records"):
        clean = {field: raw.get(field, "") for field in Lead.__dataclass_fields__}
        clean["subscriber_count"] = int(clean.get("subscriber_count") or 0)
        for key, value in list(clean.items()):
            if pd.isna(value):
                clean[key] = "" if key != "subscriber_count" else 0
        rows.append(Lead(**clean))
    return rows


def clean_output_files(out_dir: Path) -> None:
    for name in ["youtube_mexico_50k_500k_youtubei.csv", "youtube_mexico_50k_500k_youtubei.xlsx"]:
        path = out_dir / name
        if not path.exists():
            continue
        df = pd.read_csv(path) if path.suffix == ".csv" else pd.read_excel(path)
        for col in ["官网链接", "Instagram链接", "Facebook链接", "TikTok链接", "X/Twitter链接", "其他链接", "全部外链"]:
            if col not in df.columns:
                continue
            df[col] = df[col].map(
                lambda value: _clean_external_value(value)
            )
        if path.suffix == ".csv":
            df.to_csv(path, index=False, encoding="utf-8-sig")
        else:
            df.to_excel(path, index=False)


def _clean_external_value(value: Any) -> str:
    if pd.isna(value) or not str(value).strip():
        return ""
    bad = (
        "gstatic.com",
        "google.com",
        "google.cn",
        "googleapis.com",
        "googleusercontent.com",
        "ytimg.com",
        "ggpht.com",
        "schema.org",
        "w3.org",
        "youtube.com",
        "youtu.be",
        "googlevideo.com",
    )
    parts = [part.strip() for part in str(value).split("|")]
    parts = [part for part in parts if part and not any(term in part.lower() for term in bad)]
    return " | ".join(dict.fromkeys(parts))


def completed_path(out_dir: Path) -> Path:
    return out_dir / "completed_youtubei_queries.txt"


def load_completed(out_dir: Path) -> set[str]:
    path = completed_path(out_dir)
    if not path.exists():
        return set()
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def mark_completed(out_dir: Path, query: str) -> None:
    done = load_completed(out_dir)
    if query in done:
        return
    with completed_path(out_dir).open("a", encoding="utf-8") as handle:
        handle.write(query + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--min-subscribers", type=int, default=50_000)
    parser.add_argument("--max-subscribers", type=int, default=500_000)
    parser.add_argument("--target-rows", type=int, default=1000)
    parser.add_argument("--max-pages-per-query", type=int, default=8)
    parser.add_argument("--query-limit", type=int, default=0)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--skip-about", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.15)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = load_existing(out_dir) if args.resume else []
    seen = {row.channel_id or row.profile_url for row in rows}
    completed = load_completed(out_dir) if args.resume else set()
    queries = build_queries()
    if args.query_limit:
        queries = queries[: args.query_limit]
    scraped_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    client = YouTubeIClient()
    client.bootstrap()
    print(f"client_version={client.client_version} existing={len(rows)}")

    for query in queries:
        if len(rows) >= args.target_rows:
            break
        if query in completed:
            continue
        print(f"query={query} rows={len(rows)}")
        try:
            data = client.search_page(query)
        except Exception as exc:
            print(f"search failed query={query} error={exc}")
            mark_completed(out_dir, query)
            continue

        for page_index in range(args.max_pages_per_query):
            for renderer in find_channel_renderers(data):
                if len(rows) >= args.target_rows:
                    break
                item = renderer_to_item(renderer, query)
                key = item["channel_id"] or item["profile_url"]
                if not key or key in seen:
                    continue
                seen.add(key)
                if not (args.min_subscribers <= item["subscriber_count"] <= args.max_subscribers):
                    continue
                evidence = mexico_evidence(item["name"], item["handle"], item["description"], query)
                if not evidence:
                    continue
                about = {
                    "email": "",
                    "location": "",
                    "description": "",
                    "website_url": "",
                    "instagram_url": "",
                    "facebook_url": "",
                    "tiktok_url": "",
                    "twitter_url": "",
                    "other_urls": "",
                    "all_external_urls": "",
                }
                if not args.skip_about:
                    about = client.about_details(item["profile_url"])
                    evidence = mexico_evidence(
                        item["name"], item["handle"], item["description"], about.get("description", ""), query
                    )
                    if not evidence:
                        continue
                rows.append(
                    Lead(
                        platform="youtube",
                        country="mexico",
                        name=item["name"],
                        handle=item["handle"],
                        channel_id=item["channel_id"],
                        subscriber_count=item["subscriber_count"],
                        profile_url=item["profile_url"],
                        email=about.get("email", ""),
                        website_url=about.get("website_url", ""),
                        instagram_url=about.get("instagram_url", ""),
                        facebook_url=about.get("facebook_url", ""),
                        tiktok_url=about.get("tiktok_url", ""),
                        twitter_url=about.get("twitter_url", ""),
                        other_urls=about.get("other_urls", ""),
                        all_external_urls=about.get("all_external_urls", ""),
                        location=about.get("location", ""),
                        description=(about.get("description") or item["description"])[:1000],
                        source_query=query,
                        source_url=item["source_url"],
                        about_url=item["profile_url"].rstrip("/") + "/about",
                        mexico_evidence=evidence,
                        scraped_at=scraped_at,
                    )
                )
                print(f"{len(rows):04d} {item['subscriber_count']:>7} {item['name']} {about.get('email','')}")
                if len(rows) % 10 == 0:
                    write_outputs(rows, out_dir)
            if len(rows) >= args.target_rows:
                break
            token = find_continuation_token(data)
            if not token:
                break
            try:
                time.sleep(args.sleep)
                data = client.continuation_page(token)
            except Exception as exc:
                print(f"continuation failed query={query} page={page_index} error={exc}")
                break
        mark_completed(out_dir, query)
        write_outputs(rows, out_dir)
        time.sleep(args.sleep)

    write_outputs(rows, out_dir)
    print(f"rows={len(rows)} email={sum(1 for row in rows if row.email)}")
    return 0 if rows else 1


if __name__ == "__main__":
    raise SystemExit(main())
