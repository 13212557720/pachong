from __future__ import annotations

from collections.abc import Iterable

from .boss_screening import (
    FIELD_AGE,
    FIELD_CITY,
    FIELD_EXPERIENCE,
    FIELD_WORK_STATUS,
)


FIELD_QUESTIONS = {
    FIELD_CITY: "您目前是在深圳吗？后续可以在深圳全职办公吗？",
    FIELD_WORK_STATUS: "想确认下您目前是离职状态，还是在职看机会呢？",
    FIELD_EXPERIENCE: "想确认下您海外推广/KOL达人合作相关经验大概做了多久？",
    FIELD_AGE: "方便确认下您的年龄吗？我们这边岗位目前比较匹配 21-32 岁候选人。",
}


def build_missing_info_message(
    missing_fields: Iterable[str],
    *,
    already_requested: bool = False,
) -> str | None:
    if already_requested:
        return None

    ordered_fields = _ordered_missing_fields(missing_fields)
    if not ordered_fields:
        return None
    if len(ordered_fields) == 1:
        return f"您好，看您经历和我们海外推广岗位比较匹配，{FIELD_QUESTIONS[ordered_fields[0]]}"

    parts: list[str] = []
    if FIELD_CITY in ordered_fields:
        parts.append("目前是否在深圳")
    if FIELD_WORK_STATUS in ordered_fields:
        parts.append("是否已离职")
    if FIELD_EXPERIENCE in ordered_fields:
        parts.append("海外推广/KOL达人合作相关经验大概多久")
    if FIELD_AGE in ordered_fields:
        parts.append("年龄是否在 21-32 岁区间")

    return (
        "您好，看您经历和我们海外推广岗位比较匹配，想确认下"
        + "、".join(parts)
        + "？"
    )


def _ordered_missing_fields(missing_fields: Iterable[str]) -> list[str]:
    wanted_order = [FIELD_CITY, FIELD_WORK_STATUS, FIELD_EXPERIENCE, FIELD_AGE]
    given = set(missing_fields)
    return [field for field in wanted_order if field in given]
