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

selected=$(select_main_claude_pid "$test_root" 101 102 103 104 105 invalid)
assert_equal 101 "$selected" 'select the sole primary without consulting its environment'

selected=$(select_main_claude_pid "$test_root" 102 103 104)
assert_equal '' "$selected" 'return no PID when only child or unrelated processes exist'

write_cmdline 106 /usr/lib/claude-desktop/claude-desktop --disable-gpu
set +e
ambiguity_output=$(select_main_claude_pid "$test_root" 101 106 2>&1)
ambiguity_status=$?
set -e
assert_equal 1 "$ambiguity_status" 'reject multiple primary processes'
assert_equal 'ERROR: More than one main Claude Desktop process is running' "$ambiguity_output" \
  'report the ambiguous primary processes'

printf 'PASS: Claude Desktop primary-process selection\n'
