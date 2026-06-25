# BOSS Candidate Keyword Screening

This tool connects to a Chrome window you control, reads the BOSS recommended
candidate list, opens visible candidate detail links, scores keyword matches,
and exports CSV/XLSX files for HR review.

It does not bypass login, CAPTCHA, account checks, or permissions. If BOSS shows
a login, verification, frequency, or permission page, the script stops so you
can resolve it manually.

## 1. Start a CDP Chrome Window

```bash
bash scripts/start_boss_chrome_cdp.sh
```

Log in to BOSS in the Chrome window that opens, then go to:

```text
https://www.zhipin.com/web/chat/recommend
```

## 2. Run a Small Export

```bash
python scratch/boss_candidates_export.py --max-items 20 --scrolls 4
```

The default output files are:

```text
output_boss/boss_candidates.csv
output_boss/boss_candidates.xlsx
```

## 3. Useful Options

```bash
python scratch/boss_candidates_export.py \
  --max-items 50 \
  --scrolls 6 \
  --delay-min 2 \
  --delay-max 4
```

Use `--include-unmatched` only when you want to audit candidates that did not
hit any configured keyword.

## Output Fields

`推荐分`, `命中关键词`, `命中片段`, `姓名`, `年龄`, `经验`, `学历`, `期望城市`,
`期望岗位`, `薪资期望`, `当前状态`, `详情链接`, `完整详情文本`, `采集时间`, `来源页`.
