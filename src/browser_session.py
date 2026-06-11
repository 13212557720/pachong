from __future__ import annotations

from contextlib import AbstractContextManager
from typing import Any

from .scraper import ScrapeError


class BrowserSession(AbstractContextManager["BrowserSession"]):
    def __init__(self, cdp_url: str, timeout_ms: int = 30_000) -> None:
        self.cdp_url = cdp_url
        self.timeout_ms = timeout_ms
        self._playwright: Any = None
        self.browser: Any = None
        self.context: Any = None

    def __enter__(self) -> "BrowserSession":
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise ScrapeError(
                "playwright is not installed. Run: python3 -m pip install -r requirements.txt"
            ) from exc

        self._playwright = sync_playwright().start()
        try:
            self.browser = self._playwright.chromium.connect_over_cdp(self.cdp_url)
        except Exception as exc:
            self._playwright.stop()
            raise ScrapeError(f"Cannot connect to browser CDP endpoint: {self.cdp_url}") from exc

        self.context = self.browser.contexts[0] if self.browser.contexts else self.browser.new_context()
        self.context.set_default_timeout(self.timeout_ms)
        return self

    def new_page(self):
        if self.context is None:
            raise ScrapeError("Browser session is not connected")
        return self.context.new_page()

    def __exit__(self, exc_type, exc, traceback) -> None:
        if self.browser is not None:
            self.browser.close()
        if self._playwright is not None:
            self._playwright.stop()
