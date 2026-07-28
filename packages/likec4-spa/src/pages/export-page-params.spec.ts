// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { hasSolidExportBackground, isExportSearchFlagEnabled, normalizeExportBackground } from './export-page-params'

describe('isExportSearchFlagEnabled', () => {
  it('accepts boolean and URL string true values', () => {
    expect(isExportSearchFlagEnabled(true)).toBe(true)
    expect(isExportSearchFlagEnabled('true')).toBe(true)
  })

  it('rejects missing, false, and unrelated values', () => {
    expect(isExportSearchFlagEnabled(false)).toBe(false)
    expect(isExportSearchFlagEnabled('false')).toBe(false)
    expect(isExportSearchFlagEnabled(undefined)).toBe(false)
    expect(isExportSearchFlagEnabled('')).toBe(false)
  })
})

describe('normalizeExportBackground', () => {
  it('trims non-empty background values', () => {
    expect(normalizeExportBackground('  #111827  ')).toBe('#111827')
    expect(normalizeExportBackground('white')).toBe('white')
  })

  it('ignores missing and blank background values', () => {
    expect(normalizeExportBackground(undefined)).toBeUndefined()
    expect(normalizeExportBackground('')).toBeUndefined()
    expect(normalizeExportBackground('   ')).toBeUndefined()
  })
})

describe('hasSolidExportBackground', () => {
  it('rejects missing and transparent background values', () => {
    expect(hasSolidExportBackground(undefined)).toBe(false)
    expect(hasSolidExportBackground('transparent')).toBe(false)
    expect(hasSolidExportBackground('  TRANSPARENT  ')).toBe(false)
    expect(hasSolidExportBackground('rgba(0, 0, 0, 0)')).toBe(false)
    expect(hasSolidExportBackground('rgb(0 0 0 / 0%)')).toBe(false)
    expect(hasSolidExportBackground('hsl(0 0% 0% / 0)')).toBe(false)
    expect(hasSolidExportBackground('hsla(0, 0%, 0%, 0)')).toBe(false)
    expect(hasSolidExportBackground('hwb(0 0% 0% / 0%)')).toBe(false)
    expect(hasSolidExportBackground('oklch(0 0 0 / 0)')).toBe(false)
    expect(hasSolidExportBackground('#0000')).toBe(false)
    expect(hasSolidExportBackground('#00000000')).toBe(false)
  })

  it('accepts opaque background values', () => {
    expect(hasSolidExportBackground('#fff')).toBe(true)
    expect(hasSolidExportBackground('#111827')).toBe(true)
    expect(hasSolidExportBackground('white')).toBe(true)
    expect(hasSolidExportBackground('rgba(0, 0, 0, 0.5)')).toBe(true)
    expect(hasSolidExportBackground('rgb(0 0 0 / 50%)')).toBe(true)
    expect(hasSolidExportBackground('oklch(0.8 0.1 200 / 50%)')).toBe(true)
  })
})
