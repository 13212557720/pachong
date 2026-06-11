from src.scraper import YouTubersMeScraper


def test_choose_rank_page_falls_back_to_largest_parseable_page(monkeypatch) -> None:
    scraper = YouTubersMeScraper(base_url="https://example.test")
    home_html = """
    <a href="/mexico/all/top-300-youtube-channels-in-mexico">Top 300</a>
    <a href="/mexico/all/top-500-youtube-channels-in-mexico">Top 500</a>
    """
    table_html = """
    <table class="top-charts">
      <tr><th>rank</th><th>Youtuber</th><th>subscribers</th><th>video views</th><th>video count</th><th>category</th><th>started</th></tr>
      <tr><td>1</td><td><a href="/creator/youtuber-stats">Creator</a></td><td>300,000</td><td>2,000</td><td>10</td><td>Education</td><td>2021</td></tr>
    </table>
    """

    def fake_fetch(url: str) -> str:
        if url.endswith("top-youtube-channels-in-mexico"):
            return home_html
        if url.endswith("top-500-youtube-channels-in-mexico"):
            raise RuntimeError("bad gateway")
        if url.endswith("top-300-youtube-channels-in-mexico"):
            return table_html
        raise AssertionError(url)

    monkeypatch.setattr(scraper, "fetch_html", fake_fetch)

    selected_url, selected_limit, discovered, html = scraper.choose_rank_page("mexico", 1000)

    assert selected_url.endswith("top-300-youtube-channels-in-mexico")
    assert selected_limit == 300
    assert sorted(discovered) == [300, 500]
    assert html == table_html
