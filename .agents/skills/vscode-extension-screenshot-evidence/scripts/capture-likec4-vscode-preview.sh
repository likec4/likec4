#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  capture-likec4-vscode-preview.sh \
    --label before|after \
    --fixture /path/to/fixture-folder \
    --extension-path /path/to/likec4/packages/vscode \
    --output /path/to/screenshot.png

Options:
  --command "LikeC4: Open Preview"  VS Code command palette text to run.
  --wait-seconds 18                 Seconds to wait after selecting the view.
  --window-size 1280x900            Screenshot window size.
USAGE
}

label=""
fixture=""
extension_path=""
out_png=""
command_text="LikeC4: Open Preview"
wait_seconds="18"
window_size="1280x900"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label)
      label="${2:-}"
      shift 2
      ;;
    --fixture)
      fixture="${2:-}"
      shift 2
      ;;
    --extension-path)
      extension_path="${2:-}"
      shift 2
      ;;
    --output)
      out_png="${2:-}"
      shift 2
      ;;
    --command)
      command_text="${2:-}"
      shift 2
      ;;
    --wait-seconds)
      wait_seconds="${2:-}"
      shift 2
      ;;
    --window-size)
      window_size="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$label" || -z "$fixture" || -z "$extension_path" || -z "$out_png" ]]; then
  usage >&2
  exit 2
fi

for required in code xdotool import python3; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Missing required command: $required" >&2
    exit 1
  fi
done

if [[ -z "${DISPLAY:-}" ]]; then
  echo "DISPLAY is not set. Run this script under xvfb-run -a or start Xvfb first." >&2
  exit 1
fi

if [[ ! -d "$fixture" ]]; then
  echo "Fixture folder does not exist: $fixture" >&2
  exit 1
fi

if [[ ! -d "$extension_path" ]]; then
  echo "Extension path does not exist: $extension_path" >&2
  exit 1
fi

mkdir -p "$(dirname "$out_png")"

user_data="$(mktemp -d "/tmp/likec4-vscode-${label}-user.XXXXXX")"
extensions_dir="$(mktemp -d "/tmp/likec4-vscode-${label}-extensions.XXXXXX")"
log_file="${out_png%.png}.log"

mkdir -p "${user_data}/User"
USER_DATA="$user_data" python3 - <<'PY'
import json
import os
from pathlib import Path

settings = {
    "workbench.colorTheme": "Default Dark Modern",
    "workbench.startupEditor": "none",
    "security.workspace.trust.enabled": False,
    "telemetry.telemetryLevel": "off",
    "window.restoreWindows": "none",
    "workbench.editor.enablePreview": False,
}

Path(os.environ["USER_DATA"], "User", "settings.json").write_text(
    json.dumps(settings, indent=2),
    encoding="utf-8",
)
PY

code \
  --new-window \
  --wait \
  --user-data-dir "$user_data" \
  --extensions-dir "$extensions_dir" \
  --extensionDevelopmentPath="$extension_path" \
  --disable-gpu \
  --disable-workspace-trust \
  --skip-welcome \
  --skip-release-notes \
  "$fixture" >"$log_file" 2>&1 &
code_pid="$!"

cleanup() {
  set +e
  xdotool key --clearmodifiers alt+F4 >/dev/null 2>&1
  sleep 1
  kill "$code_pid" >/dev/null 2>&1
  pkill -f "$user_data" >/dev/null 2>&1
}
trap cleanup EXIT

window_id=""
for _ in $(seq 1 60); do
  window_id="$(xdotool search --onlyvisible --class code 2>/dev/null | tail -n 1 || true)"
  if [[ -n "$window_id" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$window_id" ]]; then
  echo "No VS Code window found; log follows:" >&2
  sed -n '1,200p' "$log_file" >&2 || true
  exit 1
fi

width="${window_size%x*}"
height="${window_size#*x}"
if [[ -z "$width" || -z "$height" || "$width" = "$window_size" ]]; then
  echo "Invalid --window-size value: $window_size" >&2
  exit 2
fi

xdotool windowfocus "$window_id"
xdotool windowsize "$window_id" "$width" "$height"
xdotool windowmove "$window_id" 0 0

sleep 8
xdotool key --clearmodifiers ctrl+shift+p
sleep 1
xdotool type --delay 1 "$command_text"
sleep 1
xdotool key --clearmodifiers Return
sleep 3
xdotool key --clearmodifiers Return
sleep "$wait_seconds"

import -window root "$out_png"
file "$out_png"
