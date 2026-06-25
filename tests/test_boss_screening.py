from src.boss_message_templates import build_missing_info_message
from src.boss_parser import BossCandidateRecord
from src.boss_screening import (
    FIELD_AGE,
    FIELD_CITY,
    FIELD_EXPERIENCE,
    FIELD_WORK_STATUS,
    detect_work_status,
    parse_experience_months,
    screen_candidate,
)
from src.boss_store import InMemoryBossCandidateStore


def make_candidate(**overrides) -> BossCandidateRecord:
    values = {
        "recommended_score": 0,
        "matched_keywords": [],
        "match_snippets": [],
        "name": "田中",
        "age": "23岁",
        "experience": "2年",
        "education": "本科",
        "expected_city": "深圳",
        "expected_position": "海外市场",
        "expected_salary": "10-14K",
        "current_status": "离职-随时到岗",
        "detail_url": "https://www.zhipin.com/web/geek/detail?securityId=abc",
        "full_detail_text": "",
        "scraped_at": "2026-06-18T00:00:00+00:00",
        "source_url": "https://www.zhipin.com/web/chat/recommend",
        "raw_card_text": (
            "拥有海外 KOL 达人 BD 实操经验，熟悉 Instagram Facebook 建联，"
            "23岁 2年 本科 离职-随时到岗 期望 深圳 海外市场"
        ),
    }
    values.update(overrides)
    return BossCandidateRecord(**values)


def test_rejects_candidate_with_less_than_three_keywords() -> None:
    result = screen_candidate(
        make_candidate(raw_card_text="负责海外市场推广，23岁 2年 离职-随时到岗 期望 深圳")
    )

    assert result.status == "rejected"
    assert result.recommended_action == "skip"
    assert result.keyword_count == 1
    assert result.reject_reasons == ["keyword_count<3"]


def test_accepts_three_or_more_keywords_for_hard_condition_screening() -> None:
    result = screen_candidate(make_candidate())

    assert result.status == "qualified"
    assert result.recommended_action == "greet"
    assert result.keyword_count >= 3
    assert result.missing_fields == []
    assert result.reject_reasons == []


def test_keyword_matching_is_case_insensitive_and_bd_is_boundary_aware() -> None:
    good = screen_candidate(
        make_candidate(
            raw_card_text=(
                "熟悉 koc KOL BD FB Facebook google Instagram ins ig 媒介建联，"
                "23岁 2年 离职-随时到岗 期望 深圳"
            )
        )
    )
    bad = screen_candidate(
        make_candidate(
            raw_card_text=(
                "熟悉 Adobe 品牌设计和 overseas 内容，23岁 2年 离职-随时到岗 期望 深圳"
            )
        )
    )

    assert {"KOC", "KOL", "BD", "FB", "Facebook", "google", "Instagram", "媒介", "建联"}.issubset(
        set(good.matched_keywords)
    )
    assert "BD" not in bad.matched_keywords
    assert bad.status == "rejected"


def test_hard_conditions_reject_non_shenzhen_age_experience_and_current_status() -> None:
    assert screen_candidate(make_candidate(expected_city="广州")).reject_reasons == ["city_not_深圳"]
    assert screen_candidate(make_candidate(age="20岁")).reject_reasons == ["age_not_21_32"]
    assert screen_candidate(make_candidate(experience="3个月")).reject_reasons == ["experience_lte_3_months"]

    current = screen_candidate(
        make_candidate(current_status="在职-考虑机会", raw_card_text="海外 KOL BD 在职-考虑机会 23岁 2年 期望 深圳")
    )
    assert current.status == "rejected"
    assert "work_status_current" in current.reject_reasons


def test_missing_hard_condition_fields_need_info() -> None:
    result = screen_candidate(
        make_candidate(
            age="",
            experience="",
            expected_city="",
            current_status="刚刚活跃",
            raw_card_text="海外 KOL BD Facebook，刚刚活跃",
        )
    )

    assert result.status == "needs_info"
    assert result.recommended_action == "ask_missing_info"
    assert result.missing_fields == [
        FIELD_CITY,
        FIELD_AGE,
        FIELD_EXPERIENCE,
        FIELD_WORK_STATUS,
    ]


def test_available_and_current_work_status_detection_uses_full_candidate_text() -> None:
    assert detect_work_status(make_candidate(current_status="离职-月内到岗")) == "available"
    assert detect_work_status(make_candidate(current_status="在职-月内到岗")) == "current"
    assert (
        detect_work_status(
            make_candidate(current_status="刚刚活跃", raw_card_text="海外 KOL BD 23岁 2年 期望 深圳 离职-随时到岗")
        )
        == "available"
    )


def test_experience_month_parsing() -> None:
    assert parse_experience_months("4个月") == 4
    assert parse_experience_months("2年") == 24
    assert parse_experience_months("10年以上") == 120
    assert parse_experience_months("26年应届生") is None


def test_missing_info_message_generation() -> None:
    assert "深圳" in build_missing_info_message([FIELD_CITY])
    assert "离职" in build_missing_info_message([FIELD_WORK_STATUS])

    merged = build_missing_info_message([FIELD_CITY, FIELD_WORK_STATUS, FIELD_EXPERIENCE])
    assert merged is not None
    assert "目前是否在深圳" in merged
    assert "是否已离职" in merged
    assert "经验大概多久" in merged
    assert build_missing_info_message([FIELD_CITY], already_requested=True) is None


def test_store_prevents_duplicate_greeting_and_missing_info_request() -> None:
    store = InMemoryBossCandidateStore()
    candidate = make_candidate()
    same_candidate = make_candidate(name="田中", detail_url=candidate.detail_url)

    assert store.can_greet(candidate)
    store.record_action(candidate, "greet")
    assert not store.can_greet(same_candidate)

    assert store.can_request_missing_info(candidate)
    store.record_action(candidate, "ask_missing_info")
    assert not store.can_request_missing_info(same_candidate)
    assert len(store) == 1
