// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createExportViewUrl } from './takeScreenshot'

function parseExportUrl(url: string): URL {
  return new URL(url, 'http://likec4.test/')
}

describe('createExportViewUrl', () => {
  it('omits notation query parameter by default', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'customer view',
      padding: 20,
      theme: 'light',
    }))

    expect(url.pathname).toBe('/export/customer%20view/')
    expect(url.searchParams.get('padding')).toBe('20')
    expect(url.searchParams.get('theme')).toBe('light')
    expect(url.searchParams.has('notation')).toBe(false)
  })

  it('adds notation query parameter when requested', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'dark',
      notation: true,
    }))

    expect(url.pathname).toBe('/export/orders/')
    expect(url.searchParams.get('notation')).toBe('true')
  })

  it('keeps JPEG and dynamic export query parameters with notation', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'checkout',
      padding: 24,
      theme: 'dark',
      dynamicVariant: 'sequence',
      format: 'jpeg',
      notation: true,
    }))

    expect(url.searchParams.get('padding')).toBe('24')
    expect(url.searchParams.get('theme')).toBe('dark')
    expect(url.searchParams.get('dynamic')).toBe('sequence')
    expect(url.searchParams.get('format')).toBe('jpeg')
    expect(url.searchParams.get('notation')).toBe('true')
  })
})
