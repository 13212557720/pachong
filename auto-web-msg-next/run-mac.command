#!/bin/bash

set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR" || exit 1

NODE_VERSION="v24.14.1"
RUNTIME_DIR="$HOME/.auto_web_msg_node"

fail() {
  echo "[ERROR] $1"
  printf "Press Enter to exit..."
  read -r _
  exit 1
}

if [ ! -f "$ROOT_DIR/start.js" ]; then
  fail "start.js not found in project root: $ROOT_DIR"
fi

CPU_ARCH="$(uname -m)"
if [ "$CPU_ARCH" = "arm64" ]; then
  NODE_ARCH="arm64"
elif [ "$CPU_ARCH" = "x86_64" ]; then
  NODE_ARCH="x64"
else
  fail "Unsupported CPU architecture: $CPU_ARCH"
fi

ARCHIVE_NAME="node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
ARCHIVE_PATH="$RUNTIME_DIR/$ARCHIVE_NAME"
EXTRACT_DIR="$RUNTIME_DIR/node-${NODE_VERSION}-darwin-${NODE_ARCH}"
NODE_BIN="$EXTRACT_DIR/bin/node"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${ARCHIVE_NAME}"

mkdir -p "$RUNTIME_DIR" || fail "Failed to create runtime directory: $RUNTIME_DIR"

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "[INFO] Downloading Node.js package for $CPU_ARCH..."
  curl -fL "$NODE_URL" -o "$ARCHIVE_PATH" || fail "Failed to download: $NODE_URL"
fi

if [ ! -x "$NODE_BIN" ]; then
  echo "[INFO] Extracting Node.js package..."
  tar -xzf "$ARCHIVE_PATH" -C "$RUNTIME_DIR" || fail "Failed to extract archive: $ARCHIVE_PATH"
fi

[ -f "$NODE_BIN" ] || fail "Node binary not found after extraction: $NODE_BIN"
chmod +x "$NODE_BIN" || fail "Failed to chmod Node binary: $NODE_BIN"

echo "[INFO] Starting app with local Node ($CPU_ARCH)..."
"$NODE_BIN" "$ROOT_DIR/start.js" || fail "Application exited with error."
