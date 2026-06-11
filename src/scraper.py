from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from urllib.parse import urljoin

from bs4 import BeautifulSoup
import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .models import CreatorRecord
from .parser import (
    BASE_URL,
    discover_rank_pages,
    filter_by_followers,
    filter_by_subscribers,
    parse_detail_page,
    parse_facebook_wikipedia_table,
    parse_hypeauditor_instagram,
    parse_rank_table,
    parse_scrumball_instagram,
)


INSTAGRAM_MEXICO_TARGET_ROWS = 1000


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
)


class ScrapeError(RuntimeError):
    pass


@dataclass
class ScrapeMetadata:
    country: str
    selected_url: str
    selected_page_limit: int
    discovered_pages: Dict[int, str]
    total_rows: int
    filtered_rows: int
    scraped_at: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_scrape_metadata(
    *,
    country: str,
    selected_url: str,
    selected_page_limit: int,
    discovered_pages: Dict[int, str],
    total_rows: int,
    filtered_rows: int,
    scraped_at: str,
) -> ScrapeMetadata:
    return ScrapeMetadata(
        country=country,
        selected_url=selected_url,
        selected_page_limit=selected_page_limit,
        discovered_pages=discovered_pages,
        total_rows=total_rows,
        filtered_rows=filtered_rows,
        scraped_at=scraped_at,
    )


class YouTubersMeScraper:
    def __init__(self, base_url: str = BASE_URL, timeout: int = 30) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )

    def country_home_url(self, country_slug: str) -> str:
        return f"{self.base_url}/{country_slug}/all/top-youtube-channels-in-{country_slug}"

    @retry(
        retry=retry_if_exception_type(requests.RequestException),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def fetch_html(self, url: str) -> str:
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        if not response.text.strip():
            raise ScrapeError(f"Empty response from {url}")
        return response.text

    def choose_rank_page(
        self, country_slug: str, max_rank_page: int
    ) -> Tuple[str, int, Dict[int, str], str]:
        home_url = self.country_home_url(country_slug)
        home_html = self.fetch_html(home_url)
        discovered = discover_rank_pages(home_html, country_slug, self.base_url)
        candidates = [
            (limit, url)
            for limit, url in discovered.items()
            if limit <= max_rank_page
        ]
        candidates.sort(reverse=True)

        for limit, url in candidates:
            try:
                html = self.fetch_html(url)
                records = parse_rank_table(
                    html,
                    country=country_slug,
                    source_url=url,
                    source_page_limit=limit,
                    scraped_at=utc_now_iso(),
                    base_url=self.base_url,
                )
                if records:
                    return url, limit, discovered, html
            except Exception:
                continue

        records = parse_rank_table(
            home_html,
            country=country_slug,
            source_url=home_url,
            source_page_limit=0,
            scraped_at=utc_now_iso(),
            base_url=self.base_url,
        )
        if not records:
            raise ScrapeError(f"No parseable ranking table found for country '{country_slug}'")
        return home_url, 0, discovered, home_html

    def scrape_country(
        self,
        *,
        country_slug: str,
        min_subscribers: int,
        max_rank_page: int,
    ) -> Tuple[List[CreatorRecord], ScrapeMetadata]:
        scraped_at = utc_now_iso()
        selected_url, selected_limit, discovered, html = self.choose_rank_page(
            country_slug, max_rank_page
        )
        records = parse_rank_table(
            html,
            country=country_slug,
            source_url=selected_url,
            source_page_limit=selected_limit,
            scraped_at=scraped_at,
            base_url=self.base_url,
        )
        filtered = filter_by_subscribers(records, min_subscribers)
        metadata = make_scrape_metadata(
            country=country_slug,
            selected_url=selected_url,
            selected_page_limit=selected_limit,
            discovered_pages=discovered,
            total_rows=len(records),
            filtered_rows=len(filtered),
            scraped_at=scraped_at,
        )
        return filtered, metadata

    def scrape_instagram_country(
        self,
        *,
        country_slug: str,
        min_followers: int,
    ) -> Tuple[List[CreatorRecord], ScrapeMetadata]:
        scraped_at = utc_now_iso()
        if country_slug == "mexico":
            try:
                return self.scrape_instagram_mexico_combined(
                    min_followers=min_followers,
                    scraped_at=scraped_at,
                )
            except Exception:
                pass

        url = f"https://hypeauditor.com/top-instagram-all-{country_slug}/"
        html = self.fetch_html(url)
        records = parse_hypeauditor_instagram(
            html,
            country=country_slug,
            source_url=url,
            scraped_at=scraped_at,
        )
        if not records:
            raise ScrapeError(f"No parseable Instagram ranking data found for '{country_slug}'")
        filtered = filter_by_followers(records, min_followers)
        metadata = make_scrape_metadata(
            country=country_slug,
            selected_url=url,
            selected_page_limit=1000,
            discovered_pages={1000: url},
            total_rows=len(records),
            filtered_rows=len(filtered),
            scraped_at=scraped_at,
        )
        return filtered, metadata

    def scrape_instagram_mexico_combined(
        self,
        *,
        min_followers: int,
        scraped_at: str | None = None,
    ) -> Tuple[List[CreatorRecord], ScrapeMetadata]:
        scraped_at = scraped_at or utc_now_iso()
        discovered: Dict[int, str] = {}
        records: List[CreatorRecord] = []
        seen = set()

        hypeauditor_urls = self.discover_hypeauditor_instagram_mexico_urls()
        for index, url in enumerate(hypeauditor_urls, start=1):
            html = self.fetch_html(url)
            page_records = parse_hypeauditor_instagram(
                html,
                country="mexico",
                source_url=url,
                scraped_at=scraped_at,
            )
            discovered[index] = url
            self._append_unique_records(records, page_records, seen, INSTAGRAM_MEXICO_TARGET_ROWS)
            if len(records) >= INSTAGRAM_MEXICO_TARGET_ROWS:
                break

        if len(records) < INSTAGRAM_MEXICO_TARGET_ROWS:
            url = "https://www.scrumball.com/ranking/top-instagram-influencers-in-mexico"
            html = self.fetch_html(url)
            page_records = parse_scrumball_instagram(
                html,
                country="mexico",
                source_url=url,
                scraped_at=scraped_at,
            )
            discovered[len(discovered) + 1] = url
            self._append_unique_records(records, page_records, seen, INSTAGRAM_MEXICO_TARGET_ROWS)

        if not records:
            raise ScrapeError("No parseable Instagram Mexico ranking data found")

        filtered = filter_by_followers(records, min_followers)
        metadata = make_scrape_metadata(
            country="mexico",
            selected_url="hypeauditor:categories+scrumball:mexico",
            selected_page_limit=len(records),
            discovered_pages=discovered,
            total_rows=len(records),
            filtered_rows=len(filtered),
            scraped_at=scraped_at,
        )
        return filtered[:INSTAGRAM_MEXICO_TARGET_ROWS], metadata

    def discover_hypeauditor_instagram_mexico_urls(self) -> List[str]:
        base_url = "https://hypeauditor.com/top-instagram-all-mexico/"
        html = self.fetch_html(base_url)
        soup = BeautifulSoup(html, "lxml")
        urls = [base_url]
        seen = {base_url}
        for anchor in soup.find_all("a", href=True):
            href = urljoin(base_url, anchor["href"])
            if not href.startswith("https://hypeauditor.com/top-instagram-"):
                continue
            if not href.rstrip("/").endswith("-mexico"):
                continue
            if href in seen:
                continue
            seen.add(href)
            urls.append(href)
        return urls

    @staticmethod
    def _append_unique_records(
        records: List[CreatorRecord],
        candidates: List[CreatorRecord],
        seen: set[str],
        max_items: int,
    ) -> None:
        for record in candidates:
            key = (record.platform_user_id or record.handle or record.profile_url).strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            record.rank = len(records) + 1
            records.append(record)
            if len(records) >= max_items:
                return

    def scrape_instagram_scrumball_mexico(
        self,
        *,
        min_followers: int,
        scraped_at: str | None = None,
    ) -> Tuple[List[CreatorRecord], ScrapeMetadata]:
        scraped_at = scraped_at or utc_now_iso()
        url = "https://www.scrumball.com/ranking/top-instagram-influencers-in-mexico"
        html = self.fetch_html(url)
        records = parse_scrumball_instagram(
            html,
            country="mexico",
            source_url=url,
            scraped_at=scraped_at,
        )
        if not records:
            raise ScrapeError("No parseable Scrumball Instagram Mexico ranking data found")
        filtered = filter_by_followers(records, min_followers)
        metadata = make_scrape_metadata(
            country="mexico",
            selected_url=url,
            selected_page_limit=len(records),
            discovered_pages={len(records): url},
            total_rows=len(records),
            filtered_rows=len(filtered),
            scraped_at=scraped_at,
        )
        return filtered, metadata

    def scrape_facebook_global(
        self,
        *,
        min_followers: int,
    ) -> Tuple[List[CreatorRecord], ScrapeMetadata]:
        scraped_at = utc_now_iso()
        url = "https://en.wikipedia.org/wiki/List_of_most-followed_Facebook_pages"
        html = self.fetch_html(url)
        records = parse_facebook_wikipedia_table(
            html,
            source_url=url,
            scraped_at=scraped_at,
        )
        if not records:
            raise ScrapeError("No parseable Facebook ranking table found")
        filtered = filter_by_followers(records, min_followers)
        metadata = make_scrape_metadata(
            country="global",
            selected_url=url,
            selected_page_limit=len(records),
            discovered_pages={len(records): url},
            total_rows=len(records),
            filtered_rows=len(filtered),
            scraped_at=scraped_at,
        )
        return filtered, metadata

    def enrich_details(self, records: List[CreatorRecord], delay_seconds: float = 0.5) -> None:
        for index, record in enumerate(records):
            if record.platform != "youtube":
                continue
            try:
                html = self.fetch_html(record.profile_url)
                detail = parse_detail_page(html, self.base_url)
                record.description = detail.get("description", "")
                record.platform_user_id = detail.get("official_channel_id") or record.platform_user_id
            except (requests.RequestException, ScrapeError):
                continue

            if delay_seconds > 0 and index < len(records) - 1:
                time.sleep(delay_seconds)
