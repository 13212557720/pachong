from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Dict, Tuple

from .exporter import export_platform_records, export_records
from .facebook_browser import FacebookBrowserScraper
from .instagram_browser import InstagramBrowserScraper, normalize_handles
from .models import CreatorRecord
from .scraper import ScrapeError, ScrapeMetadata, YouTubersMeScraper, utc_now_iso
from .youtube_api import enrich_with_youtube_api


PLATFORMS = ("youtube", "instagram", "facebook")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Collect public creator ranking data and export Chinese CSV/XLSX files分."
    )
    parser.add_argument(
        "--platform",
        choices=[*PLATFORMS, "all"],
        default="youtube",
        help="Platform to collect.",
    )
    parser.add_argument("--country", default="mexico", help="Country slug, e.g. mexico")
    parser.add_argument(
        "--youtube-min-subscribers",
        type=int,
        default=200_000,
        help="Minimum YouTube subscriber count to keep.",
    )
    parser.add_argument(
        "--instagram-min-followers",
        type=int,
        default=200_000,
        help="Minimum Instagram follower count to keep.",
    )
    parser.add_argument(
        "--facebook-min-followers",
        type=int,
        default=0,
        help="Minimum Facebook follower count to keep.",
    )
    parser.add_argument(
        "--min-subscribers",
        type=int,
        default=None,
        help="Backward-compatible alias for --youtube-min-subscribers.",
    )
    parser.add_argument(
        "--max-rank-page",
        type=int,
        default=1000,
        help="Largest YouTube ranking page to try before falling back.",
    )
    parser.add_argument(
        "--out-dir",
        default="output",
        help="Output directory for platform-specific files.",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Backward-compatible single-platform output base path without extension.",
    )
    parser.add_argument(
        "--details",
        action="store_true",
        help="Visit public YouTube detail pages for best-effort extra fields.",
    )
    parser.add_argument(
        "--detail-delay",
        type=float,
        default=0.5,
        help="Delay between detail page requests when --details is enabled.",
    )
    parser.add_argument(
        "--api-enrich",
        action="store_true",
        help="Use YouTube Data API when YOUTUBE_API_KEY and google-api-python-client are available.",
    )
    parser.add_argument(
        "--use-login-browser",
        action="store_true",
        help="Use a locally logged-in browser through Playwright CDP for supported platforms.",
    )
    parser.add_argument(
        "--browser-cdp",
        default="http://127.0.0.1:9222",
        help="Chrome/AdsPower CDP endpoint for a logged-in browser.",
    )
    parser.add_argument(
        "--instagram-mode",
        choices=["browser-first", "public-only", "browser-only"],
        default="browser-first",
        help="Instagram collection mode.",
    )
    parser.add_argument(
        "--facebook-mode",
        choices=["browser-search", "public-only"],
        default="browser-search",
        help="Facebook collection mode.",
    )
    parser.add_argument(
        "--facebook-result-scope",
        choices=["mixed", "people", "pages"],
        default="mixed",
        help="Facebook browser-search result scope.",
    )
    parser.add_argument(
        "--instagram-seed-handles",
        default="",
        help="Comma-separated Instagram handles used as browser-mode seeds.",
    )
    parser.add_argument(
        "--instagram-seed-file",
        default=None,
        help="Text file with one Instagram handle per line.",
    )
    parser.add_argument(
        "--max-browser-items",
        type=int,
        default=200,
        help="Maximum number of browser-mode records to inspect per platform.",
    )
    parser.add_argument(
        "--instagram-following-pages-per-seed",
        type=int,
        default=10,
        help="Maximum Instagram following pages to request for each seed handle.",
    )
    parser.add_argument(
        "--facebook-scrolls",
        type=int,
        default=8,
        help="Maximum scroll rounds for each Facebook search query.",
    )
    parser.add_argument(
        "--facebook-query-file",
        default=None,
        help="Backward-compatible alias for --facebook-page-query-file.",
    )
    parser.add_argument(
        "--facebook-people-query-file",
        default=None,
        help="Text file with one Facebook people-search query per line.",
    )
    parser.add_argument(
        "--facebook-page-query-file",
        default=None,
        help="Text file with one Facebook page-search query per line.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    validate_args(parser, args)

    country_slug = normalize_slug(args.country)
    selected_platforms = PLATFORMS if args.platform == "all" else (args.platform,)
    scraper = YouTubersMeScraper()

    records_by_platform: Dict[str, list[CreatorRecord]] = {}
    metadata_by_platform: Dict[str, ScrapeMetadata] = {}
    failures: Dict[str, str] = {}

    for platform in selected_platforms:
        try:
            records, metadata = scrape_platform(scraper, platform, args, country_slug)
        except ScrapeError as exc:
            failures[platform] = str(exc)
            continue
        except Exception as exc:
            failures[platform] = f"Unexpected error: {exc}"
            continue

        records_by_platform[platform] = records
        metadata_by_platform[platform] = metadata

    if not records_by_platform:
        for platform, message in failures.items():
            print(f"{platform}: {message}", file=sys.stderr)
        return 1

    if args.details and records_by_platform.get("youtube"):
        scraper.enrich_details(records_by_platform["youtube"], delay_seconds=args.detail_delay)

    api_count = 0
    if args.api_enrich and records_by_platform.get("youtube"):
        api_count = enrich_with_youtube_api(records_by_platform["youtube"])

    if args.out and len(records_by_platform) == 1:
        platform = next(iter(records_by_platform))
        outputs = {platform: export_records(records_by_platform[platform], args.out)}
    else:
        outputs = export_platform_records(records_by_platform, Path(args.out_dir))

    print_summary(metadata_by_platform, outputs, failures)
    if args.api_enrich:
        print(f"YouTube API enriched rows: {api_count}")
    return 0 if not failures else 2


def validate_args(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
    if args.min_subscribers is not None:
        args.youtube_min_subscribers = args.min_subscribers
    for name in [
        "youtube_min_subscribers",
        "instagram_min_followers",
        "facebook_min_followers",
    ]:
        if getattr(args, name) < 0:
            parser.error(f"--{name.replace('_', '-')} must be >= 0")
    if args.max_rank_page < 1:
        parser.error("--max-rank-page must be >= 1")
    if args.max_browser_items < 1:
        parser.error("--max-browser-items must be >= 1")
    if args.instagram_following_pages_per_seed < 1:
        parser.error("--instagram-following-pages-per-seed must be >= 1")
    if args.facebook_scrolls < 1:
        parser.error("--facebook-scrolls must be >= 1")
    if args.out and args.platform == "all":
        parser.error("--out can only be used with a single --platform")


def scrape_platform(
    scraper: YouTubersMeScraper,
    platform: str,
    args: argparse.Namespace,
    country_slug: str,
) -> Tuple[list[CreatorRecord], ScrapeMetadata]:
    if platform == "youtube":
        return scraper.scrape_country(
            country_slug=country_slug,
            min_subscribers=args.youtube_min_subscribers,
            max_rank_page=args.max_rank_page,
        )
    if platform == "instagram":
        if args.instagram_mode == "public-only" or not args.use_login_browser:
            return scraper.scrape_instagram_country(
                country_slug=country_slug,
                min_followers=args.instagram_min_followers,
            )

        browser_scraper = InstagramBrowserScraper(
            cdp_url=args.browser_cdp,
            public_scraper=scraper,
        )
        try:
            records = browser_scraper.scrape_instagram(
                country_slug=country_slug,
                min_followers=args.instagram_min_followers,
                seed_handles=load_instagram_seed_handles(args),
                max_items=args.max_browser_items,
                following_pages_per_seed=getattr(args, "instagram_following_pages_per_seed", 10),
            )
            metadata = make_browser_metadata(
                platform="instagram",
                country=country_slug,
                source_url=args.browser_cdp,
                total_rows=len(records),
                filtered_rows=len(records),
            )
            return records, metadata
        except ScrapeError:
            if args.instagram_mode == "browser-only":
                raise
            return scraper.scrape_instagram_country(
                country_slug=country_slug,
                min_followers=args.instagram_min_followers,
            )

    if platform == "facebook":
        if args.facebook_mode == "public-only":
            return scraper.scrape_facebook_global(
                min_followers=args.facebook_min_followers,
            )
        if not args.use_login_browser:
            raise ScrapeError(
                "Facebook Mexico data requires --use-login-browser with --facebook-mode browser-search. "
                "Use --facebook-mode public-only only if you explicitly want the global Wikipedia list."
            )
        browser_scraper = FacebookBrowserScraper(cdp_url=args.browser_cdp)
        records = browser_scraper.scrape_search(
            country_slug=country_slug,
            min_followers=args.facebook_min_followers,
            max_items=args.max_browser_items,
            people_queries=load_facebook_people_queries(args),
            page_queries=load_facebook_page_queries(args),
            scroll_rounds=getattr(args, "facebook_scrolls", 8),
            include_people=args.facebook_result_scope in {"mixed", "people"},
            include_pages=args.facebook_result_scope in {"mixed", "pages"},
            require_min_followers_during_collection=args.facebook_min_followers > 0,
        )
        metadata = make_browser_metadata(
            platform="facebook",
            country=country_slug,
            source_url=args.browser_cdp,
            total_rows=len(records),
            filtered_rows=len(records),
        )
        return records, metadata

    raise ScrapeError(f"Unsupported platform: {platform}")


def load_instagram_seed_handles(args: argparse.Namespace) -> list[str]:
    handles: list[str] = []
    raw_handles = getattr(args, "instagram_seed_handles", "") or ""
    handles.extend(part.strip() for part in raw_handles.split(","))

    seed_file = getattr(args, "instagram_seed_file", None)
    if seed_file:
        path = Path(seed_file)
        if not path.exists():
            raise ScrapeError(f"Instagram seed file not found: {path}")
        handles.extend(path.read_text(encoding="utf-8").splitlines())

    return normalize_handles(handles)


def load_facebook_people_queries(args: argparse.Namespace) -> list[str] | None:
    query_file = getattr(args, "facebook_people_query_file", None)
    return load_query_file(query_file, label="Facebook people query file")


def load_facebook_page_queries(args: argparse.Namespace) -> list[str] | None:
    query_file = getattr(args, "facebook_page_query_file", None) or getattr(
        args, "facebook_query_file", None
    )
    return load_query_file(query_file, label="Facebook page query file")


def load_query_file(query_file: str | None, *, label: str) -> list[str] | None:
    if not query_file:
        return None

    path = Path(query_file)
    if not path.exists():
        raise ScrapeError(f"{label} not found: {path}")
    queries = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    return [query for query in queries if query and not query.startswith("#")]


def make_browser_metadata(
    *,
    platform: str,
    country: str,
    source_url: str,
    total_rows: int,
    filtered_rows: int,
) -> ScrapeMetadata:
    return ScrapeMetadata(
        country=country,
        selected_url=f"{platform}:browser:{source_url}",
        selected_page_limit=total_rows,
        discovered_pages={total_rows: source_url},
        total_rows=total_rows,
        filtered_rows=filtered_rows,
        scraped_at=utc_now_iso(),
    )


def print_summary(
    metadata_by_platform: Dict[str, ScrapeMetadata],
    outputs: Dict[str, Tuple[Path, Path]],
    failures: Dict[str, str],
) -> None:
    for platform, metadata in metadata_by_platform.items():
        print(f"[{platform}] Country: {metadata.country}")
        print(f"[{platform}] Source: {metadata.selected_url}")
        print(f"[{platform}] Parsed rows: {metadata.total_rows}")
        print(f"[{platform}] Rows after filter: {metadata.filtered_rows}")
        csv_path, xlsx_path = outputs[platform]
        print(f"[{platform}] CSV: {csv_path}")
        print(f"[{platform}] XLSX: {xlsx_path}")
    for platform, message in failures.items():
        print(f"[{platform}] Failed: {message}", file=sys.stderr)


def normalize_slug(value: str) -> str:
    return value.strip().lower().replace("_", "-").replace(" ", "-")


if __name__ == "__main__":
    raise SystemExit(main())
