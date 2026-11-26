// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createExportViewUrl } from './takeScreenshot'

function parseExportUrl(url: string): URL {
  return new URL(url, 'http://likec4.test/')
}

describe('createExportViewUrl', () => {
  it('omits optional decoration query parameters by default', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'customer view',
      padding: 20,
      theme: 'light',
    }))

    expect(url.pathname).toBe('/export/customer%20view/')
    expect(url.searchParams.get('padding')).toBe('20')
    expect(url.searchParams.get('theme')).toBe('light')
    expect(url.searchParams.has('notation')).toBe(false)
    expect(url.searchParams.has('description')).toBe(false)
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

  it('omits notation position and text when they are the defaults', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'light',
      notation: true,
      notationPosition: 'bottom-right',
      notationText: 'short',
    }))

    expect(url.searchParams.get('notation')).toBe('true')
    expect(url.searchParams.has('notationPosition')).toBe(false)
    expect(url.searchParams.has('notationText')).toBe(false)
  })

  it('adds non-default notation position and text', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'light',
      notation: true,
      notationPosition: 'top-left',
      notationText: 'full',
    }))

    expect(url.searchParams.get('notationPosition')).toBe('top-left')
    expect(url.searchParams.get('notationText')).toBe('full')
  })

  it('ignores notation position and text without notation', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'light',
      notationPosition: 'top-left',
      notationText: 'kind',
    }))

    expect(url.searchParams.has('notationPosition')).toBe(false)
    expect(url.searchParams.has('notationText')).toBe(false)
  })

  it('adds description query parameter when requested', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'orders',
      padding: 20,
      theme: 'dark',
      description: true,
    }))

    expect(url.pathname).toBe('/export/orders/')
    expect(url.searchParams.get('description')).toBe('true')
  })

  it('keeps JPEG and dynamic export query parameters with decorations', () => {
    const url = parseExportUrl(createExportViewUrl({
      viewId: 'checkout',
      padding: 24,
      theme: 'dark',
      dynamicVariant: 'sequence',
      format: 'jpeg',
      notation: true,
      description: true,
    }))

    expect(url.searchParams.get('padding')).toBe('24')
    expect(url.searchParams.get('theme')).toBe('dark')
    expect(url.searchParams.get('dynamic')).toBe('sequence')
    expect(url.searchParams.get('format')).toBe('jpeg')
    expect(url.searchParams.get('notation')).toBe('true')
    expect(url.searchParams.get('description')).toBe('true')
  })
})
