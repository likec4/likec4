// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { maxChatWindowSizeForResize, resizeChatWindowSize } from './chat-window-size'

describe('resizeChatWindowSize', () => {
  it('applies resize deltas', () => {
    expect(
      resizeChatWindowSize(
        { width: 440, height: 420 },
        { width: 60, height: 40 },
        { width: 1000, height: 1000 },
      ),
    ).toEqual({ width: 500, height: 460 })
  })

  it('keeps the window inside min and max bounds', () => {
    expect(
      resizeChatWindowSize(
        { width: 440, height: 420 },
        { width: -500, height: -500 },
        { width: 1000, height: 1000 },
      ),
    ).toEqual({ width: 320, height: 360 })

    expect(
      resizeChatWindowSize(
        { width: 440, height: 420 },
        { width: 2000, height: 2000 },
        { width: 900, height: 700 },
      ),
    ).toEqual({ width: 900, height: 700 })
  })

  it('computes max size from the current window position', () => {
    expect(
      maxChatWindowSizeForResize(
        { left: 984, top: 380 },
        { width: 1440, height: 900 },
      ),
    ).toEqual({ width: 448, height: 512 })
  })

  it('uses a safe fallback viewport outside the browser', () => {
    expect(maxChatWindowSizeForResize({ left: 0, top: 0 })).toEqual({ width: 432, height: 412 })
  })
})
