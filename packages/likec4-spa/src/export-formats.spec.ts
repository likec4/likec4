// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { enabledWebappExportFormats } from './export-formats'

describe('SPA webapp export format helpers', () => {
  it('defaults to every export format for older project metadata', ({ expect }) => {
    expect(enabledWebappExportFormats({})).toEqual(['png', 'jpg', 'dot', 'd2', 'mmd', 'puml', 'drawio'])
  })

  it('keeps an empty export format list disabled', ({ expect }) => {
    expect(enabledWebappExportFormats({ exportFormats: [] })).toEqual([])
  })

  it('normalizes enabled formats to the fixed LikeC4 menu order', ({ expect }) => {
    expect(enabledWebappExportFormats({ exportFormats: ['drawio', 'jpg', 'dot'] })).toEqual([
      'jpg',
      'dot',
      'drawio',
    ])
  })
})
