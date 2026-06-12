from pathlib import Path

import pandas as pd

from src.exporter import CHINESE_COLUMNS, export_platform_records, export_records
from src.models import CreatorRecord


def make_record(platform: str = "youtube") -> CreatorRecord:
    return CreatorRecord(
        platform=platform,
        country="mexico",
        rank=1,
        name="Creator",
        handle="creator",
        follower_count=300_000,
        subscriber_count=300_000 if platform == "youtube" else 0,
        view_count=1_000_000,
        video_count=120,
        category="Education",
        profile_url="https://example.test/creator",
        source_url="https://example.test/rank",
        source_name="Example",
        scraped_at="2026-06-10T00:00:00+00:00",
        description="",
    )


def test_export_records_writes_chinese_headers(tmp_path: Path) -> None:
    csv_path, xlsx_path = export_records([make_record()], str(tmp_path / "creators"))

    assert csv_path.exists()
    assert xlsx_path.exists()
    csv_columns = list(pd.read_csv(csv_path).columns)
    xlsx_columns = list(pd.read_excel(xlsx_path).columns)
    assert csv_columns == list(CHINESE_COLUMNS.values())
    assert xlsx_columns == list(CHINESE_COLUMNS.values())
    assert "channel_name" not in csv_columns
    assert "name" not in csv_columns
    assert "platform_user_id" not in csv_columns
    assert "平台用户ID" in csv_columns
    assert "IP属地" in csv_columns
    assert "采集方式" in csv_columns
    assert "结果类型" in csv_columns
    assert "好友数" in csv_columns
    assert "邮箱" in csv_columns
    assert "来源关键词" in csv_columns
    assert "原始文本" in csv_columns
    assert "信息完整度评分" in csv_columns
    assert pd.read_excel(xlsx_path).iloc[0]["名称"] == "Creator"


def test_export_platform_records_writes_one_file_per_platform(tmp_path: Path) -> None:
    outputs = export_platform_records(
        {
            "youtube": [make_record("youtube")],
            "instagram": [make_record("instagram")],
        },
        tmp_path,
        country_by_platform={"youtube": "mexico", "instagram": "mexico"},
    )

    assert set(outputs) == {"youtube", "instagram"}
    assert outputs["youtube"][0].name == "youtube_mexico_hot.csv"
    assert outputs["instagram"][1].name == "instagram_mexico_hot.xlsx"
    assert outputs["youtube"][0].exists()
    assert outputs["instagram"][1].exists()
