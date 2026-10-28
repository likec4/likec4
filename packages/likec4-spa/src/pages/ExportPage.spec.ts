// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportPage } from './ExportPage'

const testState = vi.hoisted(() => ({
  diagram: {
    id: 'index',
    bounds: { x: 0, y: 0, width: 640, height: 480 },
    description: null,
    notation: null as null | {
      nodes: Array<{ title: string; shape: string; color: string; kinds: string[] }>
    },
  },
  search: {
    format: 'png',
  } as Record<string, unknown>,
}))

vi.mock('@likec4/diagram', () => ({
  LikeC4Diagram: () => React.createElement('div', { 'data-testid': 'diagram' }),
  pickViewBounds: () => testState.diagram.bounds,
  useLikeC4Styles: () => ({
    colors: () => ({
      elements: {
        fill: '#fff',
        stroke: '#000',
        hiContrast: '#000',
        loContrast: '#fff',
      },
    }),
  }),
}))

vi.mock('@likec4/diagram/custom', () => ({
  ElementShape: () => React.createElement('div'),
  Markdown: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}))

vi.mock('@likec4/styles/jsx', () => ({
  Box: ({ children, css: _css, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', props, children),
}))

vi.mock('@mantine/core', () => ({
  LoadingOverlay: React.forwardRef<HTMLDivElement>((props, ref) => React.createElement('div', { ...props, ref })),
}))

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => testState.search,
}))

vi.mock('../components/NotFound', () => ({
  NotFound: () => React.createElement('div', { 'data-testid': 'not-found' }, 'not found'),
}))

vi.mock('../hooks', () => ({
  useCurrentView: () => [testState.diagram],
  useTransparentBackground: vi.fn<(transparent: boolean) => void>(),
}))

describe('ExportPage', () => {
  beforeEach(() => {
    testState.search = { format: 'png' }
    testState.diagram.notation = null
  })

  it('renders image export routes independently from webapp menu capabilities', () => {
    const markup = renderToStaticMarkup(React.createElement(ExportPage))

    expect(markup).toContain('data-testid="export-page"')
    expect(markup).not.toContain('data-testid="not-found"')
  })

  describe('notation labels', () => {
    const fullTitle = 'Database: A persistent data store'

    beforeEach(() => {
      testState.diagram.notation = {
        nodes: [{ title: fullTitle, shape: 'cylinder', color: 'primary', kinds: ['database'] }],
      }
    })

    it('shows the short title with kinds by default', () => {
      testState.search = { format: 'png', notation: true }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(markup).toContain('data-testid="export-notation"')
      expect(markup).toContain('>Database<')
      expect(markup).toContain('>database<')
      expect(markup).not.toContain(fullTitle)
    })

    it('shows the full text when requested', () => {
      testState.search = { format: 'png', notation: true, notationText: 'full' }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(markup).toContain(fullTitle)
    })

    it('shows only kinds when requested', () => {
      testState.search = { format: 'png', notation: true, notationText: 'kind' }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(markup).toContain('>database<')
      expect(markup).not.toContain('>Database<')
    })
  })
})
