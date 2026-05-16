// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { isExportSearchFlagEnabled } from './export-page-params'

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
