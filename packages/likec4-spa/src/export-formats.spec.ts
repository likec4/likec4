// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { WebappExportFormat } from '@likec4/config'
import { describe, it } from 'vitest'
import {
  enabledWebappExportFormats,
  hasAnyWebappExportFormatEnabled,
  isImageExportFormatEnabled,
  isWebappExportFormatEnabled,
} from './export-formats'

describe('SPA webapp export format helpers', () => {
  it('defaults to every export format for older project metadata', ({ expect }) => {
    expect(enabledWebappExportFormats({})).toEqual(['png', 'jpg', 'dot', 'd2', 'mmd', 'puml', 'drawio'])
    expect(hasAnyWebappExportFormatEnabled({})).toBe(true)
  })

  it('keeps an empty export format list disabled', ({ expect }) => {
    expect(enabledWebappExportFormats({ exportFormats: [] })).toEqual([])
    expect(hasAnyWebappExportFormatEnabled({ exportFormats: [] })).toBe(false)
  })

  it('normalizes enabled formats to the fixed LikeC4 menu order', ({ expect }) => {
    expect(enabledWebappExportFormats({ exportFormats: ['drawio', 'jpg', 'dot'] })).toEqual([
      'jpg',
      'dot',
      'drawio',
    ])
  })

  it('checks text and image export formats against project capabilities', ({ expect }) => {
    const project: { exportFormats: WebappExportFormat[] } = { exportFormats: ['png', 'drawio'] }

    expect(isWebappExportFormatEnabled(project, 'drawio')).toBe(true)
    expect(isWebappExportFormatEnabled(project, 'dot')).toBe(false)
    expect(isImageExportFormatEnabled(project, 'png')).toBe(true)
    expect(isImageExportFormatEnabled(project, 'jpeg')).toBe(false)
  })
})
