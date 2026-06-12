from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, List, Mapping, Tuple

import pandas as pd

from .models import CreatorRecord


CHINESE_COLUMNS = {
    "platform": "平台",
    "country": "国家/地区",
    "rank": "排名",
    "result_type": "结果类型",
    "name": "名称",
    "handle": "账号",
    "platform_user_id": "平台用户ID",
    "follower_count": "粉丝数",
    "friend_count": "好友数",
    "subscriber_count": "订阅数",
    "view_count": "观看量",
    "video_count": "视频数",
    "category": "分类",
    "profile_url": "主页链接",
    "location": "所在地/地址",
    "work_school": "工作/学校",
    "email": "邮箱",
    "source_query": "来源关键词",
    "source_url": "来源链接",
    "source_name": "数据来源",
    "source_mode": "采集方式",
    "info_score": "信息完整度评分",
    "ip_location": "IP属地",
    "is_verified": "是否认证",
    "is_private": "是否私密",
    "scraped_at": "采集时间",
    "description": "简介",
    "raw_text": "原始文本",
    "raw_json": "原始数据",
}

OUTPUT_COLUMNS = list(CHINESE_COLUMNS)


def records_to_dataframe(records: Iterable[CreatorRecord]) -> pd.DataFrame:
    rows = [record.to_dict() for record in records]
    df = pd.DataFrame(rows, columns=OUTPUT_COLUMNS)
    return df.rename(columns=CHINESE_COLUMNS)


def export_records(records: Iterable[CreatorRecord], output_base: str) -> Tuple[Path, Path]:
    output_path = Path(output_base)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df = records_to_dataframe(records)

    csv_path = output_path.with_suffix(".csv")
    xlsx_path = output_path.with_suffix(".xlsx")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)
    return csv_path, xlsx_path


def export_platform_records(
    records_by_platform: Mapping[str, Iterable[CreatorRecord]],
    output_dir: Path | str,
    *,
    country_by_platform: Mapping[str, str] | None = None,
) -> Dict[str, Tuple[Path, Path]]:
    output_root = Path(output_dir)
    outputs: Dict[str, Tuple[Path, Path]] = {}

    for platform, records_iter in records_by_platform.items():
        records = list(records_iter)
        country = (
            country_by_platform.get(platform)
            if country_by_platform is not None
            else None
        )
        if not country and records:
            country = records[0].country
        if not country:
            country = "global" if platform == "facebook" else "unknown"

        output_base = output_root / f"{platform}_{country}_hot"
        outputs[platform] = export_records(records, str(output_base))

    return outputs
