#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "[PixelMate] 未找到 Node.js，请先阅读 docs/macOS环境配置.md"
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "[PixelMate] 未找到 Rust/Cargo，请先阅读 docs/macOS环境配置.md"
  exit 1
fi

if [ ! -d node_modules ]; then
  npm ci
fi

npm run tauri dev

