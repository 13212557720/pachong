from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List
from urllib.parse import urlencode

import requests

from .browser_session import BrowserSession
from .models import CreatorRecord
from .parser import (
    filter_by_followers,
    filter_instagram_mexico_records,
    parse_instagram_following_payload,
    parse_instagram_graphql_profile,
    parse_instagram_wbloks_ip_location,
)
from .scraper import ScrapeError, USER_AGENT, utc_now_iso


@dataclass
class InstagramRequestTemplates:
    following_headers: Dict[str, str]
    graphql_headers: Dict[str, str]
    graphql_body: Dict[str, Any]
    wbloks_headers: Dict[str, str]
    wbloks_body: Dict[str, Any]
    wbloks_bkv: str = ""


class InstagramBrowserScraper:
    def __init__(
        self,
        *,
        cdp_url: str,
        public_scraper,
        timeout_ms: int = 30_000,
        request_delay: float = 0.5,
    ) -> None:
        self.cdp_url = cdp_url
        self.public_scraper = public_scraper
        self.timeout_ms = timeout_ms
        self.request_delay = request_delay
        self.http = requests.Session()
        self.http.headers.update({"User-Agent": USER_AGENT, "Accept": "*/*"})

    def scrape_instagram(
        self,
        *,
        country_slug: str,
        min_followers: int,
        seed_handles: Iterable[str],
        max_items: int,
        following_pages_per_seed: int = 10,
    ) -> List[CreatorRecord]:
        scraped_at = utc_now_iso()
        handles = normalize_handles(seed_handles)
        public_records: List[CreatorRecord] = []
        if not handles:
            public_records, _ = self.public_scraper.scrape_instagram_country(
                country_slug=country_slug,
                min_followers=0,
            )
            handles = [record.handle for record in public_records if record.handle]

        handles = handles[:max_items]
        if not handles:
            raise ScrapeError("No Instagram seed handles available")

        with BrowserSession(self.cdp_url, timeout_ms=self.timeout_ms) as browser:
            templates = self.capture_templates(browser, handles[0])
            records = self.collect_following_records(
                handles,
                templates=templates,
                country_slug=country_slug,
                scraped_at=scraped_at,
                max_items=max_items,
                pages_per_seed=following_pages_per_seed,
            )
            if len(records) < max_items:
                records = _merge_records(
                    records,
                    self.enrich_handles(
                        handles,
                        templates=templates,
                        country_slug=country_slug,
                        scraped_at=scraped_at,
                        max_items=max_items - len(records),
                    ),
                    max_items=max_items,
                )
            records = self.enrich_missing_metrics(
                records,
                templates=templates,
                country_slug=country_slug,
                scraped_at=scraped_at,
                max_items=max_items,
            )

        if records:
            filtered = filter_by_followers(records, min_followers)
            if country_slug == "mexico":
                mexico_records = filter_instagram_mexico_records(filtered, min_followers)
                if len(mexico_records) >= max_items:
                    return mexico_records[:max_items]
                return _merge_records(mexico_records, filtered, max_items=max_items)
            return filtered[:max_items]

        return filter_by_followers(public_records, min_followers)

    def collect_following_records(
        self,
        handles: Iterable[str],
        *,
        templates: InstagramRequestTemplates,
        country_slug: str,
        scraped_at: str,
        max_items: int,
        pages_per_seed: int,
    ) -> List[CreatorRecord]:
        records: List[CreatorRecord] = []
        seen = set()
        for handle in handles:
            if len(records) >= max_items:
                break
            profile_id = self._resolve_profile_id(
                f"https://www.instagram.com/{handle}/",
                templates.following_headers,
            )
            if not profile_id:
                continue

            for record in self._fetch_following_pages(
                profile_id,
                handle,
                templates=templates,
                country_slug=country_slug,
                scraped_at=scraped_at,
                max_items=max_items - len(records),
                max_pages=pages_per_seed,
            ):
                key = _record_key(record)
                if not key or key in seen:
                    continue
                seen.add(key)
                record.rank = len(records) + 1
                records.append(record)
                if len(records) >= max_items:
                    break
            if self.request_delay:
                time.sleep(self.request_delay)
        return records

    def _fetch_following_pages(
        self,
        profile_id: str,
        handle: str,
        *,
        templates: InstagramRequestTemplates,
        country_slug: str,
        scraped_at: str,
        max_items: int,
        max_pages: int,
    ) -> List[CreatorRecord]:
        records: List[CreatorRecord] = []
        next_max_id = ""
        headers = {
            **templates.following_headers,
            "Referer": f"https://www.instagram.com/{handle}/",
        }

        for _ in range(max_pages):
            params = {"count": "100"}
            if next_max_id:
                params["max_id"] = next_max_id
            url = (
                f"https://www.instagram.com/api/v1/friendships/{profile_id}/following/"
                f"?{urlencode(params)}"
            )
            response = self.http.get(url, headers=_drop_content_length(headers), timeout=30)
            if response.status_code >= 400:
                break
            try:
                payload = response.json()
            except ValueError:
                break

            page_records = parse_instagram_following_payload(
                payload,
                country=country_slug,
                source_url=url,
                scraped_at=scraped_at,
            )
            records.extend(page_records)
            if len(records) >= max_items:
                return records[:max_items]

            next_max_id = str(payload.get("next_max_id") or "").strip()
            if not next_max_id:
                break
            if self.request_delay:
                time.sleep(self.request_delay)
        return records[:max_items]

    def enrich_missing_metrics(
        self,
        records: Iterable[CreatorRecord],
        *,
        templates: InstagramRequestTemplates,
        country_slug: str,
        scraped_at: str,
        max_items: int,
    ) -> List[CreatorRecord]:
        enriched: List[CreatorRecord] = []
        for record in list(records)[:max_items]:
            if record.follower_count > 0 and record.platform_user_id:
                enriched.append(record)
                continue
            handle = record.handle.strip()
            if not handle:
                enriched.append(record)
                continue
            replacement = self._profile_record_from_handle(
                handle,
                templates=templates,
                country_slug=country_slug,
                scraped_at=scraped_at,
                rank=record.rank,
            )
            enriched.append(replacement or record)
            if self.request_delay:
                time.sleep(self.request_delay)
        return enriched

    def capture_templates(self, browser: BrowserSession, target_handle: str) -> InstagramRequestTemplates:
        page = browser.new_page()
        captured_following_headers: Dict[str, str] | None = None
        graphql_headers: Dict[str, str] | None = None
        graphql_body: Dict[str, Any] | None = None
        wbloks_headers: Dict[str, str] | None = None
        wbloks_body: Dict[str, Any] | None = None
        wbloks_bkv = ""

        def on_request(request) -> None:
            nonlocal captured_following_headers, graphql_headers, graphql_body
            nonlocal wbloks_headers, wbloks_body, wbloks_bkv
            url = request.url
            if "/api/v1/friendships/" in url and "/following/" in url and captured_following_headers is None:
                headers = _clean_headers(request.all_headers())
                if headers.get("x-ig-app-id") or headers.get("cookie"):
                    captured_following_headers = headers

            if request.method != "POST":
                return
            post_data = request.post_data or ""
            if "/graphql/query" in url and "PolarisProfilePageContentQuery" in post_data:
                graphql_headers = _clean_headers(request.all_headers())
                graphql_body = _parse_form_body(_replace_target_user_id(post_data))
            if "/async/wbloks/fetch/" in url and "about_this_account" in url:
                wbloks_headers = _clean_headers(request.all_headers())
                wbloks_body = _parse_form_body(_replace_target_user_id(post_data))
                match = re.search(r"[?&]__bkv=([^&]+)", url)
                wbloks_bkv = match.group(1) if match else ""

        page.on("request", on_request)
        try:
            page.goto(f"https://www.instagram.com/{target_handle}/", wait_until="domcontentloaded")
            self._try_click_following(page)
            self._wait_for(lambda: captured_following_headers is not None, seconds=5)
            page.keyboard.press("Escape")
            self._try_open_about_this_account(page)
            self._wait_for(lambda: graphql_body is not None or wbloks_body is not None, seconds=8)
        finally:
            page.remove_listener("request", on_request)
            page.close()

        if not captured_following_headers:
            raise ScrapeError("Failed to capture Instagram following request headers")

        return InstagramRequestTemplates(
            following_headers=captured_following_headers,
            graphql_headers=graphql_headers or captured_following_headers,
            graphql_body=graphql_body or {},
            wbloks_headers=wbloks_headers or captured_following_headers,
            wbloks_body=wbloks_body or {},
            wbloks_bkv=wbloks_bkv,
        )

    def enrich_handles(
        self,
        handles: Iterable[str],
        *,
        templates: InstagramRequestTemplates,
        country_slug: str,
        scraped_at: str,
        max_items: int,
    ) -> List[CreatorRecord]:
        records: List[CreatorRecord] = []
        for handle in list(handles)[:max_items]:
            record = self._profile_record_from_handle(
                handle,
                templates=templates,
                country_slug=country_slug,
                scraped_at=scraped_at,
                rank=len(records) + 1,
            )
            if record is not None:
                records.append(record)
            if self.request_delay:
                time.sleep(self.request_delay)
        return records

    def _profile_record_from_handle(
        self,
        handle: str,
        *,
        templates: InstagramRequestTemplates,
        country_slug: str,
        scraped_at: str,
        rank: int,
    ) -> CreatorRecord | None:
        profile_url = f"https://www.instagram.com/{handle}/"
        profile_id = self._resolve_profile_id(profile_url, templates.following_headers)
        profile_data: Dict[str, Any] = {}
        ip_location = ""
        if profile_id:
            profile_data = self._fetch_graphql_profile(profile_id, handle, templates)
            ip_location = self._fetch_ip_location(profile_id, handle, templates)

        return CreatorRecord(
            platform="instagram",
            country=country_slug,
            rank=rank,
            name=profile_data.get("name") or handle,
            handle=profile_data.get("handle") or handle,
            platform_user_id=profile_data.get("platform_user_id") or profile_id,
            follower_count=int(profile_data.get("follower_count") or 0),
            subscriber_count=0,
            view_count=0,
            video_count=0,
            category="",
            profile_url=profile_url,
            source_url=profile_url,
            source_name="Instagram",
            source_mode="browser_profile",
            scraped_at=scraped_at,
            description=profile_data.get("description") or "",
            ip_location=ip_location,
            is_verified=profile_data.get("is_verified"),
            is_private=profile_data.get("is_private"),
            raw_json=json.dumps(profile_data, ensure_ascii=False, sort_keys=True),
        )

    def _resolve_profile_id(self, profile_url: str, headers: Dict[str, str]) -> str:
        response = self.http.get(profile_url, headers=headers, timeout=30)
        if response.status_code >= 400:
            return ""
        for pattern in [
            r'"profile_id"\s*:\s*"(\d+)"',
            r'"user_id"\s*:\s*"(\d+)"',
            r'"id"\s*:\s*"(\d+)"',
        ]:
            match = re.search(pattern, response.text)
            if match:
                return match.group(1)
        return ""

    def _fetch_graphql_profile(
        self, profile_id: str, handle: str, templates: InstagramRequestTemplates
    ) -> Dict[str, Any]:
        if not templates.graphql_body:
            return {}
        body = _build_form_body(templates.graphql_body, profile_id)
        headers = {**templates.graphql_headers, "Referer": f"https://www.instagram.com/{handle}/"}
        response = self.http.post(
            "https://www.instagram.com/graphql/query",
            headers=_drop_content_length(headers),
            data=body,
            timeout=30,
        )
        if response.status_code >= 400:
            return {}
        return parse_instagram_graphql_profile(response.json())

    def _fetch_ip_location(
        self, profile_id: str, handle: str, templates: InstagramRequestTemplates
    ) -> str:
        if not templates.wbloks_body:
            return ""
        bkv = templates.wbloks_bkv or ""
        url = "https://www.instagram.com/async/wbloks/fetch/?appid=com.bloks.www.ig.about_this_account&type=app"
        if bkv:
            url += f"&__bkv={bkv}"
        body = _build_form_body(templates.wbloks_body, profile_id)
        headers = {**templates.wbloks_headers, "Referer": f"https://www.instagram.com/{handle}/"}
        response = self.http.post(url, headers=_drop_content_length(headers), data=body, timeout=30)
        if response.status_code >= 400:
            return ""
        return parse_instagram_wbloks_ip_location(response.text)

    def _try_click_following(self, page) -> None:
        selectors = [
            'a[href$="/following/"]',
            'a[href="#"][role="link"]',
            'text=/following|关注|正在关注/i',
        ]
        for selector in selectors:
            try:
                locator = page.locator(selector).first
                if locator.count() > 0:
                    locator.click(timeout=3_000)
                    return
            except Exception:
                continue

    def _try_open_about_this_account(self, page) -> None:
        try:
            page.locator('svg[aria-label="Options"], svg[aria-label="更多选项"]').first.click(timeout=5_000)
            buttons = page.locator('div[role="dialog"] button')
            for idx in range(min(buttons.count(), 8)):
                text = buttons.nth(idx).inner_text(timeout=1_000)
                if "about" in text.lower() or "关于" in text:
                    buttons.nth(idx).click(timeout=2_000)
                    return
        except Exception:
            return

    @staticmethod
    def _wait_for(predicate, *, seconds: int) -> None:
        deadline = time.time() + seconds
        while time.time() < deadline:
            if predicate():
                return
            time.sleep(0.5)


def normalize_handles(handles: Iterable[str]) -> List[str]:
    normalized: List[str] = []
    seen = set()
    for handle in handles:
        value = str(handle or "").strip().lstrip("@").strip("/")
        if not value or value in seen:
            continue
        seen.add(value)
        normalized.append(value)
    return normalized


def _clean_headers(headers: Dict[str, str]) -> Dict[str, str]:
    return {k.lower(): str(v) for k, v in headers.items() if not k.startswith(":")}


def _parse_form_body(body: str) -> Dict[str, Any]:
    from urllib.parse import parse_qsl

    parsed: Dict[str, Any] = {}
    for key, value in parse_qsl(body, keep_blank_values=True):
        try:
            parsed[key] = json.loads(value) if value[:1] in "[{" else value
        except json.JSONDecodeError:
            parsed[key] = value
    return parsed


def _replace_target_user_id(body: str) -> str:
    body = re.sub(r"%22id%22%3A%22\d+%22", "%22id%22%3A%22{{TARGET_USER_ID}}%22", body)
    return re.sub(
        r"%22target_user_id%22%3A%22\d+%22",
        "%22target_user_id%22%3A%22{{TARGET_USER_ID}}%22",
        body,
    )


def _build_form_body(body_obj: Dict[str, Any], target_user_id: str) -> str:
    params: Dict[str, str] = {}
    for key, value in body_obj.items():
        if isinstance(value, (dict, list)):
            raw = json.dumps(value, ensure_ascii=False)
        else:
            raw = str(value)
        params[key] = raw.replace("{{TARGET_USER_ID}}", target_user_id)
    return urlencode(params)


def _drop_content_length(headers: Dict[str, str]) -> Dict[str, str]:
    return {key: value for key, value in headers.items() if key.lower() != "content-length"}


def _record_key(record: CreatorRecord) -> str:
    return record.platform_user_id or record.handle or record.profile_url


def _merge_records(
    primary: Iterable[CreatorRecord],
    secondary: Iterable[CreatorRecord],
    *,
    max_items: int,
) -> List[CreatorRecord]:
    merged: List[CreatorRecord] = []
    seen = set()
    for record in list(primary) + list(secondary):
        key = _record_key(record)
        if not key or key in seen:
            continue
        seen.add(key)
        record.rank = len(merged) + 1
        merged.append(record)
        if len(merged) >= max_items:
            break
    return merged
