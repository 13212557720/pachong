#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.boss_browser import BossBrowserScraper
from src.boss_parser import BOSS_RECOMMEND_URL, export_boss_candidates
from src.scraper import ScrapeError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Collect BOSS recommended candidates, screen by HR keywords, and export CSV/XLSX."
    )
    parser.add_argument("--browser-cdp", default="http://127.0.0.1:9222")
    parser.add_argument("--source-url", default=BOSS_RECOMMEND_URL)
    parser.add_argument("--max-items", type=int, default=50)
    parser.add_argument("--scrolls", type=int, default=6)
    parser.add_argument("--delay-min", type=float, default=2.0)
    parser.add_argument("--delay-max", type=float, default=4.0)
    parser.add_argument("--include-unmatched", action="store_true")
    parser.add_argument("--out-dir", default="output_boss")
    parser.add_argument("--stem", default="boss_candidates")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    scraper = BossBrowserScraper(cdp_url=args.browser_cdp)

    try:
        records = scraper.scrape_recommend(
            max_items=args.max_items,
            scroll_rounds=args.scrolls,
            include_unmatched=args.include_unmatched,
            delay_min_seconds=args.delay_min,
            delay_max_seconds=args.delay_max,
            source_url=args.source_url,
        )
    except ScrapeError as exc:
        print(f"BOSS scrape failed: {exc}", file=sys.stderr)
        return 1

    csv_path, xlsx_path = export_boss_candidates(records, Path(args.out_dir) / args.stem)
    print(f"Matched candidates: {len(records)}")
    print(f"CSV: {csv_path}")
    print(f"XLSX: {xlsx_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
