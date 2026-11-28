import type { ReactNode } from 'react'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ViewEditor } from './ViewEditor'

const testState = vi.hoisted(() => ({
  view: null as null | { id: string },
  compareView: null as null | { id: string },
  diffs: [] as Array<{ id: string; views: Array<{ id: string }> }>,
}))

vi.mock('@likec4/diagram', () => ({
  LikeC4Diagram: () => React.createElement('div', { 'data-testid': 'diagram' }),
  LikeC4EditorProvider: ({ children }: { children: ReactNode }) =>
    React.createElement('div', { 'data-testid': 'editor' }, children),
}))

vi.mock('@likec4/vite-plugin/internal', () => ({ openSourceInEditor: vi.fn<() => void>() }))

vi.mock('@mantine/hooks', () => ({ useCallbackRef: <T>(fn: T) => fn }))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn<() => void>(),
  useSearch: () => ({}),
}))

vi.mock('likec4:app-config', () => ({ isDevelopment: false }))

vi.mock('likec4:rpc', () => ({ isAIAvailable: false, likec4rpc: {} }))

vi.mock('../aichat', () => ({ LazyAIChat: () => null }))

vi.mock('../components/model-diff/CompareModelProvider', () => ({
  CompareModelProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../components/model-diff/ModelDiffPanel', () => ({
  ModelDiffPanel: () => React.createElement('div', { 'data-testid': 'diff-panel' }),
  useCompareView: (viewId: string | undefined) => testState.compareView?.id === viewId ? testState.compareView : null,
  useSelectOwnerDiff: vi.fn<() => void>(),
}))

vi.mock('../components/NotFound', () => ({
  NotFound: () => React.createElement('div', { 'data-testid': 'not-found' }),
}))

vi.mock('../context/safeCtx', () => ({ useLikeC4ProjectContext: () => ({ $model: {} }) }))

vi.mock('../hooks', () => ({
  useCurrentProject: () => ({ id: 'default' }),
  useCurrentView: () => [testState.view, vi.fn<() => void>()],
  useCurrentViewId: () => 'refund',
  useModelDiffs: () => ({ diffs: testState.diffs }),
}))

vi.mock('../relationship-browser/scope', () => ({
  useRelationshipBrowserScope: () => ['view', vi.fn<() => void>()],
}))

vi.mock('./ViewReact', () => ({
  FocusElementFromUrl: () => null,
  ListenForDiagramStateChanges: () => null,
  OpenRelationshipBrowserFromUrl: () => null,
}))

const render = () => renderToStaticMarkup(React.createElement(ViewEditor))

describe('ViewEditor', () => {
  beforeEach(() => {
    testState.view = null
    testState.compareView = null
    testState.diffs = []
  })

  it('renders a view introduced by a diff with the editor off', () => {
    testState.compareView = { id: 'refund' }
    testState.diffs = [{ id: 'rfc1', views: [{ id: 'refund' }] }]

    const markup = render()

    expect(markup).toContain('data-testid="diagram"')
    expect(markup).not.toContain('data-testid="editor"')
    expect(markup).not.toContain('data-testid="not-found"')
  })

  it('renders not found when there is no saved view and no diff introduces it', () => {
    testState.diffs = [{ id: 'rfc1', views: [{ id: 'other' }] }]

    const markup = render()

    expect(markup).toContain('data-testid="not-found"')
    expect(markup).not.toContain('data-testid="diagram"')
  })

  it('renders a saved view inside the editor', () => {
    testState.view = { id: 'refund' }

    const markup = render()

    expect(markup).toMatch(/data-testid="editor"><div data-testid="diagram"/)
    expect(markup).not.toContain('data-testid="not-found"')
  })
})
