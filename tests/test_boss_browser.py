import pytest

from src.boss_browser import BossBrowserScraper
from src.scraper import ScrapeError


class FakeLocator:
    def __init__(self, page):
        self.page = page

    def inner_text(self, timeout=None):
        return self.page.text


class FakePage:
    def __init__(self, browser):
        self.browser = browser
        self.url = ""
        self.text = ""
        self.html = ""

    def goto(self, url, wait_until=None):
        self.url = url
        self.browser.visited_urls.append(url)
        self.html = self.browser.html_by_url[url]
        self.text = self.html

    def wait_for_timeout(self, timeout):
        return None

    def content(self):
        return self.html

    def close(self):
        return None

    @property
    def mouse(self):
        return self

    def wheel(self, x, y):
        return None

    def evaluate(self, script):
        return 0

    def locator(self, selector):
        return FakeLocator(self)


class FakeBrowserSession:
    html_by_url = {}
    visited_urls = []

    def __init__(self, cdp_url, timeout_ms=30_000):
        self.html_by_url = FakeBrowserSession.html_by_url
        self.visited_urls = FakeBrowserSession.visited_urls

    def __enter__(self):
        return self

    def new_page(self):
        return FakePage(self)

    def __exit__(self, exc_type, exc, traceback):
        return None


def test_boss_browser_collects_matching_candidates(monkeypatch) -> None:
    FakeBrowserSession.visited_urls = []
    FakeBrowserSession.html_by_url = {
        "https://www.zhipin.com/web/chat/recommend": """
        <ul class="recommend-list">
          <li class="recommend-card">
            <a href="https://www.zhipin.com/web/geek/detail?securityId=abc">王同学</a>
            <span>26岁 本科 期望 深圳 · BD · 8-10K</span>
          </li>
        </ul>
        """,
        "https://www.zhipin.com/web/geek/detail?securityId=abc": """
        <main>负责海外 KOL 建联和 Instagram 媒介合作。</main>
        """,
    }
    monkeypatch.setattr("src.boss_browser.BrowserSession", FakeBrowserSession)

    scraper = BossBrowserScraper(cdp_url="http://127.0.0.1:9222")
    records = scraper.scrape_recommend(max_items=5, scroll_rounds=1)

    assert len(records) == 1
    assert records[0].name == "王同学"
    assert records[0].matched_keywords == ["海外", "KOL", "BD", "媒介", "建联", "Instagram"]
    assert FakeBrowserSession.visited_urls == [
        "https://www.zhipin.com/web/chat/recommend",
        "https://www.zhipin.com/web/geek/detail?securityId=abc",
    ]


def test_boss_browser_stops_on_login_or_verification(monkeypatch) -> None:
    FakeBrowserSession.visited_urls = []
    FakeBrowserSession.html_by_url = {
        "https://www.zhipin.com/web/chat/recommend": "<body>请先登录</body>",
    }
    monkeypatch.setattr("src.boss_browser.BrowserSession", FakeBrowserSession)

    scraper = BossBrowserScraper(cdp_url="http://127.0.0.1:9222")
    with pytest.raises(ScrapeError, match="请先登录"):
        scraper.scrape_recommend(max_items=5, scroll_rounds=1)
