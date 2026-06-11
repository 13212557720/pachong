# Social Hot Creator Collector

Python CLI for collecting public creator ranking data from YouTube, Instagram, and Facebook public ranking pages, filtering by follower/subscriber count, and exporting CSV/XLSX tables with Chinese headers.

The default target remains YouTube Mexico creators with at least 200,000 subscribers. The base flow does not use a logged-in browser session.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run All Platforms

```bash
python -m src.main --platform all --country mexico --out-dir output
```

This creates platform-specific files:

- `output/youtube_mexico_hot.csv`
- `output/youtube_mexico_hot.xlsx`
- `output/instagram_mexico_hot.csv`
- `output/instagram_mexico_hot.xlsx`
- `output/facebook_global_hot.csv`
- `output/facebook_global_hot.xlsx`

Facebook currently uses a global public ranking source, not a Mexico-specific source.

## Run One Platform

```bash
python -m src.main --platform youtube --country mexico --youtube-min-subscribers 200000 --out-dir output
python -m src.main --platform instagram --country mexico --instagram-min-followers 200000 --out-dir output
python -m src.main --platform facebook --facebook-min-followers 200000 --out-dir output
```

Backward-compatible YouTube output is still supported:

```bash
python -m src.main --platform youtube --country mexico --min-subscribers 200000 --out output/mexico_youtube_hot
```

## Output Columns

Final spreadsheet columns are Chinese:

`平台`, `国家/地区`, `排名`, `名称`, `账号`, `平台用户ID`, `粉丝数`, `订阅数`, `观看量`, `视频数`, `分类`, `主页链接`, `来源链接`, `数据来源`, `采集方式`, `IP属地`, `是否认证`, `是否私密`, `采集时间`, `简介`, `原始数据`.

Useful options:

```bash
python -m src.main --platform youtube --country mexico --youtube-min-subscribers 200000 --max-rank-page 1000 --details
```

`--details` visits each public YouTube detail page and tries to collect a description when present.

`--api-enrich` is optional and only applies to YouTube rows when an official channel id is available. It is not required for the default public-page export.

Mexico Instagram public mode combines HypeAuditor category ranking pages with Scrumball rows to reach up to 1000 unique records.
Facebook Mexico uses logged-in browser search mode for large exports:

```bash
python -m src.main --platform facebook --country mexico --use-login-browser --max-browser-items 1000 --facebook-scrolls 5
```

## Test

```bash
pytest
```
