from pathlib import Path

import pandas as pd

from src.boss_parser import (
    BOSS_OUTPUT_COLUMNS,
    enrich_boss_candidate,
    export_boss_candidates,
    parse_boss_candidate_cards,
    parse_boss_detail_text,
    score_candidate_text,
)


FIXTURE_DIR = Path(__file__).parent / "fixtures"


def read_fixture(name: str) -> str:
    return (FIXTURE_DIR / name).read_text(encoding="utf-8")


def test_parse_boss_candidate_cards_extracts_card_fields() -> None:
    records = parse_boss_candidate_cards(
        read_fixture("boss_recommend_sample.html"),
        source_url="https://www.zhipin.com/web/chat/recommend",
        scraped_at="2026-06-18T00:00:00+00:00",
    )

    assert len(records) == 2
    first = records[0]
    assert first.name == "吴璐瑜"
    assert first.age == "23岁"
    assert first.experience == "2年"
    assert first.education == "本科"
    assert first.expected_city == "深圳"
    assert first.expected_position == "商务拓展BD"
    assert first.expected_salary == "5-7K"
    assert first.current_status == "刚刚活跃"
    assert first.detail_url == "https://www.zhipin.com/web/geek/detail?securityId=abc"
    assert "海外" in first.matched_keywords
    assert "KOL" in first.matched_keywords
    assert "BD" in first.matched_keywords


def test_boss_keyword_scoring_is_case_insensitive_and_boundary_aware() -> None:
    score, keywords, snippets = score_candidate_text(
        "负责 overseas KOL、koc、BD、FB/Facebook、Instagram 和 google 媒介建联。"
    )

    assert score > 0
    assert keywords == ["KOL", "KOC", "BD", "媒介", "建联", "FB", "Facebook", "google", "Instagram"]
    assert snippets


def test_enrich_boss_candidate_scores_full_detail_text() -> None:
    [record] = parse_boss_candidate_cards(
        """
        <div class="recommend-card">
          <a href="/web/geek/detail?securityId=abc">候选人</a>
          <span>25岁 本科 期望 深圳 · 运营 · 8-10K</span>
        </div>
        """,
        source_url="https://www.zhipin.com/web/chat/recommend",
        scraped_at="2026-06-18T00:00:00+00:00",
    )

    detail_text = parse_boss_detail_text(read_fixture("boss_detail_sample.html"))
    enriched = enrich_boss_candidate(record, detail_text)

    assert enriched.recommended_score > record.recommended_score
    assert "Facebook" in enriched.matched_keywords
    assert "完整简历" in enriched.full_detail_text


def test_export_boss_candidates_writes_expected_columns(tmp_path: Path) -> None:
    records = parse_boss_candidate_cards(
        read_fixture("boss_recommend_sample.html"),
        source_url="https://www.zhipin.com/web/chat/recommend",
        scraped_at="2026-06-18T00:00:00+00:00",
    )
    enriched = [
        enrich_boss_candidate(records[0], parse_boss_detail_text(read_fixture("boss_detail_sample.html"))),
        enrich_boss_candidate(records[1], records[1].raw_card_text),
    ]

    csv_path, xlsx_path = export_boss_candidates(enriched, tmp_path / "boss_candidates")

    assert csv_path.exists()
    assert xlsx_path.exists()
    assert list(pd.read_csv(csv_path).columns) == BOSS_OUTPUT_COLUMNS
    assert list(pd.read_excel(xlsx_path).columns) == BOSS_OUTPUT_COLUMNS
    assert pd.read_excel(xlsx_path).iloc[0]["姓名"] == "吴璐瑜"
