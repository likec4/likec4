#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
#
# Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage:
  claude-desktop-mcp-app-smoke.sh \
    --workspace DIR --input-x PX --input-y PX --verdict-file FILE [OPTIONS]

Runs an opt-in Claude Desktop X11 smoke test for LikeC4 MCP Apps. The script:

  1. Adds one uniquely named local MCP server to Claude Desktop configuration.
  2. Restarts Claude Desktop.
  3. Uses xdotool to submit one default render-view request and one request with
     fullModel: true.
  4. Captures the Claude window after each request.
  5. Waits for an operator or image-inspection agent to write this exact verdict:

       default=PASS
       full=PASS

  6. Removes only its temporary MCP server entry and restarts Claude Desktop.

Required options:
  --workspace DIR       LikeC4 workspace served by the temporary MCP server.
  --input-x PX          Chat input X coordinate, relative to the Claude window.
  --input-y PX          Chat input Y coordinate, relative to the Claude window.
  --verdict-file FILE   External screenshot verdict. It must not exist at start.

Options:
  --view-id ID          View to render (default: index).
  --display DISPLAY     X11 display (default: current DISPLAY).
  --config FILE         Claude Desktop config (default:
                        $XDG_CONFIG_HOME/Claude/claude_desktop_config.json or
                        $HOME/.config/Claude/claude_desktop_config.json).
  --claude-bin FILE     Claude Desktop executable (default: claude-desktop).
  --window-id ID        Exact visible Claude X11 window. By default, the script
                        requires exactly one visible window with class "claude".
  --startup-wait SEC    Wait for the Claude window (default: 20).
  --response-wait SEC   Wait before each screenshot (default: 45).
  --verdict-wait SEC    Wait for the verdict file (default: 300).
  --output-dir DIR      New directory for screenshots (default: mktemp under /tmp).
  -h, --help            Show this help.

Operator prerequisites:
  - Sign in to Claude Desktop before starting this script.
  - Use an X11 session. Wayland-only sessions are not supported.
  - Make sure Claude can run the temporary local MCP tool without an unresolved
    permission dialog. The script does not approve security prompts.
  - Keep the Claude window layout stable. Supply coordinates for the chat input.
  - Inspect default.png and full-model.png. Write the verdict only if each image
    shows the interactive LikeC4 MCP App, not structured JSON or prose fallback.

The Claude UI has no supported deterministic tool-call API. Therefore, xdotool
submits strict prompts, but screenshots plus the external verdict determine PASS.
The script never prints MCP configuration content.
EOF
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command is missing: $1"
}

require_nonnegative_integer() {
  [[ "$2" =~ ^[0-9]+$ ]] || fail "$1 must be a nonnegative integer"
}

select_main_claude_pid() {
  local proc_root=$1
  shift

  local pid arg
  local is_child
  local -a argv=()
  local -a candidates=()

  for pid in "$@"; do
    [[ "$pid" =~ ^[0-9]+$ && -r "$proc_root/$pid/cmdline" ]] || continue
    argv=()
    mapfile -d '' -t argv <"$proc_root/$pid/cmdline"
    ((${#argv[@]} > 0)) || continue
    [[ "${argv[0]##*/}" == 'claude-desktop' ]] || continue

    is_child=false
    for arg in "${argv[@]:1}"; do
      if [[ "$arg" == '--type' || "$arg" == --type=* ]]; then
        is_child=true
        break
      fi
    done
    [[ "$is_child" == false ]] || continue
    candidates+=("$pid")
  done

  ((${#candidates[@]} <= 1)) || fail 'More than one main Claude Desktop process is running'
  ((${#candidates[@]} == 1)) && printf '%s\n' "${candidates[0]}"
  return 0
}

find_main_claude_pid() {
  local -a pids=()
  mapfile -t pids < <(pgrep -u "$UID" -x claude-desktop || true)
  select_main_claude_pid /proc "${pids[@]}"
}

if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  return 0
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
package_dir=$(cd -- "$script_dir/.." && pwd -P)
mcp_cli="$package_dir/dist/cli.mjs"

workspace=''
view_id='index'
display_name=${DISPLAY-}
config_home=${XDG_CONFIG_HOME:-"$HOME/.config"}
config_file="$config_home/Claude/claude_desktop_config.json"
claude_bin='claude-desktop'
window_id=''
input_x=''
input_y=''
response_wait=45
startup_wait=20
verdict_wait=300
verdict_file=''
output_dir=''

while (($# > 0)); do
  case "$1" in
    --workspace)
      (($# >= 2)) || fail '--workspace requires a value'
      workspace=$2
      shift 2
      ;;
    --view-id)
      (($# >= 2)) || fail '--view-id requires a value'
      view_id=$2
      shift 2
      ;;
    --display)
      (($# >= 2)) || fail '--display requires a value'
      display_name=$2
      shift 2
      ;;
    --config)
      (($# >= 2)) || fail '--config requires a value'
      config_file=$2
      shift 2
      ;;
    --claude-bin)
      (($# >= 2)) || fail '--claude-bin requires a value'
      claude_bin=$2
      shift 2
      ;;
    --window-id)
      (($# >= 2)) || fail '--window-id requires a value'
      window_id=$2
      shift 2
      ;;
    --input-x)
      (($# >= 2)) || fail '--input-x requires a value'
      input_x=$2
      shift 2
      ;;
    --input-y)
      (($# >= 2)) || fail '--input-y requires a value'
      input_y=$2
      shift 2
      ;;
    --response-wait)
      (($# >= 2)) || fail '--response-wait requires a value'
      response_wait=$2
      shift 2
      ;;
    --startup-wait)
      (($# >= 2)) || fail '--startup-wait requires a value'
      startup_wait=$2
      shift 2
      ;;
    --verdict-wait)
      (($# >= 2)) || fail '--verdict-wait requires a value'
      verdict_wait=$2
      shift 2
      ;;
    --verdict-file)
      (($# >= 2)) || fail '--verdict-file requires a value'
      verdict_file=$2
      shift 2
      ;;
    --output-dir)
      (($# >= 2)) || fail '--output-dir requires a value'
      output_dir=$2
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ -n "$workspace" ]] || fail '--workspace is required'
[[ -n "$input_x" ]] || fail '--input-x is required'
[[ -n "$input_y" ]] || fail '--input-y is required'
[[ -n "$verdict_file" ]] || fail '--verdict-file is required'
[[ -n "$display_name" ]] || fail 'DISPLAY is empty; use --display for an X11 session'
[[ "$view_id" =~ ^[A-Za-z0-9_.-]+$ ]] || fail '--view-id contains unsupported characters'
[[ -d "$workspace" ]] || fail "Workspace is not a directory: $workspace"
[[ -f "$mcp_cli" ]] || fail "Built MCP CLI is missing: $mcp_cli (run pnpm --filter @likec4/mcp build)"
[[ -f "$config_file" ]] || fail "Claude Desktop config is missing: $config_file"
[[ ! -L "$config_file" ]] || fail "Claude Desktop config must not be a symbolic link: $config_file"
[[ -r "$config_file" && -w "$config_file" ]] || fail "Claude Desktop config must be readable and writable"
[[ ! -e "$verdict_file" ]] || fail "Verdict file already exists: $verdict_file"
[[ "$(stat -c %u -- "$config_file")" == "$UID" ]] || fail 'Claude Desktop config is not owned by the current user'

require_nonnegative_integer '--input-x' "$input_x"
require_nonnegative_integer '--input-y' "$input_y"
require_nonnegative_integer '--startup-wait' "$startup_wait"
require_nonnegative_integer '--response-wait' "$response_wait"
require_nonnegative_integer '--verdict-wait' "$verdict_wait"

require_command jq
require_command node
require_command xdotool
require_command import
require_command stat
require_command mktemp

DISPLAY="$display_name" xdotool getmouselocation >/dev/null 2>&1 \
  || fail "Cannot connect to the X11 display: $display_name"

if [[ "$claude_bin" == */* ]]; then
  [[ -x "$claude_bin" ]] || fail "Claude Desktop executable is not executable: $claude_bin"
else
  claude_bin=$(command -v "$claude_bin") || fail 'Claude Desktop executable is missing'
fi

jq -e 'type == "object" and ((has("mcpServers") | not) or (.mcpServers | type == "object"))' "$config_file" >/dev/null \
  || fail 'Claude Desktop config is not a JSON object with an object-valued mcpServers field'

workspace=$(cd -- "$workspace" && pwd -P)
verdict_parent=$(dirname -- "$verdict_file")
[[ -d "$verdict_parent" && -w "$verdict_parent" ]] || fail 'Verdict file parent must be a writable directory'
verdict_file=$(cd -- "$verdict_parent" && printf '%s/%s\n' "$PWD" "$(basename -- "$verdict_file")")

if [[ -z "$output_dir" ]]; then
  output_dir=$(mktemp -d "${TMPDIR:-/tmp}/likec4-claude-smoke.XXXXXX")
else
  [[ ! -e "$output_dir" ]] || fail "Output directory already exists: $output_dir"
  mkdir -- "$output_dir"
  output_dir=$(cd -- "$output_dir" && pwd -P)
fi

umask 077
state_dir=$(mktemp -d "${TMPDIR:-/tmp}/likec4-claude-smoke-state.XXXXXX")
entry_state="$state_dir/entry.json"
server_name="likec4-render-payload-smoke-${UID}-$(date -u +%Y%m%dT%H%M%SZ)-$$"
config_installed=false
claude_started=false

jq --arg key "$server_name" \
  '{
    serversPresent: has("mcpServers"),
    present: ((.mcpServers // {}) | has($key)),
    value: ((.mcpServers // {})[$key])
  }' \
  "$config_file" >"$entry_state"

if jq -e '.present' "$entry_state" >/dev/null; then
  fail 'Generated temporary MCP server name unexpectedly already exists'
fi

write_config() {
  local jq_filter=$1
  local temp_config
  temp_config=$(mktemp "$(dirname -- "$config_file")/.claude-desktop-smoke.XXXXXX")

  if ! jq --arg key "$server_name" \
    --arg node "$(command -v node)" \
    --arg cli "$mcp_cli" \
    --arg workspace "$workspace" \
    "$jq_filter" "$config_file" >"$temp_config"; then
    rm -f -- "$temp_config"
    return 1
  fi

  chmod --reference="$config_file" "$temp_config"
  mv -- "$temp_config" "$config_file"
}

restart_claude() {
  local pid=''
  pid=$(find_main_claude_pid)
  if [[ -n "$pid" ]]; then
    kill -TERM "$pid"
    for _ in {1..40}; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.25
    done
    kill -0 "$pid" 2>/dev/null && fail "Claude Desktop did not stop after SIGTERM (pid $pid)"
  fi

  DISPLAY="$display_name" "$claude_bin" >/dev/null 2>&1 &
  claude_started=true
}

# shellcheck disable=SC2317  # Called indirectly by the EXIT trap.
restore_config_entry() {
  [[ "$config_installed" == true ]] || return 0
  jq -e 'type == "object" and ((has("mcpServers") | not) or (.mcpServers | type == "object"))' \
    "$config_file" >/dev/null || return 1

  local temp_config
  temp_config=$(mktemp "$(dirname -- "$config_file")/.claude-desktop-restore.XXXXXX")
  if ! jq --arg key "$server_name" --slurpfile saved "$entry_state" '
    if $saved[0].present then
      .mcpServers = ((.mcpServers // {}) + {($key): $saved[0].value})
    else
      del(.mcpServers[$key])
      | if (($saved[0].serversPresent | not) and .mcpServers == {}) then del(.mcpServers) else . end
    end
  ' "$config_file" >"$temp_config"; then
    rm -f -- "$temp_config"
    return 1
  fi

  chmod --reference="$config_file" "$temp_config"
  mv -- "$temp_config" "$config_file"
  config_installed=false
}

# shellcheck disable=SC2317  # Called indirectly by the EXIT trap.
cleanup() {
  local status=$?
  local cleanup_failed=false
  trap - EXIT INT TERM HUP

  if ! restore_config_entry; then
    printf 'ERROR: Could not restore the temporary Claude Desktop config entry.\n' >&2
    printf 'Recovery state is preserved at: %s\n' "$entry_state" >&2
    cleanup_failed=true
  else
    rm -rf -- "$state_dir"
    if [[ "$claude_started" == true ]] && ! restart_claude; then
      printf 'ERROR: Claude Desktop could not be restarted after config restoration.\n' >&2
      cleanup_failed=true
    fi
  fi

  [[ "$cleanup_failed" == false ]] || status=1
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# Mark cleanup as required before the atomic write. Removing a missing unique
# entry is harmless if the write fails or a signal arrives between commands.
config_installed=true
# shellcheck disable=SC2016  # This is a jq program, not a shell expression.
write_config '.mcpServers = ((.mcpServers // {}) + {($key): {
  command: $node,
  args: [$cli, "--stdio", "--no-watch", $workspace]
}})'

restart_claude

if [[ -z "$window_id" ]]; then
  for ((attempt = 0; attempt <= startup_wait * 4; attempt++)); do
    mapfile -t windows < <(DISPLAY="$display_name" xdotool search --onlyvisible --class 'claude' 2>/dev/null || true)
    ((${#windows[@]} > 0)) && break
    ((attempt == startup_wait * 4)) && break
    sleep 0.25
  done
  ((${#windows[@]} == 1)) || fail "Expected exactly one visible Claude window; found ${#windows[@]}"
  window_id=${windows[0]}
else
  DISPLAY="$display_name" xdotool getwindowname "$window_id" >/dev/null 2>&1 \
    || fail "Claude window does not exist: $window_id"
fi

window_class=$(DISPLAY="$display_name" xdotool getwindowclassname "$window_id")
[[ "${window_class,,}" == *claude* ]] || fail "Selected X11 window is not Claude Desktop: $window_id"

geometry=$(DISPLAY="$display_name" xdotool getwindowgeometry --shell "$window_id")
window_width=$(sed -n 's/^WIDTH=//p' <<<"$geometry")
window_height=$(sed -n 's/^HEIGHT=//p' <<<"$geometry")
[[ -n "$window_width" && -n "$window_height" ]] || fail 'Could not read Claude window geometry'
((input_x < window_width && input_y < window_height)) || fail 'Chat input coordinates are outside the Claude window'

submit_prompt() {
  local prompt=$1
  DISPLAY="$display_name" xdotool windowactivate --sync "$window_id"
  DISPLAY="$display_name" xdotool key --window "$window_id" --clearmodifiers ctrl+n
  sleep 1
  DISPLAY="$display_name" xdotool mousemove --window "$window_id" "$input_x" "$input_y" click 1
  DISPLAY="$display_name" xdotool type --window "$window_id" --clearmodifiers --delay 1 -- "$prompt"
  DISPLAY="$display_name" xdotool key --window "$window_id" --clearmodifiers Return
}

default_prompt="Use only the MCP server named ${server_name}. Call render-view exactly once with {\"viewId\":\"${view_id}\"}. Do not summarize the result. Show the interactive MCP App."
full_prompt="Use only the MCP server named ${server_name}. Call render-view exactly once with {\"viewId\":\"${view_id}\",\"fullModel\":true}. Do not summarize the result. Show the interactive MCP App."

printf 'Temporary MCP server: %s\n' "$server_name"
printf 'Evidence directory: %s\n' "$output_dir"

submit_prompt "$default_prompt"
sleep "$response_wait"
DISPLAY="$display_name" import -window "$window_id" "$output_dir/default.png"

submit_prompt "$full_prompt"
sleep "$response_wait"
DISPLAY="$display_name" import -window "$window_id" "$output_dir/full-model.png"

[[ -s "$output_dir/default.png" && -s "$output_dir/full-model.png" ]] \
  || fail 'One or more screenshots are empty'

printf 'Screenshots captured. Waiting for image inspection verdict: %s\n' "$verdict_file"
for ((elapsed = 0; elapsed <= verdict_wait; elapsed++)); do
  if [[ -f "$verdict_file" ]]; then
    verdict=$(tr -d '\r' <"$verdict_file")
    if [[ "$verdict" == $'default=PASS\nfull=PASS' || "$verdict" == $'default=PASS\nfull=PASS\n' ]]; then
      printf 'Claude Desktop MCP Apps smoke passed. Evidence: %s\n' "$output_dir"
      exit 0
    fi
    fail 'Verdict file does not contain the required two PASS lines'
  fi
  ((elapsed == verdict_wait)) && break
  sleep 1
done

fail "Timed out waiting for screenshot verdict: $verdict_file"
