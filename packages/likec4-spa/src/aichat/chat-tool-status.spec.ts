// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { formatToolActivityLabel } from './chat-tool-status'

describe('formatToolActivityLabel', () => {
  it('uses readable labels for LikeC4 UI tools', () => {
    expect(formatToolActivityLabel('read_ui')).toBe('Reading diagram state...')
    expect(formatToolActivityLabel('read_connections')).toBe('Reading connections...')
    expect(formatToolActivityLabel('read_element')).toBe('Reading element details...')
    expect(formatToolActivityLabel('update_ui')).toBe('Updating diagram...')
    expect(formatToolActivityLabel('navigate_to')).toBe('Opening view...')
  })

  it('falls back to the tool name for unknown tools', () => {
    expect(formatToolActivityLabel('custom_tool')).toBe('Running custom_tool...')
  })
})
