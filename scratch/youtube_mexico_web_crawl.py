from __future__ import annotations

import json
import re
import time
import argparse
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urljoin

import pandas as pd
from playwright.sync_api import sync_playwright


CDP_URL = "http://127.0.0.1:9222"
SYSTEM_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_DIR = Path("output_youtube_mexico_web_10k_100k")
MIN_SUBSCRIBERS = 10_000
MAX_SUBSCRIBERS = 100_000
TARGET_ROWS = 20

BASE_QUERY_PREFIXES = [
    "mexico",
    "mexican",
    "méxico",
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
    "tlaxcala",
]

BASE_QUERY_TOPICS = [
    "vlog",
    "youtuber",
    "lifestyle",
    "travel vlog",
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
    "musica",
    "educacion",
    "autos",
    "motos",
    "podcast",
    "humor",
    "finanzas",
    "marketing",
    "fotografia",
    "viajes",
    "turismo",
    "medicina",
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
    "noticias",
    "review",
    "unboxing",
    "tutorial",
    "musica regional",
    "corridos",
    "banda",
    "mariachi",
]


def build_search_queries() -> list[str]:
    queries = [
        "mexico vlog",
        "mexico youtuber",
        "mexican youtuber",
        "small youtuber mexico",
        "creador de contenido mexico",
        "influencer mexico youtube",
        "youtube channel mexico 100k subscribers",
        "canal mexicano 100 mil suscriptores",
        "canales mexicanos pequeños",
        "youtubers mexicanos 2025",
        "youtubers mexicanos 2026",
        "mexico creator business email",
    ]
    for prefix in BASE_QUERY_PREFIXES:
        for topic in BASE_QUERY_TOPICS:
            queries.append(f"{prefix} {topic}")
    seen = set()
    deduped = []
    for query in queries:
        if query in seen:
            continue
        seen.add(query)
        deduped.append(query)
    return deduped


SEARCH_QUERIES = build_search_queries()

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
class ChannelRow:
    platform: str
    country: str
    name: str
    handle: str
    channel_id: str
    subscriber_count: int
    profile_url: str
    source_query: str
    source_url: str
    about_url: str
    email: str
    location: str
    description: str
    mexico_evidence: str
    scraped_at: str


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
    match = re.search(r"(\d+(?:\.\d+)?)\s*(K|M|B)?\s*(?:subscribers|subs|suscriptores|位?订阅者)", value, re.I)
    if not match:
        return 0
    number = float(match.group(1))
    multiplier = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get((match.group(2) or "").upper(), 1)
    return int(number * multiplier)


def extract_initial_data(html: str) -> dict[str, Any]:
    match = re.search(r"var ytInitialData = (.*?);</script>", html)
    if not match:
        match = re.search(r"ytInitialData\"\]\s*=\s*(\{.*?\});", html)
    if not match:
        return {}
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}


def walk_channel_renderers(value: Any):
    if isinstance(value, dict):
        if "channelRenderer" in value:
            yield value["channelRenderer"]
        for child in value.values():
            yield from walk_channel_renderers(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_channel_renderers(child)


def first_email(text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text or "")
    return match.group(0) if match else ""


def mexico_evidence(*parts: str) -> str:
    haystack = "\n".join(part for part in parts if part).lower()
    if any(term in haystack for term in EXCLUDE_TERMS):
        return ""
    for term in MEXICO_TERMS:
        if term in haystack:
            return term
    return ""


def extract_location(text: str) -> str:
    for pattern in [
        r"(?:location|ubicación|ubicacion|country|país|pais)\s*[:：]?\s*([^\n|·]{2,80})",
        r"\b(Mexico|México|CDMX|Guadalajara|Monterrey|Jalisco|Puebla|Tijuana|Querétaro|Queretaro)\b",
    ]:
        match = re.search(pattern, text or "", re.I)
        if match:
            return re.sub(r"\s+", " ", match.group(1)).strip()
    return ""


def channel_items_from_search(html: str, source_query: str, source_url: str) -> list[dict[str, Any]]:
    data = extract_initial_data(html)
    items = []
    for renderer in walk_channel_renderers(data):
        title = text_from_runs(renderer.get("title"))
        endpoint = renderer.get("navigationEndpoint", {})
        meta = endpoint.get("commandMetadata", {}).get("webCommandMetadata", {})
        path = meta.get("url") or endpoint.get("browseEndpoint", {}).get("canonicalBaseUrl") or ""
        profile_url = urljoin("https://www.youtube.com", path)
        channel_id = renderer.get("channelId") or endpoint.get("browseEndpoint", {}).get("browseId") or ""
        handle = path.rstrip("/").split("/")[-1] if path else ""
        subscriber_text = text_from_runs(renderer.get("videoCountText"))
        if not subscriber_text:
            accessibility = renderer.get("videoCountText", {}).get("accessibility", {}).get("accessibilityData", {})
            subscriber_text = accessibility.get("label", "")
        subscriber_count = parse_subscribers(subscriber_text)
        description = text_from_runs(renderer.get("descriptionSnippet"))
        if not title or not profile_url or not subscriber_count:
            continue
        items.append(
            {
                "name": title,
                "handle": handle,
                "channel_id": channel_id,
                "subscriber_count": subscriber_count,
                "profile_url": profile_url,
                "description": description,
                "source_query": source_query,
                "source_url": source_url,
            }
        )
    return items


def extract_about_details(html: str) -> dict[str, str]:
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    data = extract_initial_data(html)
    json_text = json.dumps(data, ensure_ascii=False)
    combined = f"{text}\n{json_text}"
    description = ""
    for key in ["description", "attributedDescriptionBodyText"]:
        match = re.search(rf'"{key}"\s*:\s*"([^"]{{20,1000}})"', json_text)
        if match:
            description = match.group(1).encode("utf-8", "ignore").decode("unicode_escape", "ignore")
            break
    return {
        "email": first_email(combined),
        "location": extract_location(combined),
        "description": description[:1000] or text[:1000],
    }


def goto_with_retry(page, url: str, *, attempts: int = 3) -> bool:
    for attempt in range(1, attempts + 1):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60_000)
            return True
        except Exception as exc:
            print(f"goto failed attempt={attempt} url={url} error={exc}")
            page.wait_for_timeout(2_000 * attempt)
    return False


def write_outputs(rows: list[ChannelRow]) -> None:
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
                "source_query": "来源关键词",
                "source_url": "来源链接",
                "about_url": "简介页链接",
                "email": "邮箱",
                "location": "所在地/地址",
                "description": "简介",
                "mexico_evidence": "墨西哥判断依据",
                "scraped_at": "采集时间",
            }
        )
    csv_path = OUT_DIR / "youtube_mexico_web_10k_100k.csv"
    xlsx_path = OUT_DIR / "youtube_mexico_web_10k_100k.xlsx"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)


def completed_queries_path() -> Path:
    return OUT_DIR / "completed_queries.txt"


def load_completed_queries() -> set[str]:
    path = completed_queries_path()
    if not path.exists():
        return set()
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def mark_query_completed(query: str) -> None:
    path = completed_queries_path()
    existing = load_completed_queries()
    if query in existing:
        return
    with path.open("a", encoding="utf-8") as handle:
        handle.write(query + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl YouTube web search for Mexico channels.")
    parser.add_argument("--out-dir", default=str(OUT_DIR))
    parser.add_argument("--min-subscribers", type=int, default=MIN_SUBSCRIBERS)
    parser.add_argument("--max-subscribers", type=int, default=MAX_SUBSCRIBERS)
    parser.add_argument("--target-rows", type=int, default=TARGET_ROWS)
    parser.add_argument("--scroll-rounds", type=int, default=3)
    parser.add_argument("--about-wait-ms", type=int, default=1500)
    parser.add_argument("--query-limit", type=int, default=0)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--skip-completed-queries", action="store_true")
    return parser.parse_args()


def load_existing_rows(out_dir: Path) -> list[ChannelRow]:
    xlsx_path = out_dir / "youtube_mexico_web_10k_100k.xlsx"
    csv_path = out_dir / "youtube_mexico_web_10k_100k.csv"
    path = xlsx_path if xlsx_path.exists() else csv_path
    if not path.exists():
        return []
    df = pd.read_excel(path) if path.suffix == ".xlsx" else pd.read_csv(path)
    column_map = {
        "平台": "platform",
        "国家/地区": "country",
        "名称": "name",
        "账号": "handle",
        "频道ID": "channel_id",
        "订阅数": "subscriber_count",
        "频道链接": "profile_url",
        "来源关键词": "source_query",
        "来源链接": "source_url",
        "简介页链接": "about_url",
        "邮箱": "email",
        "所在地/地址": "location",
        "简介": "description",
        "墨西哥判断依据": "mexico_evidence",
        "采集时间": "scraped_at",
    }
    df = df.rename(columns=column_map)
    rows = []
    for row in df.to_dict("records"):
        clean = {field: row.get(field, "") for field in ChannelRow.__dataclass_fields__}
        clean["subscriber_count"] = int(clean.get("subscriber_count") or 0)
        for key, value in list(clean.items()):
            if pd.isna(value):
                clean[key] = "" if key != "subscriber_count" else 0
        rows.append(ChannelRow(**clean))
    return rows


def main() -> int:
    global OUT_DIR, MIN_SUBSCRIBERS, MAX_SUBSCRIBERS, TARGET_ROWS
    args = parse_args()
    OUT_DIR = Path(args.out_dir)
    MIN_SUBSCRIBERS = args.min_subscribers
    MAX_SUBSCRIBERS = args.max_subscribers
    TARGET_ROWS = args.target_rows

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[ChannelRow] = []
    if args.resume:
        rows = load_existing_rows(OUT_DIR)
    seen: set[str] = set()
    for row in rows:
        seen.add(row.channel_id or row.profile_url)
    scraped_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    queries = SEARCH_QUERIES[: args.query_limit] if args.query_limit else SEARCH_QUERIES
    completed_queries = load_completed_queries() if args.skip_completed_queries else set()

    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp(CDP_URL)
        except Exception:
            browser = p.chromium.launch(
                headless=True,
                executable_path=SYSTEM_CHROME if Path(SYSTEM_CHROME).exists() else None,
            )
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        page = context.new_page()

        for query in queries:
            if len(rows) >= TARGET_ROWS:
                break
            if query in completed_queries:
                continue
            print(f"query={query} rows={len(rows)}")
            source_url = "https://www.youtube.com/results?search_query=" + quote_plus(query) + "&sp=EgIQAg%253D%253D"
            if not goto_with_retry(page, source_url):
                mark_query_completed(query)
                continue
            page.wait_for_timeout(4_000)
            for _ in range(max(args.scroll_rounds, 0)):
                page.mouse.wheel(0, 4000)
                page.wait_for_timeout(1_000)

            for item in channel_items_from_search(page.content(), query, source_url):
                if len(rows) >= TARGET_ROWS:
                    break
                key = item["channel_id"] or item["profile_url"]
                if key in seen:
                    continue
                seen.add(key)
                if not (MIN_SUBSCRIBERS <= item["subscriber_count"] <= MAX_SUBSCRIBERS):
                    continue
                evidence = mexico_evidence(item["name"], item["handle"], item["description"], query)
                if not evidence:
                    continue

                about_url = item["profile_url"].rstrip("/") + "/about"
                detail_page = context.new_page()
                try:
                    if goto_with_retry(detail_page, about_url, attempts=2):
                        detail_page.wait_for_timeout(args.about_wait_ms)
                        details = extract_about_details(detail_page.content())
                    else:
                        details = {"email": "", "location": "", "description": ""}
                except Exception:
                    details = {"email": "", "location": "", "description": ""}
                finally:
                    detail_page.close()

                evidence = mexico_evidence(
                    item["name"],
                    item["handle"],
                    item["description"],
                    details.get("description", ""),
                    details.get("location", ""),
                    query,
                )
                if not evidence:
                    continue

                rows.append(
                    ChannelRow(
                        platform="youtube",
                        country="mexico",
                        name=item["name"],
                        handle=item["handle"],
                        channel_id=item["channel_id"],
                        subscriber_count=item["subscriber_count"],
                        profile_url=item["profile_url"],
                        source_query=query,
                        source_url=item["source_url"],
                        about_url=about_url,
                        email=details.get("email", ""),
                        location=details.get("location", ""),
                        description=(details.get("description") or item["description"])[:1000],
                        mexico_evidence=evidence,
                        scraped_at=scraped_at,
                    )
                )
                print(f"{len(rows):02d} {item['subscriber_count']:>7} {item['name']} {details.get('email','')}")
                write_outputs(rows)

            mark_query_completed(query)

        page.close()
        browser.close()

    write_outputs(rows)
    csv_path = OUT_DIR / "youtube_mexico_web_10k_100k.csv"
    xlsx_path = OUT_DIR / "youtube_mexico_web_10k_100k.xlsx"
    print(f"rows={len(rows)}")
    print(csv_path)
    print(xlsx_path)
    return 0 if rows else 1


if __name__ == "__main__":
    raise SystemExit(main())
