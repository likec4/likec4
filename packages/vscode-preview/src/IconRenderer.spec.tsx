// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bootstrapIconRendererFromDataUrl, IconRenderer, localIconRendererFromDataUrl } from './IconRenderer'
import { ExtensionApi } from './vscode'

vi.mock('./vscode', () => ({
  ExtensionApi: {
    readLocalIcon: vi.fn<(_: string) => Promise<{ base64data: string | null }>>(),
    readBootstrapIcon: vi.fn<(_: string) => Promise<{ base64data: string | null }>>(),
  },
}))

describe('IconRenderer', () => {
  const bootstrapIconDataUrl = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJjdXJyZW50Q29sb3IiLz4='
  const readBootstrapIcon = vi.mocked(ExtensionApi.readBootstrapIcon)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders host-provided Bootstrap SVG data as a colorable mask', async () => {
    readBootstrapIcon.mockResolvedValue({ base64data: bootstrapIconDataUrl })

    const html = await renderToHtml(
      <IconRenderer node={{ id: 'test', title: 'Test', icon: 'bootstrap:boxes' }} />,
    )

    expect(readBootstrapIcon).toHaveBeenCalledOnce()
    expect(readBootstrapIcon).toHaveBeenCalledWith('boxes')
    expect(html).toContain('background-color:currentColor')
    expect(html).toContain('mask-image:url(')
    expect(html).toContain('data:image/svg+xml;base64,')
    expect(html).not.toContain('icons.like-c4.dev')
    expect(html).not.toContain('<img')
  })

  it('keeps the synchronous Bootstrap mask helper for callers with host data', () => {
    const BootstrapIcon = bootstrapIconRendererFromDataUrl(
      bootstrapIconDataUrl,
    )
    const html = renderToStaticMarkup(<BootstrapIcon node={{ id: 'test', title: 'Test', icon: 'bootstrap:boxes' }} />)

    expect(html).toContain('background-color:currentColor')
    expect(html).toContain('mask-image:url(')
    expect(html).not.toContain('icons.like-c4.dev')
    expect(html).not.toContain('<img')
  })

  it('renders nothing when the host returns no Bootstrap SVG, then retries', async () => {
    readBootstrapIcon
      .mockResolvedValueOnce({ base64data: null })
      .mockResolvedValueOnce({ base64data: bootstrapIconDataUrl })

    const firstHtml = await renderToHtml(
      <IconRenderer node={{ id: 'test-empty', title: 'Test', icon: 'bootstrap:empty-retry' }} />,
    )
    const secondHtml = await renderToHtml(
      <IconRenderer node={{ id: 'test-empty', title: 'Test', icon: 'bootstrap:empty-retry' }} />,
    )

    expect(firstHtml).not.toContain('mask-image:url(')
    expect(firstHtml).not.toContain('<span')
    expect(readBootstrapIcon).toHaveBeenNthCalledWith(1, 'empty-retry')
    expect(readBootstrapIcon).toHaveBeenNthCalledWith(2, 'empty-retry')
    expect(secondHtml).toContain('mask-image:url(')
  })

  it('renders nothing when the host rejects, then retries', async () => {
    readBootstrapIcon
      .mockRejectedValueOnce(new Error('temporary host failure'))
      .mockResolvedValueOnce({ base64data: bootstrapIconDataUrl })

    const firstHtml = await renderToHtml(
      <IconRenderer node={{ id: 'test-error', title: 'Test', icon: 'bootstrap:error-retry' }} />,
    )
    const secondHtml = await renderToHtml(
      <IconRenderer node={{ id: 'test-error', title: 'Test', icon: 'bootstrap:error-retry' }} />,
    )

    expect(firstHtml).not.toContain('mask-image:url(')
    expect(firstHtml).not.toContain('<span')
    expect(readBootstrapIcon).toHaveBeenNthCalledWith(1, 'error-retry')
    expect(readBootstrapIcon).toHaveBeenNthCalledWith(2, 'error-retry')
    expect(secondHtml).toContain('mask-image:url(')
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

async function renderToHtml(element: React.ReactNode): Promise<string> {
  const stream = await renderToReadableStream(element)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let html = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      return html + decoder.decode()
    }
    html += decoder.decode(value, { stream: true })
  }
}
