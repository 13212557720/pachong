#!/usr/bin/env bash
set -euo pipefail

PORT="${BOSS_CDP_PORT:-9222}"
PROFILE_DIR="${BOSS_CDP_PROFILE:-$HOME/.boss-cdp-chrome}"
START_URL="${BOSS_START_URL:-https://www.zhipin.com/web/chat/recommend}"

mkdir -p "$PROFILE_DIR"

open -na "Google Chrome" --args \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE_DIR" \
  "$START_URL"

echo "Chrome CDP is starting on http://127.0.0.1:$PORT"
echo "Log in to BOSS in that Chrome window, then run:"
echo "python scratch/boss_candidates_export.py --max-items 20 --scrolls 4"
