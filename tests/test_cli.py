from pathlib import Path
from argparse import Namespace

import pytest

from src.main import (
    build_parser,
    load_facebook_page_queries,
    load_facebook_people_queries,
    load_instagram_seed_handles,
    scrape_platform,
)
from src.models import CreatorRecord
from src.scraper import ScrapeError


def make_record(platform: str) -> CreatorRecord:
    return CreatorRecord(
        platform=platform,
        country="mexico" if platform != "facebook" else "global",
        rank=1,
        name="Creator",
        handle="creator",
        follower_count=300_000,
        subscriber_count=300_000 if platform == "youtube" else 0,
        view_count=0,
        video_count=0,
        category="",
        profile_url="https://example.test/creator",
        source_url="https://example.test/source",
        source_name="Example",
        scraped_at="2026-06-10T00:00:00+00:00",
    )


def test_build_parser_accepts_browser_mode_options() -> None:
    args = build_parser().parse_args(
        [
            "--platform",
            "instagram",
            "--use-login-browser",
            "--browser-cdp",
            "http://127.0.0.1:9222",
            "--instagram-mode",
            "browser-first",
            "--facebook-mode",
            "browser-search",
            "--facebook-result-scope",
            "people",
            "--max-browser-items",
            "25",
        ]
    )

    assert args.use_login_browser is True
    assert args.browser_cdp == "http://127.0.0.1:9222"
    assert args.instagram_mode == "browser-first"
    assert args.facebook_mode == "browser-search"
    assert args.facebook_result_scope == "people"
    assert args.max_browser_items == 25
    assert args.facebook_min_followers == 0


def test_load_instagram_seed_handles_from_args_and_file(tmp_path: Path) -> None:
    seed_file = tmp_path / "seeds.txt"
    seed_file.write_text("third\n@fourth\n\n", encoding="utf-8")
    args = Namespace(instagram_seed_handles="@first, second", instagram_seed_file=str(seed_file))

    assert load_instagram_seed_handles(args) == ["first", "second", "third", "fourth"]


def test_load_facebook_people_and_page_queries(tmp_path: Path) -> None:
    people_file = tmp_path / "people.txt"
    page_file = tmp_path / "pages.txt"
    people_file.write_text("🇲🇽\n# comment\nMexico USA\n", encoding="utf-8")
    page_file.write_text("mexico creator\nmexico media\n", encoding="utf-8")
    args = Namespace(
        facebook_people_query_file=str(people_file),
        facebook_page_query_file=str(page_file),
        facebook_query_file=None,
    )

    assert load_facebook_people_queries(args) == ["🇲🇽", "Mexico USA"]
    assert load_facebook_page_queries(args) == ["mexico creator", "mexico media"]


def test_instagram_browser_first_falls_back_to_public(monkeypatch) -> None:
    class FakeBrowserScraper:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def scrape_instagram(self, *args, **kwargs):
            raise ScrapeError("browser unavailable")

    class FakePublicScraper:
        def scrape_instagram_country(self, **kwargs):
            return [make_record("instagram")], None

    monkeypatch.setattr("src.main.InstagramBrowserScraper", FakeBrowserScraper)
    args = Namespace(
        use_login_browser=True,
        browser_cdp="http://127.0.0.1:9222",
        instagram_mode="browser-first",
        instagram_min_followers=200_000,
        max_browser_items=10,
        instagram_seed_handles="",
        instagram_seed_file=None,
    )

    records, _ = scrape_platform(FakePublicScraper(), "instagram", args, "mexico")

    assert [record.platform for record in records] == ["instagram"]


def test_instagram_browser_only_raises_when_browser_fails(monkeypatch) -> None:
    class FakeBrowserScraper:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def scrape_instagram(self, *args, **kwargs):
            raise ScrapeError("browser unavailable")

    class FakePublicScraper:
        pass

    monkeypatch.setattr("src.main.InstagramBrowserScraper", FakeBrowserScraper)
    args = Namespace(
        use_login_browser=True,
        browser_cdp="http://127.0.0.1:9222",
        instagram_mode="browser-only",
        instagram_min_followers=200_000,
        max_browser_items=10,
        instagram_seed_handles="",
        instagram_seed_file=None,
    )

    with pytest.raises(ScrapeError, match="browser unavailable"):
        scrape_platform(FakePublicScraper(), "instagram", args, "mexico")


def test_facebook_browser_search_requires_login_browser() -> None:
    class FakePublicScraper:
        pass

    args = Namespace(
        use_login_browser=False,
        facebook_mode="browser-search",
        facebook_min_followers=0,
        browser_cdp="http://127.0.0.1:9222",
        max_browser_items=10,
    )

    with pytest.raises(ScrapeError, match="Facebook Mexico data requires"):
        scrape_platform(FakePublicScraper(), "facebook", args, "mexico")


def test_facebook_public_only_uses_global_source() -> None:
    class FakePublicScraper:
        def scrape_facebook_global(self, **kwargs):
            return [make_record("facebook")], None

    args = Namespace(
        use_login_browser=False,
        facebook_mode="public-only",
        facebook_min_followers=0,
        browser_cdp="http://127.0.0.1:9222",
        max_browser_items=10,
    )

    records, _ = scrape_platform(FakePublicScraper(), "facebook", args, "mexico")

    assert [record.platform for record in records] == ["facebook"]
