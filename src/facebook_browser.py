from __future__ import annotations

from typing import Iterable, List
from urllib.parse import quote_plus

from .browser_session import BrowserSession
from .models import CreatorRecord
from .parser import filter_by_followers, parse_facebook_search_cards
from .scraper import ScrapeError, utc_now_iso


FACEBOOK_MEXICO_LOCATIONS = [
    "mexico",
    "méxico",
    "ciudad de mexico",
    "cdmx",
    "guadalajara",
    "monterrey",
    "puebla",
    "tijuana",
    "cancun",
    "queretaro",
    "merida",
    "leon guanajuato",
    "toluca",
    "veracruz",
    "oaxaca",
    "yucatan",
    "jalisco",
    "nuevo leon",
]

FACEBOOK_PAGE_TERMS = [
    "creator",
    "content creator",
    "digital creator",
    "influencer",
    "blogger",
    "youtuber",
    "streamer",
    "gamer",
    "media",
    "news",
    "noticias",
    "revista",
    "radio",
    "tv",
    "television",
    "musica",
    "music",
    "cantante",
    "comediante",
    "comedy",
    "actor",
    "actriz",
    "artist",
    "artista",
    "food blogger",
    "recetas",
    "cocina",
    "travel blogger",
    "viajes",
    "fashion blogger",
    "moda",
    "beauty blogger",
    "maquillaje",
    "fitness",
    "deportes",
    "futbol",
    "photographer",
    "fotografo",
]


def build_default_facebook_mexico_queries() -> List[str]:
    queries: List[str] = []
    for location in FACEBOOK_MEXICO_LOCATIONS:
        for term in FACEBOOK_PAGE_TERMS:
            queries.append(f"{location} {term}")
    seen = set()
    deduped: List[str] = []
    for query in queries:
        if query in seen:
            continue
        seen.add(query)
        deduped.append(query)
    return deduped


DEFAULT_FACEBOOK_MEXICO_QUERIES = build_default_facebook_mexico_queries()


class FacebookBrowserScraper:
    def __init__(self, *, cdp_url: str, timeout_ms: int = 30_000) -> None:
        self.cdp_url = cdp_url
        self.timeout_ms = timeout_ms

    def scrape_pages(
        self,
        *,
        country_slug: str,
        min_followers: int,
        max_items: int,
        queries: Iterable[str] | None = None,
        scroll_rounds: int = 8,
    ) -> List[CreatorRecord]:
        scraped_at = utc_now_iso()
        search_queries = list(queries or DEFAULT_FACEBOOK_MEXICO_QUERIES)
        records: List[CreatorRecord] = []
        seen_urls = set()

        with BrowserSession(self.cdp_url, timeout_ms=self.timeout_ms) as browser:
            for query in search_queries:
                if len(records) >= max_items:
                    break
                url = f"https://www.facebook.com/search/pages/?q={quote_plus(query)}"
                page = browser.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded")
                    page.wait_for_timeout(2_000)
                    self._scroll_results(page, scroll_rounds=scroll_rounds)
                    html = page.content()
                finally:
                    page.close()

                parsed = parse_facebook_search_cards(
                    html,
                    country=country_slug,
                    source_url=url,
                    scraped_at=scraped_at,
                )
                for record in parsed:
                    if record.profile_url in seen_urls:
                        continue
                    seen_urls.add(record.profile_url)
                    record.rank = len(records) + 1
                    records.append(record)
                    if len(records) >= max_items:
                        break

        filtered = filter_by_followers(records, min_followers)
        if not filtered and not records:
            raise ScrapeError("No Facebook browser-search records found")
        return filtered or records

    @staticmethod
    def _scroll_results(page, *, scroll_rounds: int) -> None:
        stable_rounds = 0
        last_height = 0
        for _ in range(scroll_rounds):
            page.mouse.wheel(0, 5000)
            page.wait_for_timeout(1_000)
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
