// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { bootstrapIconRendererFromDataUrl, IconRenderer, localIconRendererFromDataUrl } from './IconRenderer'

vi.mock('./vscode', () => ({
  ExtensionApi: {
    readLocalIcon: vi.fn<(_: string) => Promise<{ base64data: string | null }>>(),
    readBootstrapIcon: vi.fn<(_: string) => Promise<{ base64data: string | null }>>(),
  },
}))

describe('IconRenderer', () => {
  it('renders host-provided Bootstrap SVG data as a colorable mask', () => {
    const BootstrapIcon = bootstrapIconRendererFromDataUrl(
      'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJjdXJyZW50Q29sb3IiLz4=',
    )
    const html = renderToStaticMarkup(<BootstrapIcon node={{ id: 'test', title: 'Test', icon: 'bootstrap:boxes' }} />)

    expect(html).toContain('background-color:currentColor')
    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('icons.like-c4.dev')
    expect(html).not.toContain('<img')
  })

  it('renders nothing when the host does not return a Bootstrap SVG', () => {
    const BootstrapIcon = bootstrapIconRendererFromDataUrl(null)
    const html = renderToStaticMarkup(<BootstrapIcon node={{ id: 'test', title: 'Test', icon: 'bootstrap:boxes' }} />)

    expect(html).toBe('')
  })

  it('keeps non-bootstrap bundled icons as CDN images', () => {
    const html = renderToStaticMarkup(
      <IconRenderer
        node={{
          id: 'test',
          title: 'Test',
          icon: 'tech:react',
        }} />,
    )

    expect(html).toContain('<img')
    expect(html).toContain('src="https://icons.like-c4.dev/tech/react.svg"')
  })

  it('renders local SVG data URLs as colorable masks', () => {
    const dataUrl = `data:image/svg+xml,${
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1,2" stroke="currentColor"/></svg>',
      )
    }`
    const LocalIcon = localIconRendererFromDataUrl(dataUrl)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/component.svg',
        }} />,
    )

    expect(html).toContain('background-color:currentColor')
    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<img')
  })

  it('detects currentColor in raw local SVG data URLs with commas and percent characters', () => {
    const dataUrl =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100%"><path d="M1,2" stroke="currentColor"/></svg>'
    const LocalIcon = localIconRendererFromDataUrl(dataUrl)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/component.svg',
        }} />,
    )

    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('<img')
  })

  it('detects currentColor case-insensitively in local SVG data URLs', () => {
    const dataUrl =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3Cpath stroke="currentcolor"/%3E%3C/svg%3E'
    const LocalIcon = localIconRendererFromDataUrl(dataUrl)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/component.svg',
        }} />,
    )

    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('<img')
  })

  it('keeps local SVG data URLs without currentColor as images', () => {
    const dataUrl = `data:image/svg+xml,${
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"><path fill="red"/></svg>')
    }`
    const LocalIcon = localIconRendererFromDataUrl(dataUrl)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/component.svg',
        }} />,
    )

    expect(html).toContain('<img')
    expect(html).toContain('src="data:image/svg+xml,')
    expect(html).not.toContain('mask-image:url(')
  })

  it('keeps local bitmap data URLs as images', () => {
    const dataUrl = 'data:image/png;base64,aW1hZ2U='
    const LocalIcon = localIconRendererFromDataUrl(dataUrl)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/component.png',
        }} />,
    )

    expect(html).toContain('<img')
    expect(html).toContain('src="data:image/png;base64,aW1hZ2U="')
  })

  it('renders nothing when a local icon cannot be read', () => {
    const LocalIcon = localIconRendererFromDataUrl(null)

    const html = renderToStaticMarkup(
      <LocalIcon
        node={{
          id: 'test',
          title: 'Test',
          icon: 'file:///workspace/icons/missing.svg',
        }} />,
    )

    expect(html).toBe('')
  })
})
