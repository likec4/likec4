// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IconRenderer } from './IconRenderer'

describe('IconRenderer', () => {
  it('renders SVG data URLs as colorable masks so iconColor can style currentColor', () => {
    const svgDataUrl =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3Cpath stroke="currentColor"/%3E%3C/svg%3E'

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }}
        style={{ color: 'red' }} />,
    )

    expect(html).toContain('style="color:red"')
    expect(html).toContain('background-color:currentColor')
    expect(html).toContain('mask-image:url(')
    expect(html).toContain('data:image/svg+xml')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<img')
  })

  it('keeps base64 SVG data URLs as safe mask image sources', () => {
    const svgDataUrl = 'data:image/svg+xml;base64,PHN2Zz48cGF0aCBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg=='

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('mask-image:url(')
    expect(html).toContain('data:image/svg+xml;base64,')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<img')
  })

  it('keeps URL-encoded SVG data URLs with commas intact as mask image sources', () => {
    const svgDataUrl = `data:image/svg+xml,${
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1,2" stroke="currentColor"/></svg>',
      )
    }`

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('class="likec4-element-icon"')
    expect(html).toContain('mask-image:url(')
    expect(html).toContain('data:image/svg+xml,')
    expect(html).not.toContain('<img')
  })

  it('detects currentColor in raw SVG data URLs with commas and percent characters', () => {
    const svgDataUrl =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%"><path d="M1,2" stroke="currentColor"/></svg>'

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('<img')
  })

  it('detects currentColor case-insensitively in SVG data URLs', () => {
    const svgDataUrl =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3Cpath stroke="currentcolor"/%3E%3C/svg%3E'

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('<img')
  })

  it('keeps non-currentColor SVG data URLs as images to preserve original SVG colors', () => {
    const svgDataUrl = `data:image/svg+xml,${
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><path fill="red"/></svg>')
    }`

    const html = renderToStaticMarkup(
      <IconRenderer
        element={{
          id: 'test',
          title: 'Test',
          icon: svgDataUrl,
        }} />,
    )

    expect(html).toContain('<img')
    expect(html).toContain('src="data:image/svg+xml,')
    expect(html).not.toContain('mask-image:url(')
  })
})
