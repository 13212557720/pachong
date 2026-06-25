from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import time
from dataclasses import asdict
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.exporter import records_to_dataframe
from src.models import CreatorRecord
from src.parser import parse_compact_number
from src.scraper import utc_now_iso
from scratch.facebook_thailand_vape_cdp import THAILAND_HINTS, VAPE_HINTS, CdpPage


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def folded(value: str) -> str:
    return normalize_text(value).lower()


def has_hint(text: str, hints: list[str]) -> bool:
    text_folded = folded(text)
    return any(hint.lower() in text_folded for hint in hints)


def strip_json_prefix(text: str) -> str:
    return re.sub(r"^for\s*\(\s*;\s*;\s*\)\s*;", "", text or "").strip()


def load_queries(path: Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def load_latest_graphql_template(path: Path) -> dict[str, Any]:
    captures = json.loads(path.read_text(encoding="utf-8"))
    if not captures:
        raise RuntimeError(f"No GraphQL captures found: {path}")
    item = captures[0]
    request = item["request"]
    headers = {
        key: value
        for key, value in request.get("headers", {}).items()
        if key.lower()
        not in {
            "content-length",
            "host",
            "cookie",
            "origin",
        }
    }
    headers.setdefault("content-type", "application/x-www-form-urlencoded")
    headers.setdefault("origin", "https://www.facebook.com")
    headers.setdefault("referer", "https://www.facebook.com/search/pages/")

    form = {key: values[-1] for key, values in parse_qs(request.get("postData", "")).items()}
    variables = json.loads(form["variables"])
    return {"headers": headers, "form": form, "variables": variables}


def make_form(template: dict[str, Any], *, query: str, cursor: str | None, req_index: int) -> dict[str, str]:
    form = dict(template["form"])
    variables = json.loads(json.dumps(template["variables"]))
    variables["args"]["text"] = query
    variables["args"]["experience"]["type"] = "PAGES_TAB"
    variables["count"] = 10
    if cursor is None:
        variables.pop("cursor", None)
    else:
        variables["cursor"] = cursor
    form["variables"] = json.dumps(variables, ensure_ascii=False, separators=(",", ":"))
    form["fb_api_req_friendly_name"] = "SearchCometResultsPaginatedResultsQuery"
    form["fb_api_caller_class"] = "RelayModern"
    form["server_timestamps"] = "true"
    form["__req"] = base36(req_index)
    return form


def base36(value: int) -> str:
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    if value < 0:
        raise ValueError("value must be non-negative")
    if value == 0:
        return "0"
    out = ""
    while value:
        value, rem = divmod(value, 36)
        out = chars[rem] + out
    return out


def walk(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def text_value(value: Any) -> str:
    if isinstance(value, dict):
        return normalize_text(str(value.get("text") or ""))
    return ""


def extract_external_links(value: Any) -> list[str]:
    links: list[str] = []
    seen = set()
    for node in walk(value):
        url = node.get("external_url") or node.get("url")
        if not isinstance(url, str):
            continue
        if "l.facebook.com/l.php" in url and "u=" in url:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            url = qs.get("u", [url])[0]
        if url.startswith("http") and url not in seen:
            seen.add(url)
            links.append(url)
    return links


def parse_graphql_records(
    payload: dict[str, Any],
    *,
    query: str,
    source_url: str,
    scraped_at: str,
) -> tuple[list[CreatorRecord], str | None, bool]:
    results = (
        payload.get("data", {})
        .get("serpResponse", {})
        .get("results", {})
    )
    edges = results.get("edges") or []
    page_info = results.get("page_info") or {}
    records: list[CreatorRecord] = []

    for edge in edges:
        view_model = (
            edge.get("rendering_strategy", {})
            .get("view_model", {})
        )
        profile = view_model.get("profile") or {}
        name = normalize_text(profile.get("name") or view_model.get("profile_name_with_possible_nickname") or "")
        profile_url = normalize_text(profile.get("profile_url") or profile.get("url") or "")
        if not name or not profile_url:
            continue

        primary = text_value(view_model.get("primary_snippet_text_with_entities"))
        desc_parts = [
            text_value(item)
            for item in view_model.get("description_snippets_text_with_entities") or []
            if text_value(item)
        ]
        description = normalize_text(" ".join(desc_parts))
        raw_text = normalize_text(" ".join([name, primary, description]))
        follower_count = parse_followers_from_text(raw_text)
        category, location = parse_category_location(primary)
        email = parse_email(raw_text)
        external_links = extract_external_links(view_model)
        if external_links and not description:
            description = " ".join(external_links)
        elif external_links:
            description = normalize_text(description + " 外链: " + " ".join(external_links[:5]))

        handle = facebook_handle(profile_url)
        records.append(
            CreatorRecord(
                platform="facebook",
                country="thailand",
                rank=0,
                result_type="主页",
                name=name,
                handle=handle,
                platform_user_id=str(profile.get("id") or handle),
                follower_count=follower_count,
                subscriber_count=0,
                view_count=0,
                video_count=0,
                category=category,
                profile_url=profile_url,
                location=location,
                work_school="",
                email=email,
                source_url=source_url,
                source_name="Facebook",
                source_query=query,
                source_mode="graphql_search",
                scraped_at=scraped_at,
                description=description,
                raw_text=raw_text,
                info_score=info_score(profile_url, follower_count, location, email, description),
                is_verified=profile.get("is_verified"),
                raw_json=json.dumps(edge, ensure_ascii=False, separators=(",", ":"))[:20000],
            )
        )

    return records, page_info.get("end_cursor"), bool(page_info.get("has_next_page"))


def parse_followers_from_text(text: str) -> int:
    patterns = [
        r"(\d[\d,]*(?:\.\d+)?\s*[KMB]?)\s+followers",
        r"(\d[\d,]*(?:\.\d+)?\s*万?)\s*位粉丝",
        r"(\d[\d,]*(?:\.\d+)?\s*(?:หมื่น|แสน|ล้าน)?)\s*ผู้ติดตาม",
        r"(\d[\d,]*(?:\.\d+)?\s*(?:หมื่น|แสน|ล้าน)?)\s*คนถูกใจ",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return parse_compact_number(match.group(1))
    return 0


def parse_category_location(primary: str) -> tuple[str, str]:
    parts = [part.strip() for part in re.split(r"\s*[·•]\s*", primary or "") if part.strip()]
    category = parts[0] if parts else ""
    location_parts = [
        part
        for part in parts[1:]
        if not re.search(r"粉丝|followers?|ผู้ติดตาม|คนถูกใจ|营业|เปิด|ปิด", part, re.IGNORECASE)
    ]
    return category, " · ".join(location_parts)


def parse_email(text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text or "")
    return match.group(0) if match else ""


def facebook_handle(profile_url: str) -> str:
    parsed = urlparse(profile_url)
    if parsed.path.rstrip("/") == "/profile.php":
        return parse_qs(parsed.query).get("id", [""])[0]
    return parsed.path.strip("/").split("/")[0]


def info_score(profile_url: str, followers: int, location: str, email: str, description: str) -> int:
    return sum(bool(value) for value in [profile_url, followers, location, email, description])


def is_relevant(record: CreatorRecord, *, min_followers: int, require_thailand: bool) -> bool:
    if record.follower_count < min_followers:
        return False
    text = " ".join([record.name, record.location, record.category, record.description, record.raw_text, record.source_query])
    if not has_hint(text, VAPE_HINTS):
        return False
    if require_thailand and not has_hint(text, THAILAND_HINTS):
        return False
    return True


class FacebookGraphqlSinglePageCrawler:
    def __init__(
        self,
        *,
        cdp: str,
        template: dict[str, Any],
        delay: float,
        timeout: float,
    ) -> None:
        self.cdp = cdp.rstrip("/")
        self.template = template
        self.delay = delay
        self.timeout = timeout
        self.req_index = 10
        self.page: CdpPage | None = None

    async def setup(self) -> None:
        pages = requests.get(f"{self.cdp}/json/list", timeout=5).json()
        target = next(
            (
                page
                for page in pages
                if page.get("type") == "page" and "facebook.com" in page.get("url", "")
            ),
            None,
        )
        if target is None:
            raise RuntimeError("No open Facebook tab found in CDP browser. Open Facebook in the debug browser first.")
        self.page = CdpPage(cdp_base=self.cdp, target=target, timeout=self.timeout)
        self.page.call("Runtime.enable")

    async def fetch_page(self, *, query: str, cursor: str | None) -> tuple[list[CreatorRecord], str | None, bool]:
        if self.page is None:
            await self.setup()
        assert self.page is not None
        self.req_index += 1
        form = make_form(self.template, query=query, cursor=cursor, req_index=self.req_index)
        source_url = f"https://www.facebook.com/search/pages/?{urlencode({'q': query})}"
        response_text = await asyncio.to_thread(self._browser_fetch_with_page, self.page, form, source_url)
        await asyncio.sleep(self.delay)
        payload = json.loads(strip_json_prefix(response_text))
        if payload.get("error"):
            raise RuntimeError(f"Facebook GraphQL error {payload.get('error')}: {payload.get('errorSummary')}")
        return parse_graphql_records(
            payload,
            query=query,
            source_url=source_url,
            scraped_at=utc_now_iso(),
        )

    def _browser_fetch_with_page(self, page: CdpPage, form: dict[str, str], source_url: str) -> str:
        post_body = urlencode(form)
        script = f"""
        (async () => {{
          if (!location.href.startsWith('https://www.facebook.com/')) {{
            location.href = 'https://www.facebook.com/';
            await new Promise(resolve => setTimeout(resolve, 2000));
          }}
          const res = await fetch('/api/graphql/', {{
            method: 'POST',
            credentials: 'include',
            headers: {{
              'content-type': 'application/x-www-form-urlencoded',
              'x-fb-friendly-name': 'SearchCometResultsPaginatedResultsQuery'
            }},
            body: {json.dumps(post_body)}
          }});
          const text = await res.text();
          return JSON.stringify({{status: res.status, text}});
        }})()
        """
        raw = page.evaluate(script)
        result = json.loads(raw)
        if int(result.get("status") or 0) >= 400:
            raise RuntimeError(f"HTTP {result.get('status')}: {str(result.get('text'))[:300]}")
        return result.get("text") or ""

    def close(self) -> None:
        if self.page is not None:
            try:
                self.page.ws.close()
            except Exception:
                pass
            self.page = None


async def crawl(args: argparse.Namespace) -> int:
    queries = load_queries(Path(args.query_file))
    template = load_latest_graphql_template(Path(args.capture_file))
    crawler = FacebookGraphqlSinglePageCrawler(
        cdp=args.cdp,
        template=template,
        delay=args.delay,
        timeout=args.timeout,
    )
    out_dir = Path(args.out_dir)
    records: list[CreatorRecord] = []
    seen_urls = set()
    pages_seen = 0

    async def crawl_query(query: str) -> None:
        nonlocal pages_seen
        cursor: str | None = None
        for page_number in range(args.max_pages_per_query):
            if len(records) >= args.max_items:
                return
            try:
                page_records, next_cursor, has_next = await crawler.fetch_page(query=query, cursor=cursor)
            except Exception as exc:
                print(f"[WARN] {query} page={page_number + 1}: {exc}", flush=True)
                return
            pages_seen += 1
            added = 0
            for record in page_records:
                if record.profile_url in seen_urls:
                    continue
                if not is_relevant(
                    record,
                    min_followers=args.min_followers,
                    require_thailand=not args.no_thailand_filter,
                ):
                    continue
                seen_urls.add(record.profile_url)
                record.rank = len(records) + 1
                records.append(record)
                added += 1
                if len(records) >= args.max_items:
                    break
            print(
                f"[{query}] page={page_number + 1} parsed={len(page_records)} added={added} total={len(records)}",
                flush=True,
            )
            if records and pages_seen % args.save_every_pages == 0:
                export(records, out_dir, args.stem)
            if not has_next or not next_cursor:
                return
            cursor = next_cursor

    for query in queries:
        await crawl_query(query)
        if len(records) >= args.max_items:
            break

    if records:
        export(records[: args.max_items], out_dir, args.stem)
        print(f"Saved {min(len(records), args.max_items)} records to {out_dir}")
        crawler.close()
        return 0
    crawler.close()
    print("No records matched filters")
    return 1


def export(records: list[CreatorRecord], out_dir: Path, stem: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for index, record in enumerate(records, start=1):
        record.rank = index
    raw_path = out_dir / f"{stem}.json"
    csv_path = out_dir / f"{stem}.csv"
    xlsx_path = out_dir / f"{stem}.xlsx"
    raw_path.write_text(
        json.dumps([asdict(record) for record in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    df = records_to_dataframe(records)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Async Facebook GraphQL search crawler for Thailand vape pages.")
    parser.add_argument("--cdp", default="http://127.0.0.1:9222")
    parser.add_argument("--capture-file", default="debug_facebook/graphql_full_capture.json")
    parser.add_argument("--query-file", default="queries/facebook_thailand_vape_pages.txt")
    parser.add_argument("--out-dir", default="FINAL_facebook_thailand_vape_gt200_graphql")
    parser.add_argument("--stem", default="facebook_thailand_vape_gt200_graphql")
    parser.add_argument("--min-followers", type=int, default=200)
    parser.add_argument("--max-items", type=int, default=1000)
    parser.add_argument("--max-pages-per-query", type=int, default=25)
    parser.add_argument("--concurrency", type=int, default=1, help="Deprecated; kept at 1 to avoid opening tabs.")
    parser.add_argument("--delay", type=float, default=0.2)
    parser.add_argument("--timeout", type=float, default=25)
    parser.add_argument("--save-every-pages", type=int, default=10)
    parser.add_argument("--no-thailand-filter", action="store_true")
    return parser


if __name__ == "__main__":
    raise SystemExit(asyncio.run(crawl(build_parser().parse_args())))
