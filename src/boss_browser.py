from __future__ import annotations

import random
from typing import List

from .boss_parser import (
    BOSS_RECOMMEND_URL,
    BossCandidateRecord,
    enrich_boss_candidate,
    parse_boss_candidate_cards,
    parse_boss_detail_text,
)
from .browser_session import BrowserSession
from .scraper import ScrapeError, utc_now_iso


RISK_TEXT_MARKERS = [
    "请先登录",
    "登录后继续",
    "安全验证",
    "验证码",
    "访问过于频繁",
    "账号异常",
    "无权查看",
    "请完成验证",
]


class BossBrowserScraper:
    def __init__(self, *, cdp_url: str, timeout_ms: int = 30_000) -> None:
        self.cdp_url = cdp_url
        self.timeout_ms = timeout_ms

    def scrape_recommend(
        self,
        *,
        max_items: int = 50,
        scroll_rounds: int = 6,
        include_unmatched: bool = False,
        delay_min_seconds: float = 2.0,
        delay_max_seconds: float = 4.0,
        source_url: str = BOSS_RECOMMEND_URL,
    ) -> List[BossCandidateRecord]:
        if max_items < 1:
            raise ScrapeError("max_items must be >= 1")
        if scroll_rounds < 1:
            raise ScrapeError("scroll_rounds must be >= 1")
        if delay_min_seconds < 0 or delay_max_seconds < delay_min_seconds:
            raise ScrapeError("delay range is invalid")

        scraped_at = utc_now_iso()
        with BrowserSession(self.cdp_url, timeout_ms=self.timeout_ms) as browser:
            page = browser.new_page()
            try:
                page.goto(source_url, wait_until="domcontentloaded")
                page.wait_for_timeout(2_000)
                self._ensure_safe_page(page)
                self._scroll_results(page, scroll_rounds=scroll_rounds)
                self._ensure_safe_page(page)
                candidates = parse_boss_candidate_cards(
                    page.content(),
                    source_url=page.url,
                    scraped_at=scraped_at,
                )
            finally:
                page.close()

            if not candidates:
                raise ScrapeError("No BOSS candidate cards found on the recommend page")

            records: List[BossCandidateRecord] = []
            for candidate in candidates:
                if len(records) >= max_items:
                    break

                detail_text = candidate.raw_card_text
                if candidate.detail_url:
                    detail_text = self._load_detail_text(
                        browser,
                        candidate.detail_url,
                        delay_min_seconds=delay_min_seconds,
                        delay_max_seconds=delay_max_seconds,
                    )

                enriched = enrich_boss_candidate(candidate, detail_text)
                if include_unmatched or enriched.matched_keywords:
                    records.append(enriched)

        if not records:
            raise ScrapeError("No BOSS candidates matched the configured keywords")
        return records

    def _load_detail_text(
        self,
        browser: BrowserSession,
        detail_url: str,
        *,
        delay_min_seconds: float,
        delay_max_seconds: float,
    ) -> str:
        page = browser.new_page()
        try:
            page.goto(detail_url, wait_until="domcontentloaded")
            delay_ms = int(random.uniform(delay_min_seconds, delay_max_seconds) * 1000)
            page.wait_for_timeout(delay_ms)
            self._ensure_safe_page(page)
            return parse_boss_detail_text(page.content())
        finally:
            page.close()

    @staticmethod
    def _scroll_results(page, *, scroll_rounds: int) -> None:
        stable_rounds = 0
        last_height = 0
        for _ in range(scroll_rounds):
            page.mouse.wheel(0, 5000)
            page.wait_for_timeout(1_200)
            try:
                height = int(page.evaluate("document.body.scrollHeight"))
            except Exception:
                height = 0
            if height and height == last_height:
                stable_rounds += 1
            else:
                stable_rounds = 0
            last_height = height
            if stable_rounds >= 2:
                break

    @staticmethod
    def _ensure_safe_page(page) -> None:
        text = ""
        try:
            text = page.locator("body").inner_text(timeout=5_000)
        except Exception:
            try:
                text = page.content()
            except Exception:
                text = ""

        for marker in RISK_TEXT_MARKERS:
            if marker in text:
                raise ScrapeError(
                    f"BOSS page stopped at '{marker}'. Please resolve it manually, then rerun."
                )
