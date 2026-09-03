// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it, vi } from 'vitest'

import { writeHTMLToWebview } from './writeHTMLToWebview'

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

describe('writeHTMLToWebview', () => {
  it('permits inline style attributes without relaxing production style or script sources', () => {
    const webview = {
      asWebviewUri: vi.fn<() => string>(() => 'vscode-webview://likec4/resource'),
      cspSource: 'vscode-webview://likec4',
      html: '',
      options: {},
    }

    writeHTMLToWebview({ webview } as never, { screen: 'view' })

    const cspContent = webview.html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? ''
    const directives = Object.fromEntries(
      cspContent.split(';').filter(Boolean).map(directive => {
        const [name, ...values] = directive.trim().split(/\s+/)
        return [name, values]
      }),
    )

    expect(directives['style-src']).toEqual([
      'vscode-webview://likec4',
      expect.stringMatching(/^'nonce-[A-Za-z0-9]{16}'$/),
    ])
    expect(directives['style-src-attr']).toEqual(['\'unsafe-inline\''])
    expect(directives['script-src']).toEqual([expect.stringMatching(/^'nonce-[A-Za-z0-9]{16}'$/)])
    expect(cspContent.match(/'unsafe-inline'/g)).toHaveLength(1)
  })
})
