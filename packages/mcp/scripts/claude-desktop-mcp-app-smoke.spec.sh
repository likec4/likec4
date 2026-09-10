#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
#
# Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

set -Eeuo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
# shellcheck disable=SC1091  # The source path is resolved relative to this test at runtime.
source "$script_dir/claude-desktop-mcp-app-smoke.sh"

test_root=$(mktemp -d "${TMPDIR:-/tmp}/likec4-claude-smoke-test.XXXXXX")
trap 'rm -rf -- "$test_root"' EXIT

write_cmdline() {
  local pid=$1
  shift
  mkdir -p -- "$test_root/$pid"
  printf '%s\0' "$@" >"$test_root/$pid/cmdline"
}

write_status() {
  local pid=$1
  local parent_pid=$2
  mkdir -p -- "$test_root/$pid"
  printf 'Name:\ttest\nPPid:\t%s\n' "$parent_pid" >"$test_root/$pid/status"
}

assert_equal() {
  local expected=$1
  local actual=$2
  local description=$3
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL: %s: expected <%s>, got <%s>\n' "$description" "$expected" "$actual" >&2
    exit 1
  fi
}

write_cmdline 101 /usr/lib/claude-desktop/claude-desktop
write_cmdline 102 /usr/lib/claude-desktop/claude-desktop --type=renderer
write_cmdline 103 /usr/lib/claude-desktop/claude-desktop --type utility
write_cmdline 104 /usr/bin/not-claude-desktop

selected=$(list_main_claude_pids "$test_root" 101 102 103 104 105 invalid)
assert_equal 101 "$selected" 'list the sole primary without consulting its environment'

selected=$(list_main_claude_pids "$test_root" 102 103 104)
assert_equal '' "$selected" 'return no PID when only child or unrelated processes exist'

write_cmdline 106 /usr/lib/claude-desktop/claude-desktop --disable-gpu
selected=$(list_main_claude_pids "$test_root" 101 106)
assert_equal $'101\n106' "$selected" 'list separate primary processes for display association'

write_status 101 1
write_status 106 1
write_status 201 101
write_status 202 201
write_status 206 106
write_status 999 1

selected=$(select_main_claude_pid_for_windows "$test_root" 101 106 -- 202)
assert_equal 101 "$selected" 'associate an Electron descendant window with its primary process'

selected=$(select_main_claude_pid_for_windows "$test_root" 101 106 -- 106)
assert_equal 106 "$selected" 'associate a directly owned window with its primary process'

set +e
missing_output=$(select_main_claude_pid_for_windows "$test_root" 101 -- 2>&1)
missing_status=$?
association_output=$(select_main_claude_pid_for_windows "$test_root" 101 -- 999 2>&1)
association_status=$?
invalid_pid_output=$(select_main_claude_pid_for_windows "$test_root" 101 -- invalid 2>&1)
invalid_pid_status=$?
ambiguity_output=$(select_main_claude_pid_for_windows "$test_root" 101 106 -- 202 206 2>&1)
ambiguity_status=$?
set -e

assert_equal 1 "$missing_status" 'reject a requested display without a visible Claude window'
assert_equal 'ERROR: No visible Claude Desktop window exists on the requested display' "$missing_output" \
  'report the missing visible window'
assert_equal 1 "$association_status" 'reject a window without a Claude primary ancestor'
assert_equal 'ERROR: Could not associate a visible Claude Desktop window with exactly one main process' \
  "$association_output" 'report the failed PID association'
assert_equal 1 "$invalid_pid_status" 'reject a window without a numeric process owner'
assert_equal 'ERROR: Could not associate a visible Claude Desktop window with a process' \
  "$invalid_pid_output" 'report the invalid window PID'
assert_equal 1 "$ambiguity_status" 'reject windows associated with different primary processes'
assert_equal 'ERROR: Visible Claude Desktop windows belong to more than one main process on the requested display' \
  "$ambiguity_output" 'report the display ambiguity'

pgrep() {
  printf '101\n106\n'
}

xdotool() {
  [[ "${DISPLAY-}" == ':77' ]] || return 1
  case "$1" in
    search)
      case "${xdotool_mode-}" in
        fresh)
          printf '701\n'
          ;;
        ambiguous)
          printf '700\n701\n'
          ;;
        *)
          printf '700\n'
          ;;
      esac
      ;;
    getwindowpid)
      [[ "$2" == 700 || "$2" == 701 ]] || return 1
      printf '202\n'
      ;;
    getwindowclassname)
      [[ "$2" == 700 || "$2" == 701 ]] || return 1
      printf 'claude\n'
      ;;
    *)
      return 1
      ;;
  esac
}

selected=$(find_main_claude_pid ':77' '' "$test_root")
assert_equal 101 "$selected" 'scope primary selection through the requested X11 display'

set +e
wrong_display_output=$(find_main_claude_pid ':78' '' "$test_root" 2>&1)
wrong_display_status=$?
set -e
assert_equal 1 "$wrong_display_status" 'reject a display without a matching visible Claude window'
assert_equal 'ERROR: No visible Claude Desktop window exists on the requested display' "$wrong_display_output" \
  'report the unmatched requested display'

xdotool_mode=fresh
selected=$(find_single_visible_claude_window ':77' "$test_root")
assert_equal 701 "$selected" 'discover and validate the new visible window after restart'

xdotool_mode=ambiguous
set +e
ambiguous_window_output=$(find_single_visible_claude_window ':77' "$test_root" 2>&1)
ambiguous_window_status=$?
set -e
assert_equal 1 "$ambiguous_window_status" 'reject ambiguous post-restart Claude windows'
assert_equal 'ERROR: Expected exactly one visible Claude window; found 2' "$ambiguous_window_output" \
  'report post-restart window ambiguity'

printf 'PASS: Claude Desktop display-scoped primary-process selection\n'
