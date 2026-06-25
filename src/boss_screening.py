from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal, Sequence

from .boss_parser import BossCandidateRecord, score_candidate_text


BossCandidateStatus = Literal["qualified", "needs_info", "rejected"]
BossRecommendedAction = Literal["greet", "ask_missing_info", "skip", "review_needed"]

FIELD_CITY = "city"
FIELD_AGE = "age"
FIELD_EXPERIENCE = "experience"
FIELD_WORK_STATUS = "work_status"


@dataclass(frozen=True)
class BossScreeningRule:
    min_keyword_count: int = 3
    required_city: str = "深圳"
    min_age: int = 21
    max_age: int = 32
    min_experience_months_exclusive: int = 3


@dataclass(frozen=True)
class BossScreeningResult:
    status: BossCandidateStatus
    recommended_action: BossRecommendedAction
    keyword_count: int
    matched_keywords: list[str]
    missing_fields: list[str] = field(default_factory=list)
    reject_reasons: list[str] = field(default_factory=list)

    @property
    def is_actionable(self) -> bool:
        return self.recommended_action in {"greet", "ask_missing_info"}


def screen_candidate(
    candidate: BossCandidateRecord,
    rule: BossScreeningRule | None = None,
) -> BossScreeningResult:
    active_rule = rule or BossScreeningRule()
    screening_text = _candidate_text(candidate)
    _, matched_keywords, _ = score_candidate_text(screening_text)

    reject_reasons: list[str] = []
    missing_fields: list[str] = []

    if len(matched_keywords) < active_rule.min_keyword_count:
        reject_reasons.append(
            f"keyword_count<{active_rule.min_keyword_count}"
        )
        return BossScreeningResult(
            status="rejected",
            recommended_action="skip",
            keyword_count=len(matched_keywords),
            matched_keywords=matched_keywords,
            reject_reasons=reject_reasons,
        )

    city = (candidate.expected_city or "").strip()
    if not city:
        missing_fields.append(FIELD_CITY)
    elif active_rule.required_city not in city:
        reject_reasons.append(f"city_not_{active_rule.required_city}")

    age = parse_age(candidate.age)
    if age is None:
        missing_fields.append(FIELD_AGE)
    elif not active_rule.min_age <= age <= active_rule.max_age:
        reject_reasons.append(
            f"age_not_{active_rule.min_age}_{active_rule.max_age}"
        )

    experience_months = parse_experience_months(candidate.experience)
    if experience_months is None:
        missing_fields.append(FIELD_EXPERIENCE)
    elif experience_months <= active_rule.min_experience_months_exclusive:
        reject_reasons.append("experience_lte_3_months")

    work_status = detect_work_status(candidate)
    if work_status == "current":
        reject_reasons.append("work_status_current")
    elif work_status == "unknown":
        missing_fields.append(FIELD_WORK_STATUS)

    if reject_reasons:
        return BossScreeningResult(
            status="rejected",
            recommended_action="skip",
            keyword_count=len(matched_keywords),
            matched_keywords=matched_keywords,
            missing_fields=missing_fields,
            reject_reasons=reject_reasons,
        )

    if missing_fields:
        return BossScreeningResult(
            status="needs_info",
            recommended_action="ask_missing_info",
            keyword_count=len(matched_keywords),
            matched_keywords=matched_keywords,
            missing_fields=_dedupe(missing_fields),
        )

    return BossScreeningResult(
        status="qualified",
        recommended_action="greet",
        keyword_count=len(matched_keywords),
        matched_keywords=matched_keywords,
    )


def parse_age(value: str) -> int | None:
    match = re.search(r"(\d{1,2})\s*岁", value or "")
    return int(match.group(1)) if match else None


def parse_experience_months(value: str) -> int | None:
    text = (value or "").strip()
    if not text:
        return None
    if "经验不限" in text or "在校生" in text or "刚毕业" in text:
        return None
    if re.search(r"\d{2}\s*年应届生", text):
        return None

    year_match = re.search(r"(\d+)\s*年", text)
    if year_match:
        return int(year_match.group(1)) * 12

    month_match = re.search(r"(\d+)\s*个?月", text)
    if month_match:
        return int(month_match.group(1))

    return None


def detect_work_status(candidate: BossCandidateRecord) -> Literal["available", "current", "unknown"]:
    text = _candidate_text(candidate)
    current_patterns = [
        "在职-考虑机会",
        "在职-月内到岗",
        "在职-暂不考虑",
        "在职考虑机会",
        "在职月内到岗",
        "在职暂不考虑",
    ]
    if any(pattern in text for pattern in current_patterns):
        return "current"

    available_patterns = [
        "离职-随时到岗",
        "离职-月内到岗",
        "离职随时到岗",
        "离职月内到岗",
        "随时到岗",
        "月内到岗",
    ]
    if any(pattern in text for pattern in available_patterns):
        return "available"

    return "unknown"


def _candidate_text(candidate: BossCandidateRecord) -> str:
    return "\n".join(
        part
        for part in [
            candidate.name,
            candidate.expected_city,
            candidate.expected_position,
            candidate.current_status,
            candidate.raw_card_text,
            candidate.full_detail_text,
        ]
        if part
    )


def _dedupe(values: Sequence[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result
