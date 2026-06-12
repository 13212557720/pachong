from src.facebook_browser import FacebookBrowserScraper


class FakePage:
    def __init__(self, browser, html_by_url):
        self.browser = browser
        self.html_by_url = html_by_url
        self.url = ""

    def goto(self, url, wait_until=None):
        self.url = url
        self.browser.visited_urls.append(url)

    def wait_for_timeout(self, timeout):
        return None

    def content(self):
        return self.html_by_url[self.url]

    def close(self):
        return None

    @property
    def mouse(self):
        return self

    def wheel(self, x, y):
        return None

    def evaluate(self, script):
        return 0


class FakeBrowserSession:
    visited_urls = []

    def __init__(self, cdp_url, timeout_ms=30_000):
        self.html_by_url = {
            "https://www.facebook.com/search/people/?q=people": """
            <div class="facebook-user-card">
              <a href="https://www.facebook.com/profile.php?id=1">Person One</a>
              <span>Mexico City</span>
            </div>
            """,
            "https://www.facebook.com/search/people/?q=people-filter": """
            <div class="facebook-user-card">
              <a href="https://www.facebook.com/profile.php?id=1">Person One</a>
              <span>Mexico City</span>
            </div>
            <div class="facebook-user-card">
              <a href="https://www.facebook.com/profile.php?id=2">Person Two</a>
              <span>7K followers</span>
            </div>
            """,
            "https://www.facebook.com/search/pages/?q=pages": """
            <div class="facebook-page-card">
              <a href="https://www.facebook.com/profile.php?id=1">Person One Duplicate</a>
              <span>100K followers</span>
            </div>
            <div class="facebook-page-card">
              <a href="https://www.facebook.com/page.two">Page Two</a>
              <span>250K followers</span>
            </div>
            """,
        }

    def __enter__(self):
        self.visited_urls = FakeBrowserSession.visited_urls
        return self

    def new_page(self):
        return FakePage(self, self.html_by_url)

    def __exit__(self, exc_type, exc, traceback):
        return None


def test_facebook_search_collects_people_then_pages_and_dedupes(monkeypatch) -> None:
    FakeBrowserSession.visited_urls = []
    monkeypatch.setattr("src.facebook_browser.BrowserSession", FakeBrowserSession)
    scraper = FacebookBrowserScraper(cdp_url="http://127.0.0.1:9222")

    records = scraper.scrape_search(
        country_slug="mexico",
        min_followers=0,
        max_items=2,
        people_queries=["people"],
        page_queries=["pages"],
        scroll_rounds=1,
    )

    assert [record.name for record in records] == ["Person One", "Page Two"]
    assert [record.result_type for record in records] == ["用户", "主页"]
    assert FakeBrowserSession.visited_urls == [
        "https://www.facebook.com/search/people/?q=people",
        "https://www.facebook.com/search/pages/?q=pages",
    ]


def test_facebook_search_can_require_min_followers_during_collection(monkeypatch) -> None:
    FakeBrowserSession.visited_urls = []
    monkeypatch.setattr("src.facebook_browser.BrowserSession", FakeBrowserSession)
    scraper = FacebookBrowserScraper(cdp_url="http://127.0.0.1:9222")

    records = scraper.scrape_search(
        country_slug="mexico",
        min_followers=5_000,
        max_items=2,
        people_queries=["people-filter"],
        page_queries=["pages"],
        scroll_rounds=1,
        include_people=True,
        include_pages=False,
        require_min_followers_during_collection=True,
    )

    assert [record.name for record in records] == ["Person Two"]
    assert records[0].follower_count == 7_000
