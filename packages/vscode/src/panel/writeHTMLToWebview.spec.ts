// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it, vi } from 'vitest'

vi.mock('reactive-vscode', () => ({
  computed: (value: () => boolean) => ({ value: value() }),
  extensionContext: { value: { extensionUri: {} } },
  useIsDarkTheme: () => ({ value: false }),
  watch: (source: { value: boolean }, callback: (value: boolean) => void, options: { immediate?: boolean }) => {
    if (options.immediate) callback(source.value)
  },
}))
vi.mock('vscode', () => ({ Uri: { joinPath: (...parts: unknown[]) => parts.join('/') } }))
vi.mock('../const.ts', () => ({ hasAI: false, isProd: true }))

import { writeHTMLToWebview } from './writeHTMLToWebview'

describe('writeHTMLToWebview', () => {
  it('permits inline style attributes without relaxing production style or script sources', () => {
    const webview = {
      asWebviewUri: vi.fn(() => 'vscode-webview://likec4/resource'),
      cspSource: 'vscode-webview://likec4',
      html: '',
      options: {},
    }

    writeHTMLToWebview({ webview } as never, { screen: 'view' })

    expect(webview.html).toMatch(/style-src vscode-webview:\/\/likec4 'nonce-[^']+';/)
    expect(webview.html).not.toContain('style-src vscode-webview://likec4 \'unsafe-inline\';')
    expect(webview.html).toContain('style-src-attr \'unsafe-inline\';')
    expect(webview.html).toContain('script-src \'nonce-')
  })
})
