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
    description: null as null | string,
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
  useLikeC4Model: () => ({ resolveMarkdownRef: () => null }),
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

/**
 * Returns the opening tag of the element with the given test id.
 */
function elementTag(markup: string, testId: string): string {
  const tag = markup.match(new RegExp(`<\\w+[^>]*data-testid="${testId}"[^>]*>`))?.[0]
  expect(tag, `element ${testId}`).toBeDefined()
  return tag!
}

describe('ExportPage', () => {
  beforeEach(() => {
    testState.search = { format: 'png' }
    testState.diagram.notation = null
    testState.diagram.description = null
  })

  it('renders image export routes independently from webapp menu capabilities', () => {
    const markup = renderToStaticMarkup(React.createElement(ExportPage))

    expect(markup).toContain('data-testid="export-page"')
    expect(markup).not.toContain('data-testid="not-found"')
  })

  // Wiring of exportPageGrid (tested in export-layout.spec.ts) into the rendered page
  describe('grid layout', () => {
    // 640 + 2 × 20 (default padding) + 16 (extra padding)
    const diagramWidth = 696

    beforeEach(() => {
      testState.diagram.notation = {
        nodes: [{ title: 'Database', shape: 'cylinder', color: 'primary', kinds: ['database'] }],
      }
      testState.diagram.description = 'A short description'
    })

    it('lays out the canvas as a grid of the diagram area only by default', () => {
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      const page = elementTag(markup, 'export-page')
      expect(page).toContain('display:grid')
      expect(page).toContain(`grid-template-columns:${diagramWidth}px`)
      expect(page).toContain('grid-template-areas:&quot;diagram&quot;')
      expect(elementTag(markup, 'export-diagram-area')).toContain('grid-area:diagram')
      expect(markup).not.toContain('data-testid="export-notation"')
      expect(markup).not.toContain('data-testid="export-description"')
    })

    it('places the notation in its grid area and corner', () => {
      testState.search = { format: 'png', notation: true, notationPosition: 'bottom-left' }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(elementTag(markup, 'export-page')).toContain(
        'grid-template-areas:&quot;notation diagram&quot;',
      )
      const notation = elementTag(markup, 'export-notation')
      expect(notation).toContain('grid-area:notation')
      expect(notation).toContain('align-self:end')
      expect(notation).toContain('width:320px')
      expect(notation).not.toContain('position:absolute')
    })

    it('places the description above the diagram and the notation', () => {
      testState.search = { format: 'png', description: true, notation: true, notationPosition: 'top-right' }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(elementTag(markup, 'export-page')).toContain(
        'grid-template-areas:&quot;description description&quot; &quot;diagram notation&quot;',
      )
      const description = elementTag(markup, 'export-description')
      expect(description).toContain('grid-area:description')
      expect(description).toContain('min-height:84px')
      expect(description).toContain('max-height:240px')
      expect(description).not.toContain('position:absolute')
      expect(elementTag(markup, 'export-notation')).toContain('align-self:start')
    })

    it('leaves out the description panel when the view has no description', () => {
      testState.diagram.description = null
      testState.search = { format: 'png', description: true }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(markup).not.toContain('data-testid="export-description"')
      expect(elementTag(markup, 'export-page')).toContain('grid-template-areas:&quot;diagram&quot;')
    })
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

    it('lets long kind badges wrap inside the panel', () => {
      testState.diagram.notation = {
        nodes: [{ title: fullTitle, shape: 'cylinder', color: 'primary', kinds: ['a'.repeat(80)] }],
      }
      testState.search = { format: 'png', notation: true }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))
      const badge = markup.match(/<(\w+)[^>]*>a{80}<\/\1>/)?.[0]

      expect(badge).toBeDefined()
      expect(badge).toContain('overflow-wrap:anywhere')
      expect(badge).not.toContain('white-space:nowrap')
    })

    it('shows only kinds when requested', () => {
      testState.search = { format: 'png', notation: true, notationText: 'kind' }
      const markup = renderToStaticMarkup(React.createElement(ExportPage))

      expect(markup).toContain('>database<')
      expect(markup).not.toContain('>Database<')
    })
  })
})
