from __future__ import annotations

import argparse
import base64
import html
import json
import re
import time
from dataclasses import asdict
from pathlib import Path
import sys
from typing import Any
from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlunparse

import pandas as pd
import requests
import websocket

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.exporter import records_to_dataframe
from src.parser import parse_facebook_search_cards
from src.scraper import utc_now_iso


THAILAND_HINTS = [
    "ไทย",
    "ประเทศไทย",
    "กรุงเทพ",
    "กรุงเทพมหานคร",
    "เชียงใหม่",
    "ชลบุรี",
    "พัทยา",
    "ภูเก็ต",
    "นนทบุรี",
    "ขอนแก่น",
    "หาดใหญ่",
    "thailand",
    "thai",
    "bangkok",
    "chiang mai",
    "pattaya",
    "phuket",
]

VAPE_HINTS = [
    "บุหรี่ไฟฟ้า",
    "พอต",
    "น้ำยา",
    "relx",
    "ks quik",
    "marbo",
    "infy",
    "vape",
    "vaping",
    "e cigarette",
    "e-cigarette",
    "pod",
]


class CdpPage:
    def __init__(self, *, cdp_base: str, target: dict[str, Any], timeout: float = 20) -> None:
        self.cdp_base = cdp_base.rstrip("/")
        self.target = target
        self.timeout = timeout
        self.ws = websocket.create_connection(
            target["webSocketDebuggerUrl"],
            timeout=timeout,
            suppress_origin=True,
        )
        self._next_id = 1
        self.events: list[dict[str, Any]] = []

    def close(self) -> None:
        try:
            self.ws.close()
        finally:
            requests.get(f"{self.cdp_base}/json/close/{self.target['id']}", timeout=5)

    def call(self, method: str, params: dict[str, Any] | None = None, *, wait: bool = True) -> Any:
        message_id = self._next_id
        self._next_id += 1
        self.ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
        if not wait:
            return None

        deadline = time.time() + self.timeout
        while time.time() < deadline:
            raw = self.ws.recv()
            payload = json.loads(raw)
            if payload.get("id") != message_id:
                if "method" in payload:
                    self.events.append(payload)
                continue
            if "error" in payload:
                raise RuntimeError(f"CDP {method} failed: {payload['error']}")
            return payload.get("result")
        raise TimeoutError(f"CDP call timed out: {method}")

    def drain_events(self, duration: float) -> list[dict[str, Any]]:
        deadline = time.time() + duration
        old_timeout = self.ws.gettimeout()
        self.ws.settimeout(0.25)
        try:
            while time.time() < deadline:
                try:
                    payload = json.loads(self.ws.recv())
                except websocket.WebSocketTimeoutException:
                    continue
                if "method" in payload:
                    self.events.append(payload)
        finally:
            self.ws.settimeout(old_timeout)
        return list(self.events)

    def evaluate(self, expression: str, *, return_by_value: bool = True) -> Any:
        result = self.call(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": True,
                "returnByValue": return_by_value,
            },
        )
        value = (result or {}).get("result", {})
        return value.get("value")

    def navigate(self, url: str) -> None:
        self.call("Page.navigate", {"url": url})
        self.wait_ready()

    def wait_ready(self, *, timeout: float = 25) -> None:
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                state = self.evaluate("document.readyState")
                if state in {"interactive", "complete"}:
                    return
            except Exception:
                pass
            time.sleep(0.5)

    def scroll(self, rounds: int, delay: float) -> None:
        last_height = 0
        stable_rounds = 0
        for _ in range(rounds):
            self.evaluate("window.scrollBy(0, Math.max(2500, window.innerHeight * 2))")
            self.drain_events(delay)
            height = int(self.evaluate("document.body.scrollHeight") or 0)
            if height and height == last_height:
                stable_rounds += 1
            else:
                stable_rounds = 0
            last_height = height
            if stable_rounds >= 2:
                break

    def html(self) -> str:
        return self.evaluate("document.documentElement.outerHTML") or ""

    def cookies(self) -> list[dict[str, Any]]:
        result = self.call("Network.getAllCookies")
        return (result or {}).get("cookies", [])

    def response_body(self, request_id: str) -> str:
        result = self.call("Network.getResponseBody", {"requestId": request_id})
        body = (result or {}).get("body", "")
        if (result or {}).get("base64Encoded"):
            return base64.b64decode(body).decode("utf-8", errors="replace")
        return body


def new_cdp_page(cdp_base: str) -> CdpPage:
    response = requests.put(f"{cdp_base.rstrip('/')}/json/new?about:blank", timeout=10)
    response.raise_for_status()
    return CdpPage(cdp_base=cdp_base, target=response.json())


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def has_any_hint(text: str, hints: list[str]) -> bool:
    folded = normalize_text(text)
    return any(hint.lower() in folded for hint in hints)


def is_relevant(record) -> bool:
    text = " ".join(
        [
            record.name,
            record.handle,
            record.location,
            record.description,
            record.raw_text,
            record.source_query,
        ]
    )
    return has_any_hint(text, THAILAND_HINTS) and has_any_hint(text, VAPE_HINTS)


def export(records: list[Any], out_dir: Path, stem: str) -> tuple[Path, Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    df = records_to_dataframe(records)
    raw_json = out_dir / f"{stem}.json"
    csv_path = out_dir / f"{stem}.csv"
    xlsx_path = out_dir / f"{stem}.xlsx"
    raw_json.write_text(
        json.dumps([asdict(record) for record in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)
    return raw_json, csv_path, xlsx_path


def build_search_url(query: str, args: argparse.Namespace) -> str:
    if args.search_template:
        template = args.search_template
        if "{query}" in template or "{query_raw}" in template:
            return template.format(query=quote_plus(query), query_raw=query)

        parsed = urlparse(template)
        pairs = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key != "q"]
        pairs.insert(0, ("q", query))
        return urlunparse(parsed._replace(query=urlencode(pairs)))

    pairs = [("q", query)]
    if args.sde:
        pairs.append(("sde", args.sde))
    return f"https://www.facebook.com/search/pages/?{urlencode(pairs)}"


def parse_visible_facebook_cards(
    page: CdpPage,
    *,
    country: str,
    source_url: str,
    scraped_at: str,
    source_query: str,
):
    candidates = page.evaluate(
        r"""
        (() => {
          const skipText = new Set([
            "关注", "發送訊息", "发消息", "全部", "用户", "公共主页", "Reels",
            "Marketplace", "小组", "活动", "Follow", "Message", "Like"
          ]);
          const hasMetric = (text) => /followers?|位粉丝|ผู้ติดตาม|คนถูกใจ|likes?/i.test(text || "");
          const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
          const rows = [];
          const seen = new Set();
          for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
            const href = anchor.href || "";
            let name = clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.textContent);
            if (!href.includes("facebook.com/") || !name || skipText.has(name)) continue;
            if (/\/(search|login|groups\/discover|friends|watch|marketplace|events|notifications)(\/|\?|$)/.test(href)) continue;
            if (href.includes("facebook.com/profile.php") && !href.includes("id=")) continue;

            let node = anchor;
            let cardText = "";
            for (let depth = 0; depth < 9 && node; depth += 1) {
              const text = clean(node.innerText);
              if (hasMetric(text) && text.length >= name.length && text.length <= 1800) {
                cardText = text;
                break;
              }
              node = node.parentElement;
            }
            if (!cardText || !hasMetric(cardText)) continue;

            const key = href.split("?")[0] + "|" + name;
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push({name, href, text: cardText});
          }
          return rows.slice(0, 80);
        })()
        """
    ) or []
    fragments = []
    for item in candidates:
        name = html.escape(str(item.get("name") or ""))
        href = html.escape(str(item.get("href") or ""), quote=True)
        text = html.escape(str(item.get("text") or ""))
        if not name or not href or not text:
            continue
        fragments.append(
            f'<div class="facebook-page-card"><a href="{href}">{name}</a><span>{text}</span></div>'
        )
    if not fragments:
        return []
    return parse_facebook_search_cards(
        "\n".join(fragments),
        country=country,
        source_url=source_url,
        scraped_at=scraped_at,
        result_type="主页",
        source_query=source_query,
    )


def load_queries(path: Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def run(args: argparse.Namespace) -> int:
    queries = load_queries(Path(args.query_file))
    out_dir = Path(args.out_dir)
    scraped_at = utc_now_iso()
    records = []
    seen_urls = set()

    for index, query in enumerate(queries, start=1):
        if len(records) >= args.max_items:
            break

        url = build_search_url(query, args)
        print(f"[{index}/{len(queries)}] {query} -> {url}", flush=True)
        page = new_cdp_page(args.cdp)
        try:
            page.call("Page.enable")
            page.call("Runtime.enable")
            page.navigate(url)
            time.sleep(args.initial_wait)
            page.scroll(args.scrolls, args.scroll_delay)
            html = page.html()
            parsed = parse_facebook_search_cards(
                html,
                country="thailand",
                source_url=url,
                scraped_at=scraped_at,
                result_type="主页",
                source_query=query,
            )
            if not parsed:
                parsed = parse_visible_facebook_cards(
                    page,
                    country="thailand",
                    source_url=url,
                    scraped_at=scraped_at,
                    source_query=query,
                )
        finally:
            page.close()

        added = 0
        for record in parsed:
            if record.profile_url in seen_urls:
                continue
            if record.follower_count < args.min_followers:
                continue
            if args.require_relevant and not is_relevant(record):
                continue
            seen_urls.add(record.profile_url)
            record.rank = len(records) + 1
            records.append(record)
            added += 1
            if len(records) >= args.max_items:
                break

        print(f"  parsed={len(parsed)} added={added} total={len(records)}", flush=True)
        if records and (index % args.save_every == 0 or len(records) >= args.max_items):
            export(records, out_dir, args.stem)
            print(f"  saved total={len(records)} to {out_dir}", flush=True)

    if records:
        raw_json, csv_path, xlsx_path = export(records, out_dir, args.stem)
        print(f"JSON: {raw_json}")
        print(f"CSV: {csv_path}")
        print(f"XLSX: {xlsx_path}")
        return 0

    print("No matching Facebook records found")
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Scrape Facebook Thailand vape pages via page-level CDP.")
    parser.add_argument("--cdp", default="http://127.0.0.1:9222")
    parser.add_argument("--query-file", default="queries/facebook_thailand_vape_pages.txt")
    parser.add_argument(
        "--search-template",
        default="",
        help="Reusable Facebook search URL. If it contains {query}, that placeholder is replaced.",
    )
    parser.add_argument("--sde", default="", help="Facebook search session parameter copied from a working URL.")
    parser.add_argument("--out-dir", default="FINAL_facebook_thailand_vape_gt200_current")
    parser.add_argument("--stem", default="facebook_thailand_vape_gt200")
    parser.add_argument("--min-followers", type=int, default=200)
    parser.add_argument("--max-items", type=int, default=1000)
    parser.add_argument("--scrolls", type=int, default=6)
    parser.add_argument("--initial-wait", type=float, default=4.0)
    parser.add_argument("--scroll-delay", type=float, default=1.2)
    parser.add_argument("--save-every", type=int, default=3)
    parser.add_argument(
        "--no-relevance-filter",
        dest="require_relevant",
        action="store_false",
        help="Keep all pages above the follower threshold even without Thailand/vape text hints.",
    )
    parser.set_defaults(require_relevant=True)
    return parser


if __name__ == "__main__":
    raise SystemExit(run(build_parser().parse_args()))
