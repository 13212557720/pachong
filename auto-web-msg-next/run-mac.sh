#!/bin/sh

set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR" || exit 1

NODE_VERSION="v24.14.1"
RUNTIME_DIR="$HOME/.auto_web_msg_node"

fail() {
  echo "[ERROR] $1"
  printf "按回车键退出..."
  read -r _
  exit 1
}

if [ ! -f "$ROOT_DIR/start.js" ]; then
  fail "项目根目录未找到 start.js：$ROOT_DIR"
fi

CPU_ARCH="$(uname -m)"
if [ "$CPU_ARCH" = "arm64" ]; then
  NODE_ARCH="arm64"
elif [ "$CPU_ARCH" = "x86_64" ]; then
  NODE_ARCH="x64"
else
  fail "不支持的 CPU 架构：$CPU_ARCH"
fi

ARCHIVE_NAME="node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
ARCHIVE_PATH="$RUNTIME_DIR/$ARCHIVE_NAME"
EXTRACT_DIR="$RUNTIME_DIR/node-${NODE_VERSION}-darwin-${NODE_ARCH}"
NODE_BIN="$EXTRACT_DIR/bin/node"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${ARCHIVE_NAME}"

mkdir -p "$RUNTIME_DIR" || fail "创建 runtime 目录失败：$RUNTIME_DIR"

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "[INFO] 正在下载适配 $CPU_ARCH 的 Node.js..."
  curl -fL "$NODE_URL" -o "$ARCHIVE_PATH" || fail "下载失败：$NODE_URL"
fi

if [ ! -x "$NODE_BIN" ]; then
  echo "[INFO] 正在解压 Node.js 包..."
  tar -xzf "$ARCHIVE_PATH" -C "$RUNTIME_DIR" || fail "解压失败：$ARCHIVE_PATH"
fi

[ -f "$NODE_BIN" ] || fail "解压后未找到 Node 可执行文件：$NODE_BIN"
chmod +x "$NODE_BIN" || fail "设置 Node 可执行权限失败：$NODE_BIN"

echo "[INFO] 正在使用本地 Node 启动应用..."
"$NODE_BIN" "$ROOT_DIR/start.js" || fail "应用运行异常退出。"
