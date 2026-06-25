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

## Fast Mexico YouTube 10k-1000k Crawl

For larger strict Mexico exports, use the dedicated YouTube crawler. It uses YouTube
internal search only to discover candidate channels, then validates subscriber counts
and Mexico country fields with the official YouTube Data API `channels.list`.

Set `YOUTUBE_API_KEY` first:

```bash
export YOUTUBE_API_KEY="your_api_key"
```

Run the 40k target crawl:

```bash
python -m src.youtube_mexico_crawler \
  --min-subscribers 10000 \
  --max-subscribers 1000000 \
  --target-rows 40000 \
  --strict-country \
  --out-dir output_youtube_mexico_10k_1000k \
  --resume
```

Useful smoke test:

```bash
python -m src.youtube_mexico_crawler \
  --target-rows 20 \
  --query-limit 3 \
  --out-dir output_youtube_mexico_smoke
```

To quickly collect candidate channel IDs first, without validating About details:

```bash
python -m src.youtube_mexico_crawler \
  --discovery-only \
  --candidate-target 5000 \
  --query-limit 200 \
  --max-pages-per-query 3 \
  --search-workers 8 \
  --out-dir output_youtube_mexico_candidates \
  --resume
```

This writes `youtube_mexico_candidate_ids.csv` and `.xlsx`. Reuse the same
`--out-dir --resume` later without `--discovery-only` to validate country,
subscriber range, views, video counts, and contact links.

Outputs include `crawl_state.sqlite`, `youtube_mexico_10k_1000k_channels.csv`,
`youtube_mexico_10k_1000k_channels.xlsx`, `rejected_channels.csv`, and
`crawl_summary.json`. Add `--collect-contact` only when email/social links are
needed, because it fetches About pages after strict validation.

Mexico Instagram public mode combines HypeAuditor category ranking pages with Scrumball rows to reach up to 1000 unique records.
Facebook Mexico uses logged-in browser search mode for large exports. Browser mode now searches
people first with Mexico flag/country keywords, then fills the remaining rows from page search.
The default Facebook follower filter is `0` because personal profiles often do not expose follower
counts.

```bash
python -m src.main --platform facebook --country mexico --use-login-browser --max-browser-items 200 --facebook-scrolls 5
```

Optional query files:

```bash
python -m src.main --platform facebook --country mexico --use-login-browser \
  --facebook-people-query-file people_queries.txt \
  --facebook-page-query-file page_queries.txt \
  --max-browser-items 200
```

Facebook browser exports include extra Chinese columns for `结果类型`, `好友数`, `所在地/地址`,
`工作/学校`, `邮箱`, `来源关键词`, `原始文本`, and `信息完整度评分`.

To collect only users with a visible follower count of at least 5,000:

```bash
python -m src.main --platform facebook --country mexico --use-login-browser \
  --facebook-result-scope people \
  --facebook-min-followers 5000 \
  --max-browser-items 200 \
  --facebook-scrolls 8 \
  --out-dir output_facebook_5k_users
```

## Test

```bash
pytest
```
