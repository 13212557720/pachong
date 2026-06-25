from __future__ import annotations

import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterable, List, Sequence
from urllib.parse import urljoin

import pandas as pd
from bs4 import BeautifulSoup


BOSS_RECOMMEND_URL = "https://www.zhipin.com/web/chat/recommend"

BOSS_OUTPUT_COLUMNS = [
    "推荐分",
    "命中关键词",
    "命中片段",
    "姓名",
    "年龄",
    "经验",
    "学历",
    "期望城市",
    "期望岗位",
    "薪资期望",
    "当前状态",
    "详情链接",
    "完整详情文本",
    "采集时间",
    "来源页",
]


@dataclass
class KeywordSpec:
    label: str
    weight: int
    pattern: re.Pattern[str]


KEYWORD_SPECS: Sequence[KeywordSpec] = (
    KeywordSpec("海外", 5, re.compile("海外", re.I)),
    KeywordSpec("KOL", 5, re.compile(r"(?<![A-Za-z])kol(?![A-Za-z])", re.I)),
    KeywordSpec("KOC", 5, re.compile(r"(?<![A-Za-z])koc(?![A-Za-z])", re.I)),
    KeywordSpec("BD", 5, re.compile(r"(?<![A-Za-z])bd(?![A-Za-z])", re.I)),
    KeywordSpec("媒介", 5, re.compile("媒介", re.I)),
    KeywordSpec("博主", 3, re.compile("博主", re.I)),
    KeywordSpec("达人", 3, re.compile("达人", re.I)),
    KeywordSpec("建联", 3, re.compile("建联", re.I)),
    KeywordSpec("红人", 3, re.compile("红人", re.I)),
    KeywordSpec("FB", 5, re.compile(r"(?<![A-Za-z])fb(?![A-Za-z])", re.I)),
    KeywordSpec("Facebook", 5, re.compile(r"facebook", re.I)),
    KeywordSpec("google", 5, re.compile(r"google", re.I)),
    KeywordSpec("Instagram", 5, re.compile(r"instagram|ins\b|ig\b", re.I)),
)


@dataclass
class BossCandidateRecord:
    recommended_score: int
    matched_keywords: List[str]
    match_snippets: List[str]
    name: str
    age: str
    experience: str
    education: str
    expected_city: str
    expected_position: str
    expected_salary: str
    current_status: str
    detail_url: str
    full_detail_text: str
    scraped_at: str
    source_url: str
    raw_card_text: str = ""

    def to_export_row(self) -> dict[str, object]:
        return {
            "推荐分": self.recommended_score,
            "命中关键词": "、".join(self.matched_keywords),
            "命中片段": "\n".join(self.match_snippets),
            "姓名": self.name,
            "年龄": self.age,
            "经验": self.experience,
            "学历": self.education,
            "期望城市": self.expected_city,
            "期望岗位": self.expected_position,
            "薪资期望": self.expected_salary,
            "当前状态": self.current_status,
            "详情链接": self.detail_url,
            "完整详情文本": self.full_detail_text,
            "采集时间": self.scraped_at,
            "来源页": self.source_url,
        }


def score_candidate_text(text: str) -> tuple[int, List[str], List[str]]:
    normalized = _normalize_spaces(text)
    matched: List[str] = []
    score = 0

    for spec in KEYWORD_SPECS:
        hits = list(spec.pattern.finditer(normalized))
        if not hits:
            continue
        matched.append(spec.label)
        score += spec.weight + min(len(hits) - 1, 3)

    if matched:
        score += len(matched) * 2

    return score, matched, _keyword_snippets(normalized, matched)


def parse_boss_candidate_cards(
    html: str,
    *,
    source_url: str = BOSS_RECOMMEND_URL,
    scraped_at: str,
) -> List[BossCandidateRecord]:
    soup = BeautifulSoup(html, "lxml")
    cards = _candidate_blocks(soup)
    records: List[BossCandidateRecord] = []
    seen_keys: set[str] = set()

    for card in cards:
        card_text = _normalize_spaces(card.get_text(" ", strip=True))
        if len(card_text) < 8:
            continue

        detail_url = _first_boss_detail_url(card, source_url)
        name = _extract_name(card, card_text)
        if not name:
            continue

        seen_key = detail_url or f"{name}:{card_text[:80]}"
        if seen_key in seen_keys:
            continue
        seen_keys.add(seen_key)

        score, matched, snippets = score_candidate_text(card_text)
        records.append(
            BossCandidateRecord(
                recommended_score=score,
                matched_keywords=matched,
                match_snippets=snippets,
                name=name,
                age=_first_match(card_text, r"(\d{2}\s*岁)"),
                experience=_extract_experience(card_text),
                education=_first_match(
                    card_text,
                    r"(博士|硕士|研究生|本科|大专|中专|高中|初中|学历不限)",
                ),
                expected_city=_extract_expected_city(card_text),
                expected_position=_extract_expected_position(card_text),
                expected_salary=_first_match(
                    card_text,
                    r"(\d+\s*-\s*\d+\s*[Kk]|薪资面议|面议)",
                ),
                current_status=_extract_status(card_text),
                detail_url=detail_url,
                full_detail_text="",
                scraped_at=scraped_at,
                source_url=source_url,
                raw_card_text=card_text,
            )
        )

    return records


def parse_boss_detail_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    body = soup.body or soup
    return _normalize_spaces(body.get_text("\n", strip=True))


def enrich_boss_candidate(record: BossCandidateRecord, detail_text: str) -> BossCandidateRecord:
    full_detail_text = _normalize_spaces(detail_text) or record.raw_card_text
    scoring_text = "\n".join([record.raw_card_text, full_detail_text])
    score, matched, snippets = score_candidate_text(scoring_text)

    return replace(
        record,
        recommended_score=score,
        matched_keywords=matched,
        match_snippets=snippets,
        full_detail_text=full_detail_text,
        expected_city=record.expected_city or _extract_expected_city(full_detail_text),
        expected_position=record.expected_position or _extract_expected_position(full_detail_text),
        expected_salary=record.expected_salary
        or _first_match(full_detail_text, r"(\d+\s*-\s*\d+\s*[Kk]|薪资面议|面议)"),
        current_status=record.current_status or _extract_status(full_detail_text),
    )


def boss_candidates_to_dataframe(records: Iterable[BossCandidateRecord]) -> pd.DataFrame:
    sorted_records = sorted(
        records,
        key=lambda record: (-record.recommended_score, record.name, record.detail_url),
    )
    rows = [record.to_export_row() for record in sorted_records]
    return pd.DataFrame(rows, columns=BOSS_OUTPUT_COLUMNS)


def export_boss_candidates(
    records: Iterable[BossCandidateRecord],
    output_base: str | Path,
) -> tuple[Path, Path]:
    output_path = Path(output_base)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df = boss_candidates_to_dataframe(records)

    csv_path = output_path.with_suffix(".csv")
    xlsx_path = output_path.with_suffix(".xlsx")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)
    return csv_path, xlsx_path


def _candidate_blocks(soup: BeautifulSoup) -> List:
    selectors = [
        '[data-testid="boss-candidate-card"]',
        ".boss-candidate-card",
        ".recommend-card",
        ".geek-card",
        '[class*="recommend"] li',
        '[class*="geek"] li',
        '[class*="card"]',
        "li",
    ]
    blocks: List = []
    seen: set[int] = set()
    for selector in selectors:
        for element in soup.select(selector):
            element_id = id(element)
            if element_id in seen:
                continue
            text = _normalize_spaces(element.get_text(" ", strip=True))
            if _looks_like_candidate_text(text):
                seen.add(element_id)
                blocks.append(element)
    return blocks


def _looks_like_candidate_text(text: str) -> bool:
    if len(text) < 8:
        return False
    hints = [
        "岁",
        "年",
        "本科",
        "大专",
        "硕士",
        "博士",
        "期望",
        "优势",
        "活跃",
        "K",
        "k",
    ]
    return any(hint in text for hint in hints)


def _first_boss_detail_url(card, source_url: str) -> str:
    for anchor in card.select("a[href]"):
        href = (anchor.get("href") or "").strip()
        if not href or href.startswith("javascript:"):
            continue
        absolute = urljoin(source_url, href)
        if "zhipin.com" in absolute or href.startswith("/"):
            return absolute
    return ""


def _extract_name(card, text: str) -> str:
    for selector in [
        '[class*="name"]',
        '[class*="geek-name"]',
        '[class*="candidate-name"]',
    ]:
        tag = card.select_one(selector)
        if tag:
            candidate = _clean_name(tag.get_text(" ", strip=True))
            if candidate:
                return candidate

    for line in _text_lines(text):
        candidate = _clean_name(line)
        if candidate:
            return candidate
    return ""


def _clean_name(value: str) -> str:
    value = re.split(r"\s+", value.strip())[0]
    value = re.sub(r"[^\w\u4e00-\u9fff·.-]", "", value)
    if not 1 <= len(value) <= 20:
        return ""
    banned_tokens = ["推荐", "精选", "最新", "期望", "优势", "活跃", "沟通", "职位"]
    if any(token in value for token in banned_tokens):
        return ""
    if re.search(r"\d", value):
        return ""
    return value


def _extract_experience(text: str) -> str:
    patterns = [
        r"(\d+\s*年(?:以上)?(?:工作)?经验)",
        r"(\d+\s*年)",
        r"(经验不限|应届生|在校生|刚毕业)",
    ]
    for pattern in patterns:
        value = _first_match(text, pattern)
        if value and "岁" not in value:
            return value
    return ""


def _extract_expected_city(text: str) -> str:
    patterns = [
        r"期望\s*([^\s·|/，,]+)",
        r"期望城市[:：]?\s*([^\s·|/，,]+)",
        r"求职城市[:：]?\s*([^\s·|/，,]+)",
    ]
    for pattern in patterns:
        value = _first_match(text, pattern)
        if value:
            return value
    return ""


def _extract_expected_position(text: str) -> str:
    patterns = [
        r"期望\s*[^\s·|/，,]+\s*[·|/]\s*([^\s·|/，,]+)",
        r"期望职位[:：]?\s*([^\s·|/，,]+)",
        r"求职意向[:：]?\s*([^\s·|/，,]+)",
    ]
    for pattern in patterns:
        value = _first_match(text, pattern)
        if value:
            return value
    return ""


def _extract_status(text: str) -> str:
    patterns = [
        r"(刚刚活跃|今日活跃|本周活跃|在线)",
        r"(离职-?随时到岗|随时到岗|月内到岗|在职-?考虑机会)",
    ]
    for pattern in patterns:
        value = _first_match(text, pattern)
        if value:
            return value
    return ""


def _first_match(text: str, pattern: str) -> str:
    match = re.search(pattern, text, re.I)
    return match.group(1).strip() if match else ""


def _keyword_snippets(text: str, matched_keywords: Sequence[str], limit: int = 3) -> List[str]:
    if not matched_keywords:
        return []

    snippets: List[str] = []
    sentences = re.split(r"(?<=[。！？!?；;])|\n|(?<=\s{2})", text)
    for sentence in sentences:
        sentence = _normalize_spaces(sentence)
        if not sentence:
            continue
        if any(_keyword_present(keyword, sentence) for keyword in matched_keywords):
            snippets.append(_truncate(sentence, 120))
        if len(snippets) >= limit:
            break

    if snippets:
        return snippets

    lowered = text.lower()
    for keyword in matched_keywords:
        index = lowered.find(keyword.lower())
        if index < 0:
            continue
        start = max(0, index - 45)
        end = min(len(text), index + len(keyword) + 45)
        snippets.append(_truncate(text[start:end], 120))
        if len(snippets) >= limit:
            break
    return snippets


def _keyword_present(keyword: str, text: str) -> bool:
    for spec in KEYWORD_SPECS:
        if spec.label == keyword:
            return bool(spec.pattern.search(text))
    return keyword.lower() in text.lower()


def _text_lines(text: str) -> List[str]:
    return [line.strip() for line in re.split(r"[\n\r]+|\s{2,}", text) if line.strip()]


def _normalize_spaces(text: str) -> str:
    text = re.sub(r"[\u200b\xa0]+", " ", text or "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "..."
