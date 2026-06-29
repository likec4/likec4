// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LikeC4ProjectConfig } from '@likec4/config'
import { describe, it } from 'vitest'
import {
  effectiveWebappExportFormats,
  isWebappExportFormatEnabled,
} from './export-formats'

describe('webapp export format capabilities', () => {
  it('enables every export format when webapp config is omitted', ({ expect }) => {
    expect(effectiveWebappExportFormats({})).toEqual(['png', 'jpg', 'dot', 'd2', 'mmd', 'puml', 'drawio'])
  })

  it('keeps disabled exports disabled', ({ expect }) => {
    expect(effectiveWebappExportFormats({ webapp: { exportFormats: [] } })).toEqual([])
  })

  it('normalizes configured formats to the fixed LikeC4 menu order', ({ expect }) => {
    expect(effectiveWebappExportFormats({ webapp: { exportFormats: ['drawio', 'jpg', 'dot'] } })).toEqual([
      'jpg',
      'dot',
      'drawio',
    ])
  })

  it('checks whether a project has an export format enabled', ({ expect }) => {
    const config: Pick<LikeC4ProjectConfig, 'webapp'> = { webapp: { exportFormats: ['png', 'drawio'] } }

    expect(isWebappExportFormatEnabled(config, 'png')).toBe(true)
    expect(isWebappExportFormatEnabled(config, 'dot')).toBe(false)
  })
})
