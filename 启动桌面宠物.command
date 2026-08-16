#!/usr/bin/env bash

cd "$(dirname "$0")" || exit 1
chmod +x scripts/start-macos.sh
./scripts/start-macos.sh
status=$?

if [ "$status" -ne 0 ]; then
  echo
  echo "[PixelMate] 启动失败，请根据上方提示检查环境。"
  read -r -n 1 -p "按任意键关闭窗口..."
  echo
fi

exit "$status"
