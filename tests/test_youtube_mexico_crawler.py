from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
import pytest

from src.youtube_mexico_crawler import (
    Candidate,
    CrawlState,
    ValidatedChannel,
    apply_about_fallback,
    discover_candidates_for_query,
    export_outputs,
    find_continuation_token,
    official_channel_to_validated,
    parse_about_html,
    parse_about_browse_response,
    parse_subscribers,
    renderer_to_candidate,
    run_crawl,
    video_renderer_to_candidate,
)


def channel_renderer(
    channel_id: str,
    name: str,
    *,
    subscribers: str = "25K subscribers",
    handle: str | None = None,
    description: str = "Vlog de Mexico",
) -> dict[str, Any]:
    handle = handle or f"@{channel_id.lower()}"
    return {
        "channelRenderer": {
            "title": {"runs": [{"text": name}]},
            "channelId": channel_id,
            "navigationEndpoint": {
                "browseEndpoint": {
                    "browseId": channel_id,
                    "canonicalBaseUrl": f"/{handle}",
                },
                "commandMetadata": {
                    "webCommandMetadata": {"url": f"/{handle}"},
                },
            },
            "videoCountText": {"simpleText": subscribers},
            "descriptionSnippet": {"runs": [{"text": description}]},
        }
    }


def video_renderer(
    channel_id: str,
    owner_name: str,
    *,
    title: str = "Mexico travel vlog",
    handle: str | None = None,
    description: str = "Video grabado en Mexico",
) -> dict[str, Any]:
    handle = handle or f"@{channel_id.lower()}"
    owner_run = {
        "text": owner_name,
        "navigationEndpoint": {
            "browseEndpoint": {
                "browseId": channel_id,
                "canonicalBaseUrl": f"/{handle}",
            },
            "commandMetadata": {"webCommandMetadata": {"url": f"/{handle}"}},
        },
    }
    return {
        "videoRenderer": {
            "title": {"runs": [{"text": title}]},
            "longBylineText": {"runs": [owner_run]},
            "descriptionSnippet": {"runs": [{"text": description}]},
        }
    }


def candidate(channel_id: str = "UC123") -> Candidate:
    return Candidate(
        channel_id=channel_id,
        profile_url=f"https://www.youtube.com/@{channel_id.lower()}",
        handle=f"@{channel_id.lower()}",
        name="Canal Mexico",
        subscriber_count_hint=25_000,
        description="Vlog de Mexico",
        source_query="mexico youtuber",
        source_url="youtubei://search",
        source_api="youtubei",
        discovered_at="2026-06-24T00:00:00Z",
    )


def test_parse_subscribers_and_youtubei_renderer() -> None:
    assert parse_subscribers("12.5K subscribers") == 12_500
    assert parse_subscribers("1.2M suscriptores") == 1_200_000
    assert parse_subscribers("3.4万 位订阅者") == 34_000

    data = {
        "contents": [channel_renderer("UC123", "Canal México")],
        "continuationCommand": {"token": "NEXT_TOKEN"},
    }
    renderer = data["contents"][0]["channelRenderer"]
    item = renderer_to_candidate(renderer, "mexico youtuber", "2026-06-24T00:00:00Z")

    assert item.channel_id == "UC123"
    assert item.handle == "@uc123"
    assert item.subscriber_count_hint == 25_000
    assert item.profile_url == "https://www.youtube.com/@uc123"
    assert find_continuation_token(data) == "NEXT_TOKEN"


def test_video_renderer_to_candidate_extracts_owner_channel() -> None:
    item = video_renderer_to_candidate(
        video_renderer("UCVIDEO", "Video Canal")["videoRenderer"],
        "mexico vlog",
        "2026-06-24T00:00:00Z",
    )

    assert item is not None
    assert item.channel_id == "UCVIDEO"
    assert item.name == "Video Canal"
    assert item.handle == "@ucvideo"
    assert item.subscriber_count_hint == 0
    assert item.source_api == "youtubei_video"


def test_official_channel_filtering_and_about_country_fallback() -> None:
    base = candidate("UC123")
    accepted = official_channel_to_validated(
        {
            "id": "UC123",
            "snippet": {"title": "Canal Mexico", "country": "MX"},
            "statistics": {
                "subscriberCount": "50000",
                "viewCount": "1000000",
                "videoCount": "40",
            },
        },
        base,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        strict_country=True,
        scraped_at="2026-06-24T00:00:00Z",
    )
    assert accepted.is_strict_mexico
    assert accepted.reject_reason == ""
    assert accepted.country_source == "snippet.country"

    rejected_country = official_channel_to_validated(
        {
            "id": "UC123",
            "snippet": {"title": "US Channel", "country": "US"},
            "statistics": {"subscriberCount": "50000"},
        },
        base,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        strict_country=True,
        scraped_at="2026-06-24T00:00:00Z",
    )
    assert not rejected_country.is_strict_mexico
    assert rejected_country.reject_reason == "not_mexico_country"

    relaxed_country = official_channel_to_validated(
        {
            "id": "UC123",
            "snippet": {"title": "US Channel", "country": "US"},
            "statistics": {"subscriberCount": "50000"},
        },
        base,
        min_subscribers=10_000,
        max_subscribers=500_000,
        strict_country=False,
        scraped_at="2026-06-24T00:00:00Z",
    )
    assert not relaxed_country.is_strict_mexico
    assert relaxed_country.reject_reason == ""

    missing_country = official_channel_to_validated(
        {
            "id": "UC123",
            "snippet": {"title": "Canal"},
            "statistics": {"subscriberCount": "50000"},
        },
        base,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        strict_country=True,
        scraped_at="2026-06-24T00:00:00Z",
    )
    assert missing_country.reject_reason == "missing_country"
    apply_about_fallback(
        missing_country,
        {
            "country": "Mexico",
            "subscriber_count": 51_000,
            "video_count": 77,
            "view_count": 1_234_567,
            "email": "hello@example.com",
        },
        strict_country=True,
        collect_contact=True,
    )
    assert missing_country.is_strict_mexico
    assert missing_country.country_source == "about.country"
    assert missing_country.subscriber_count == 51_000
    assert missing_country.video_count == 77
    assert missing_country.view_count == 1_234_567
    assert missing_country.email == "hello@example.com"

    hidden_subscribers = official_channel_to_validated(
        {"id": "UC123", "snippet": {"country": "MX"}, "statistics": {}},
        base,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        strict_country=True,
        scraped_at="2026-06-24T00:00:00Z",
    )
    assert hidden_subscribers.reject_reason == "missing_subscriber_count"


def test_about_fallback_rechecks_subscriber_range() -> None:
    row = ValidatedChannel(
        channel_id="UCVIDEO",
        name="Video Canal",
        handle="@video",
        subscriber_count=0,
        view_count=0,
        video_count=0,
        profile_url="https://www.youtube.com/@video",
        country="",
        country_source="",
        source_query="mexico vlog",
        source_api="youtubei_video",
        is_strict_mexico=False,
        reject_reason="missing_country",
        scraped_at="2026-06-24T00:00:00Z",
    )

    apply_about_fallback(
        row,
        {"country": "Mexico", "subscriber_count": 9_999},
        strict_country=True,
        collect_contact=False,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
    )
    assert not row.is_strict_mexico
    assert row.reject_reason == "below_min_subscribers"

    apply_about_fallback(
        row,
        {"country": "Mexico", "subscriber_count": 50_000},
        strict_country=True,
        collect_contact=False,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
    )
    assert row.is_strict_mexico
    assert row.reject_reason == ""


def test_parse_about_html_extracts_counts_and_contact_fields() -> None:
    html = """
    <html><body>Business: info@example.com https://example.com</body>
    <script>
      var ytInitialData = {
        "country":"Mexico",
        "subscriberCountText":"12.3K subscribers",
        "videoCountText":"572 videos",
        "viewCountText":"7,258,230 views",
        "description":"This channel description is long enough for extraction."
      };
    </script></html>
    """

    details = parse_about_html(html, collect_contact=True)

    assert details["country"] == "Mexico"
    assert details["subscriber_count"] == 12_300
    assert details["video_count"] == 572
    assert details["view_count"] == 7_258_230
    assert details["email"] == "info@example.com"
    assert details["website_url"] == "https://example.com"


def test_parse_about_browse_response_extracts_view_model_fields() -> None:
    details = parse_about_browse_response(
        {
            "contents": {
                "aboutChannelRenderer": {
                    "metadata": {
                        "aboutChannelViewModel": {
                            "description": "Contacto info@example.com",
                            "country": "Mexico",
                            "subscriberCountText": "457K subscribers",
                            "videoCountText": "1,963 videos",
                            "viewCountText": "289,047,234 views",
                            "links": [
                                {
                                    "channelExternalLinkViewModel": {
                                        "link": {
                                            "content": "instagram.com/example",
                                        }
                                    }
                                },
                                {
                                    "channelExternalLinkViewModel": {
                                        "link": {
                                            "content": "https://example.com",
                                        }
                                    }
                                },
                            ],
                        }
                    }
                }
            }
        },
        collect_contact=True,
    )

    assert details["country"] == "Mexico"
    assert details["subscriber_count"] == 457_000
    assert details["video_count"] == 1_963
    assert details["view_count"] == 289_047_234
    assert details["email"] == "info@example.com"
    assert details["instagram_url"] == "https://instagram.com/example"
    assert details["website_url"] == "https://example.com"


def test_state_dedupes_candidates_and_exports(tmp_path: Path) -> None:
    state = CrawlState(tmp_path / "crawl_state.sqlite")
    try:
        state.add_candidates([candidate("UC1"), candidate("UC1"), candidate("UC2")])
        assert len(state.pending_candidates(10)) == 2

        accepted = ValidatedChannel(
            channel_id="UC1",
            name="Canal Mexico",
            handle="@uc1",
            subscriber_count=50_000,
            view_count=100,
            video_count=10,
            profile_url="https://www.youtube.com/@uc1",
            country="MX",
            country_source="snippet.country",
            source_query="mexico youtuber",
            source_api="youtubei",
            is_strict_mexico=True,
            reject_reason="",
            scraped_at="2026-06-24T00:00:00Z",
        )
        rejected = ValidatedChannel(
            channel_id="UC2",
            name="US Channel",
            handle="@uc2",
            subscriber_count=50_000,
            view_count=0,
            video_count=0,
            profile_url="https://www.youtube.com/@uc2",
            country="US",
            country_source="snippet.country",
            source_query="mexico youtuber",
            source_api="youtubei",
            is_strict_mexico=False,
            reject_reason="not_mexico_country",
            scraped_at="2026-06-24T00:00:00Z",
        )
        state.add_validated([accepted])
        state.add_rejections([rejected])
        assert state.accepted_count() == 1
        assert len(state.pending_candidates(10)) == 0

        export_outputs(
            state,
            tmp_path,
            collect_contact=False,
            summary={"accepted_rows": 1, "target_met": False},
        )
    finally:
        state.close()

    accepted_csv = tmp_path / "youtube_mexico_10k_1000k_channels.csv"
    rejected_csv = tmp_path / "rejected_channels.csv"
    summary_path = tmp_path / "crawl_summary.json"
    assert accepted_csv.exists()
    assert rejected_csv.exists()
    assert summary_path.exists()
    accepted_df = pd.read_csv(accepted_csv)
    assert accepted_df.loc[0, "频道ID"] == "UC1"
    assert "邮箱" not in accepted_df.columns
    assert json.loads(summary_path.read_text(encoding="utf-8"))["accepted_rows"] == 1


class FakeSearchClient:
    client_version = "fake-youtubei"

    def bootstrap(self) -> None:
        pass

    def search_page(self, query: str) -> dict[str, Any]:
        return {
            "contents": [
                channel_renderer("UC1", "Canal Mexico Uno", subscribers="50K subscribers"),
                channel_renderer("UC2", "Canal Mexico Dos", subscribers="60K subscribers"),
                channel_renderer("UC3", "Canal Mexico USA", subscribers="70K subscribers"),
            ]
        }

    def video_search_page(self, query: str) -> dict[str, Any]:
        return {"contents": []}

    def continuation_page(self, token: str) -> dict[str, Any]:
        return {}


class FakeChannelApiClient:
    def fetch_channels(self, channel_ids: list[str]) -> list[dict[str, Any]]:
        rows = {
            "UC1": {
                "id": "UC1",
                "snippet": {"title": "Canal Mexico Uno", "country": "MX"},
                "statistics": {"subscriberCount": "50000", "viewCount": "100", "videoCount": "10"},
            },
            "UC2": {
                "id": "UC2",
                "snippet": {"title": "Canal Mexico Dos", "country": "Mexico"},
                "statistics": {"subscriberCount": "60000", "viewCount": "200", "videoCount": "20"},
            },
            "UC3": {
                "id": "UC3",
                "snippet": {"title": "Canal Mexico USA", "country": "US"},
                "statistics": {"subscriberCount": "70000", "viewCount": "300", "videoCount": "30"},
            },
        }
        return [rows[channel_id] for channel_id in channel_ids if channel_id in rows]


def test_run_crawl_with_mocked_clients(tmp_path: Path) -> None:
    summary = run_crawl(
        out_dir=tmp_path,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        target_rows=2,
        candidate_target=0,
        discovery_only=False,
        strict_country=True,
        resume=False,
        query_limit=0,
        max_pages_per_query=1,
        search_workers=1,
        about_workers=1,
        sleep_seconds=0,
        collect_contact=False,
        allow_about_only=False,
        api_key="",
        search_client=FakeSearchClient(),
        api_client=FakeChannelApiClient(),
        queries=["mexico youtuber"],
    )

    assert summary["accepted_rows"] == 2
    assert summary["target_met"] is True
    df = pd.read_csv(tmp_path / "youtube_mexico_10k_1000k_channels.csv")
    assert list(df["频道ID"]) == ["UC2", "UC1"]
    rejected = pd.read_csv(tmp_path / "rejected_channels.csv")
    assert rejected.loc[0, "拒绝原因"] == "not_mexico_country"


def test_run_crawl_relaxed_country_keeps_unconfirmed_after_strict_rows(tmp_path: Path) -> None:
    summary = run_crawl(
        out_dir=tmp_path,
        min_subscribers=10_000,
        max_subscribers=500_000,
        target_rows=3,
        candidate_target=0,
        discovery_only=False,
        strict_country=False,
        resume=False,
        query_limit=0,
        max_pages_per_query=1,
        search_workers=1,
        about_workers=1,
        sleep_seconds=0,
        collect_contact=False,
        allow_about_only=False,
        api_key="",
        search_client=FakeSearchClient(),
        api_client=FakeChannelApiClient(),
        queries=["mexico youtuber"],
    )

    assert summary["accepted_rows"] == 3
    assert summary["strict_mexico_channels"] == 2
    df = pd.read_csv(tmp_path / "youtube_mexico_10k_500k_channels.csv")
    assert list(df["是否严格墨西哥"]) == ["是", "是", "否"]
    assert df.iloc[-1]["国家"] == "US"


def test_run_crawl_requires_api_key_before_creating_state(tmp_path: Path) -> None:
    out_dir = tmp_path / "missing_key"

    with pytest.raises(SystemExit, match="YOUTUBE_API_KEY is required"):
        run_crawl(
            out_dir=out_dir,
            min_subscribers=10_000,
            max_subscribers=1_000_000,
            target_rows=1,
            candidate_target=0,
            discovery_only=False,
            strict_country=True,
            resume=False,
            query_limit=1,
            max_pages_per_query=1,
            search_workers=1,
            about_workers=1,
            sleep_seconds=0,
            collect_contact=False,
            allow_about_only=False,
            api_key="",
        )

    assert not out_dir.exists()


def test_run_crawl_discovery_only_exports_candidate_ids_without_api_key(tmp_path: Path) -> None:
    summary = run_crawl(
        out_dir=tmp_path,
        min_subscribers=10_000,
        max_subscribers=1_000_000,
        target_rows=20,
        candidate_target=2,
        discovery_only=True,
        strict_country=True,
        resume=False,
        query_limit=0,
        max_pages_per_query=1,
        search_workers=1,
        about_workers=1,
        sleep_seconds=0,
        collect_contact=False,
        allow_about_only=False,
        api_key="",
        search_client=FakeSearchClient(),
        queries=["mexico youtuber"],
    )

    assert summary["discovery_only"] is True
    assert summary["candidates"] == 3
    assert summary["target_met"] is True
    assert not (tmp_path / "youtube_mexico_10k_1000k_channels.csv").exists()
    candidates = pd.read_csv(tmp_path / "youtube_mexico_candidate_ids.csv")
    assert set(candidates["频道ID"]) == {"UC1", "UC2", "UC3"}


def test_discover_candidates_for_query_filters_non_mexico_results() -> None:
    class OnePageSearch:
        client_version = "fake"

        def bootstrap(self) -> None:
            pass

        def search_page(self, query: str) -> dict[str, Any]:
            return {
                "contents": [
                    channel_renderer("UC1", "Travel Mexico", description="Guadalajara vlog"),
                    channel_renderer("UC2", "Travel New Mexico", description="Albuquerque"),
                ]
            }

        def video_search_page(self, query: str) -> dict[str, Any]:
            return {"contents": [video_renderer("UC3", "Mexico Video Owner")]}

        def continuation_page(self, token: str) -> dict[str, Any]:
            raise AssertionError("no continuation expected")

    rows, pages_done = discover_candidates_for_query(
        OnePageSearch(),
        "travel vlog",
        max_pages=1,
        sleep_seconds=0,
        scraped_at="2026-06-24T00:00:00Z",
    )

    assert pages_done == 2
    assert [row.channel_id for row in rows] == ["UC1", "UC3"]
