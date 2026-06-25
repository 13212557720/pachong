from __future__ import annotations

import argparse
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import pandas as pd
import requests


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149 Safari/537.36"
)


def is_mexico_country(value: str) -> bool:
    normalized = (value or "").strip().lower()
    return normalized in {"墨西哥", "méxico", "mexico", "mx"} or "méxico" in normalized or "mexico" in normalized


def fetch_about_country(url: str) -> tuple[str, str]:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,es;q=0.7",
        }
    )
    about_url = (url or "").strip().rstrip("/") + "/about"
    if not about_url.startswith("http"):
        return "", "invalid_url"

    last_error = ""
    for _ in range(2):
        try:
            response = session.get(about_url, timeout=(6, 10), stream=True)
            response.raise_for_status()
            chunks: list[str] = []
            total = 0
            for chunk in response.iter_content(chunk_size=65536, decode_unicode=True):
                if not chunk:
                    continue
                chunks.append(chunk)
                total += len(chunk)
                if total >= 2_000_000:
                    break
            html = "".join(chunks)
            match = re.search(r'"country"\s*:\s*"([^"]+)"', html)
            return (match.group(1), "") if match else ("", "country_not_found")
        except Exception as exc:
            last_error = str(exc)
            time.sleep(0.5)
    return "", last_error[:200]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--workers", type=int, default=6)
    return parser.parse_args()


def write_outputs(df: pd.DataFrame, rejected: pd.DataFrame, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    kept_csv = out_dir / "youtube_mexico_verified_about_country.csv"
    kept_xlsx = out_dir / "youtube_mexico_verified_about_country.xlsx"
    rejected_csv = out_dir / "youtube_rejected_not_verified_mexico.csv"
    rejected_xlsx = out_dir / "youtube_rejected_not_verified_mexico.xlsx"
    df.to_csv(kept_csv, index=False, encoding="utf-8-sig")
    df.to_excel(kept_xlsx, index=False)
    rejected.to_csv(rejected_csv, index=False, encoding="utf-8-sig")
    rejected.to_excel(rejected_xlsx, index=False)


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    out_dir = Path(args.out_dir)
    df = pd.read_excel(input_path) if input_path.suffix == ".xlsx" else pd.read_csv(input_path)
    df = df.copy()

    if "频道链接" not in df.columns:
        raise SystemExit("input file must contain 频道链接")

    results: dict[int, tuple[str, str]] = {}
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(fetch_about_country, str(row["频道链接"])): idx
            for idx, row in df.iterrows()
        }
        for count, future in enumerate(as_completed(futures), start=1):
            idx = futures[future]
            try:
                results[idx] = future.result()
            except Exception as exc:
                results[idx] = ("", str(exc)[:200])
            if count % 25 == 0 or count == len(futures):
                print(f"checked={count}/{len(futures)}")

    df["About国家"] = [results.get(idx, ("", ""))[0] for idx in df.index]
    df["国家校验错误"] = [results.get(idx, ("", ""))[1] for idx in df.index]
    df["是否About国家墨西哥"] = df["About国家"].map(lambda value: "是" if is_mexico_country(str(value)) else "否")

    kept = df[df["是否About国家墨西哥"] == "是"].copy()
    rejected = df[df["是否About国家墨西哥"] != "是"].copy()
    write_outputs(kept, rejected, out_dir)
    print(f"input_rows={len(df)} kept={len(kept)} rejected={len(rejected)}")
    print(out_dir / "youtube_mexico_verified_about_country.xlsx")
    print(out_dir / "youtube_rejected_not_verified_mexico.xlsx")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
