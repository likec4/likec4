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
    notation: null,
  },
  project: {
    exportFormats: ['drawio'],
  },
  search: {
    format: 'png',
    relationships: undefined as string | undefined,
    relationshipScope: undefined as string | undefined,
  },
  model: {
    findElement: (id: string) => id === 'missing' ? null : {},
  },
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

vi.mock('@nanostores/react', () => ({
  useStore: () => testState.model,
}))

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => testState.search,
}))

vi.mock('../components/NotFound', () => ({
  NotFound: () => React.createElement('div', { 'data-testid': 'not-found' }, 'not found'),
}))

vi.mock('../hooks', () => ({
  useCurrentProject: () => testState.project,
  useCurrentView: () => [testState.diagram],
  useCurrentViewId: () => testState.diagram.id,
  useTransparentBackground: vi.fn(),
}))

vi.mock('../context/safeCtx', () => ({
  useLikeC4ModelAtom: () => ({}),
}))

vi.mock('../relationship-export', async importOriginal => ({
  ...(await importOriginal<typeof import('../relationship-export')>()),
  createRelationshipExportView: ({ subjectId }: { subjectId: string }) => {
    if (subjectId === 'missing') {
      throw new Error('Unknown element')
    }
    return testState.diagram
  },
  normalizeRelationshipScope: (scope: string | undefined) => scope ?? 'view',
}))

describe('ExportPage', () => {
  beforeEach(() => {
    testState.project.exportFormats = ['drawio']
    testState.search.format = 'png'
    testState.search.relationships = undefined
    testState.search.relationshipScope = undefined
  })

  it('keeps the image export route available when webapp image downloads are disabled', () => {
    const markup = renderToStaticMarkup(React.createElement(ExportPage))

    expect(markup).toContain('data-testid="export-page"')
    expect(markup).not.toContain('data-testid="not-found"')
  })

  it('renders not found for an unknown relationship export subject', () => {
    testState.search.relationships = 'missing'

    const markup = renderToStaticMarkup(React.createElement(ExportPage))

    expect(markup).toContain('data-testid="not-found"')
    expect(markup).not.toContain('data-testid="export-page"')
  })
})
