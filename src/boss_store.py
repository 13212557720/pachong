from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Literal

from .boss_parser import BossCandidateRecord


BossStoredAction = Literal["greet", "ask_missing_info", "skip", "review_needed"]


@dataclass
class BossStoredCandidate:
    key: str
    name: str
    age: str
    expected_position: str
    detail_url: str
    actions: set[BossStoredAction] = field(default_factory=set)


class InMemoryBossCandidateStore:
    def __init__(self) -> None:
        self._candidates: Dict[str, BossStoredCandidate] = {}

    def candidate_key(self, candidate: BossCandidateRecord) -> str:
        if candidate.detail_url:
            return f"url:{candidate.detail_url}"
        fingerprint = "|".join(
            [
                candidate.name.strip(),
                candidate.age.strip(),
                candidate.expected_city.strip(),
                candidate.expected_position.strip(),
                candidate.expected_salary.strip(),
            ]
        )
        return f"fingerprint:{fingerprint}"

    def upsert_candidate(self, candidate: BossCandidateRecord) -> BossStoredCandidate:
        key = self.candidate_key(candidate)
        existing = self._candidates.get(key)
        if existing is not None:
            return existing

        stored = BossStoredCandidate(
            key=key,
            name=candidate.name,
            age=candidate.age,
            expected_position=candidate.expected_position,
            detail_url=candidate.detail_url,
        )
        self._candidates[key] = stored
        return stored

    def record_action(self, candidate: BossCandidateRecord, action: BossStoredAction) -> None:
        stored = self.upsert_candidate(candidate)
        stored.actions.add(action)

    def has_action(self, candidate: BossCandidateRecord, action: BossStoredAction) -> bool:
        stored = self._candidates.get(self.candidate_key(candidate))
        return bool(stored and action in stored.actions)

    def can_greet(self, candidate: BossCandidateRecord) -> bool:
        return not self.has_action(candidate, "greet")

    def can_request_missing_info(self, candidate: BossCandidateRecord) -> bool:
        return not self.has_action(candidate, "ask_missing_info")

    def __len__(self) -> int:
        return len(self._candidates)
