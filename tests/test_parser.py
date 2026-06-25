from pathlib import Path
import json

from src.parser import (
    discover_rank_pages,
    filter_by_followers,
    filter_by_subscribers,
    filter_instagram_mexico_records,
    is_mexico_location,
    parse_detail_page,
    parse_facebook_wikipedia_table,
    parse_facebook_search_cards,
    parse_hypeauditor_instagram,
    parse_scrumball_instagram,
    parse_instagram_following_payload,
    parse_instagram_graphql_profile,
    parse_instagram_wbloks_ip_location,
    parse_rank_table,
)


FIXTURE_DIR = Path(__file__).parent / "fixtures"
YOUTUBE_FIXTURE = FIXTURE_DIR / "mexico_sample.html"
INSTAGRAM_FIXTURE = FIXTURE_DIR / "instagram_hypeauditor_sample.html"
INSTAGRAM_SCRUMBALL_FIXTURE = FIXTURE_DIR / "instagram_scrumball_sample.html"
FACEBOOK_FIXTURE = FIXTURE_DIR / "facebook_wikipedia_sample.html"
INSTAGRAM_FOLLOWING_FIXTURE = FIXTURE_DIR / "instagram_following_page.json"
INSTAGRAM_GRAPHQL_FIXTURE = FIXTURE_DIR / "instagram_graphql_profile.json"
INSTAGRAM_WBLOKS_FIXTURE = FIXTURE_DIR / "instagram_wbloks_about.txt"
FACEBOOK_SEARCH_FIXTURE = FIXTURE_DIR / "facebook_search_sample.html"
FACEBOOK_PEOPLE_SEARCH_FIXTURE = FIXTURE_DIR / "facebook_people_search_sample.html"


def read_fixture(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_discover_rank_pages() -> None:
    pages = discover_rank_pages(read_fixture(YOUTUBE_FIXTURE), "mexico")

    assert pages[100].endswith("/mexico/all/top-100-youtube-channels-in-mexico")
    assert pages[300].endswith("/mexico/all/top-300-youtube-channels-in-mexico")
    assert pages[500].endswith("/mexico/all/top-500-youtube-channels-in-mexico")


def test_parse_youtube_rank_table_to_creator_records() -> None:
    records = parse_rank_table(
        read_fixture(YOUTUBE_FIXTURE),
        country="mexico",
        source_url="https://example.test/rank",
        source_page_limit=300,
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    assert len(records) == 2
    first = records[0]
    assert first.platform == "youtube"
    assert first.rank == 1
    assert first.name == "Masha y el Oso"
    assert first.handle == "masha-y-el-oso"
    assert first.subscriber_count == 45_700_000
    assert first.follower_count == 45_700_000
    assert first.view_count == 28_182_690_349
    assert first.video_count == 2_195
    assert first.category == "Film & Animation"
    assert first.profile_url.endswith("/masha-y-el-oso/youtuber-stats")


def test_filter_by_subscribers() -> None:
    records = parse_rank_table(
        read_fixture(YOUTUBE_FIXTURE),
        country="mexico",
        source_url="https://example.test/rank",
        source_page_limit=300,
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    filtered = filter_by_subscribers(records, 200_000)

    assert [record.name for record in filtered] == ["Masha y el Oso"]


def test_parse_hypeauditor_instagram() -> None:
    records = parse_hypeauditor_instagram(
        read_fixture(INSTAGRAM_FIXTURE),
        country="mexico",
        source_url="https://hypeauditor.com/top-instagram-all-mexico/",
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    assert len(records) == 2
    first = records[0]
    assert first.platform == "instagram"
    assert first.rank == 1
    assert first.name == "Taylor Swift"
    assert first.handle == "taylorswift"
    assert first.follower_count == 273_700_000
    assert first.profile_url == "https://www.instagram.com/taylorswift/"
    assert first.category == "Music"
    assert first.source_name == "HypeAuditor"
    assert records[1].rank == 2
    assert records[1].follower_count == 405_700_000


def test_parse_scrumball_instagram_mexico_creators() -> None:
    records = parse_scrumball_instagram(
        read_fixture(INSTAGRAM_SCRUMBALL_FIXTURE),
        country="mexico",
        source_url="https://www.scrumball.com/ranking/top-instagram-influencers-in-mexico",
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    assert len(records) == 2
    assert records[0].platform == "instagram"
    assert records[0].name == "Yuya"
    assert records[0].handle == "yuyacst"
    assert records[0].country == "mexico"
    assert records[0].ip_location == "Mexico"
    assert records[0].follower_count == 15_900_000
    assert records[0].view_count == 5_300_000
    assert records[0].source_name == "Scrumball"
    assert records[0].source_mode == "public_mexico_ranking"
    assert records[1].handle == "kimberly.loaiza"
    assert records[1].follower_count == 37_000_000


def test_filter_by_followers() -> None:
    records = parse_hypeauditor_instagram(
        read_fixture(INSTAGRAM_FIXTURE),
        country="mexico",
        source_url="https://hypeauditor.com/top-instagram-all-mexico/",
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    filtered = filter_by_followers(records, 300_000_000)

    assert [record.handle for record in filtered] == ["selenagomez"]


def test_parse_facebook_wikipedia_table() -> None:
    records = parse_facebook_wikipedia_table(
        read_fixture(FACEBOOK_FIXTURE),
        source_url="https://en.wikipedia.org/wiki/List_of_most-followed_Facebook_pages",
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    assert len(records) == 2
    first = records[0]
    assert first.platform == "facebook"
    assert first.country == "global"
    assert first.rank == 1
    assert first.name == "Facebook App"
    assert first.follower_count == 214_000_000
    assert first.source_name == "Wikipedia"
    assert records[1].follower_count == 170_200_000


def test_parse_instagram_following_payload_to_creator_records() -> None:
    payload = json.loads(read_fixture(INSTAGRAM_FOLLOWING_FIXTURE))

    records = parse_instagram_following_payload(
        payload,
        country="mexico",
        source_url="https://www.instagram.com/api/v1/friendships/seed/following/",
        scraped_at="2026-06-10T00:00:00+00:00",
    )

    assert len(records) == 2
    first = records[0]
    assert first.platform == "instagram"
    assert first.platform_user_id == "101"
    assert first.handle == "mexicocreator"
    assert first.name == "Mexico Creator"
    assert first.follower_count == 350_000
    assert first.is_verified is True
    assert first.is_private is False
    assert first.source_mode == "browser_following"
    assert first.description == "Travel and food in Mexico"


def test_parse_instagram_graphql_profile_and_wbloks_location() -> None:
    graphql_payload = json.loads(read_fixture(INSTAGRAM_GRAPHQL_FIXTURE))
    profile = parse_instagram_graphql_profile(graphql_payload)
    ip_location = parse_instagram_wbloks_ip_location(read_fixture(INSTAGRAM_WBLOKS_FIXTURE))

    assert profile["platform_user_id"] == "101"
    assert profile["handle"] == "mexicocreator"
    assert profile["name"] == "Mexico Creator"
    assert profile["follower_count"] == 350_000
    assert profile["description"] == "Travel and food in Mexico"
    assert profile["is_verified"] is True
    assert ip_location == "Mexico"
    assert is_mexico_location("México")
    assert is_mexico_location("墨西哥")


def test_filter_instagram_mexico_records() -> None:
    payload = json.loads(read_fixture(INSTAGRAM_FOLLOWING_FIXTURE))
    records = parse_instagram_following_payload(
        payload,
        country="mexico",
        source_url="https://www.instagram.com/api/v1/friendships/seed/following/",
        scraped_at="2026-06-10T00:00:00+00:00",
    )
    records[0].ip_location = "México"
    records[1].ip_location = "United States"

    filtered = filter_instagram_mexico_records(records, min_followers=200_000)

    assert [record.handle for record in filtered] == ["mexicocreator"]


def test_parse_facebook_search_cards() -> None:
    records = parse_facebook_search_cards(
        read_fixture(FACEBOOK_SEARCH_FIXTURE),
        country="mexico",
        source_url="https://www.facebook.com/search/pages/?q=mexico%20creator",
        scraped_at="2026-06-10T00:00:00+00:00",
        result_type="主页",
        source_query="mexico creator",
    )

    assert len(records) == 3
    assert records[0].platform == "facebook"
    assert records[0].country == "mexico"
    assert records[0].result_type == "主页"
    assert records[0].name == "Mexico Creator"
    assert records[0].handle == "mexico.creator"
    assert records[0].follower_count == 350_000
    assert records[0].source_query == "mexico creator"
    assert records[0].source_mode == "browser_search"
    assert records[1].follower_count == 1_200_000
    assert records[2].handle == "AlejandraMezaDIY"
    assert records[2].follower_count == 2_670_000


def test_parse_facebook_search_cards_thai_followers() -> None:
    records = parse_facebook_search_cards(
        """
        <div class="facebook-page-card">
          <a href="https://www.facebook.com/thai.vape.shop">ร้านบุหรี่ไฟฟ้าไทย</a>
          <span>กรุงเทพมหานคร · 2.5 หมื่น ผู้ติดตาม · contact@example.com</span>
        </div>
        <div class="facebook-page-card">
          <a href="https://www.facebook.com/pod.review.th">รีวิวพอตไฟฟ้า</a>
          <span>เชียงใหม่ · 1.2 แสน คนถูกใจ</span>
        </div>
        """,
        country="thailand",
        source_url="https://www.facebook.com/search/pages/?q=vape%20thailand",
        scraped_at="2026-06-13T00:00:00+00:00",
        result_type="主页",
        source_query="vape thailand",
    )

    assert len(records) == 2
    assert records[0].follower_count == 25_000
    assert records[0].email == "contact@example.com"
    assert records[1].follower_count == 120_000


def test_parse_facebook_people_search_cards() -> None:
    records = parse_facebook_search_cards(
        read_fixture(FACEBOOK_PEOPLE_SEARCH_FIXTURE),
        country="mexico",
        source_url="https://www.facebook.com/search/people/?q=%F0%9F%87%B2%F0%9F%87%BD",
        scraped_at="2026-06-10T00:00:00+00:00",
        result_type="用户",
        source_query="🇲🇽",
    )

    assert len(records) == 2
    first = records[0]
    assert first.result_type == "用户"
    assert first.name == "Juan Perez 🇲🇽"
    assert first.profile_url == "https://www.facebook.com/profile.php?id=123"
    assert first.handle == "123"
    assert first.friend_count == 58
    assert first.location == "Chicago"
    assert first.work_school == "Taqueria Mexico"
    assert first.email == "juan@example.com"
    assert first.source_query == "🇲🇽"
    assert first.raw_text
    assert first.info_score == 5
    assert records[1].profile_url == "https://www.facebook.com/maria.mx"
    assert records[1].location == "Guadalajara"
    assert records[1].work_school == "Universidad de Guadalajara"


def test_parse_detail_page() -> None:
    html = """
    <html>
      <head><meta name="description" content="A creator description"></head>
      <body><a href="https://www.youtube.com/channel/UCabc-123">YouTube</a></body>
    </html>
    """

    detail = parse_detail_page(html)

    assert detail["description"] == "A creator description"
    assert detail["youtube_channel_url"] == "https://www.youtube.com/channel/UCabc-123"
    assert detail["official_channel_id"] == "UCabc-123"
