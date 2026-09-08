import type { AnyStoryView, LayoutedElementView } from '@likec4/core/types'
import { _stage, _type } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { NavigationPanelActorSnapshot } from './actor'
import { selectBreadcrumbs } from './NavigationPanelControls'

// Minimal fixtures — `selectBreadcrumbs` only reads `context.view`,
// `context.viewModel`, and `context.story`.
const elementView = {
  id: 'view:scene',
  [_type]: 'element',
  [_stage]: 'layouted',
  title: 'A Scene',
  nodes: [],
  edges: [],
} as unknown as LayoutedElementView

// A story is never assigned to `view` itself (Task 1 pulled `story` out of
// the view unions) — it only ever arrives as the separate `story` field.
const story = {
  id: 'view:story',
  [_type]: 'story',
  [_stage]: 'layouted',
  title: 'A Story',
  scenes: [],
} as unknown as AnyStoryView

function snapshot(view: LayoutedElementView, story: AnyStoryView | null) {
  return {
    context: {
      view,
      viewModel: null,
      story,
    },
  } as unknown as NavigationPanelActorSnapshot
}

describe('selectBreadcrumbs — isStoryView', () => {
  it('is false when there is no story', () => {
    expect(selectBreadcrumbs(snapshot(elementView, null)).isStoryView).toBe(false)
  })

  it('is true once a story is supplied alongside an ordinary scene view', () => {
    // `view` is always an ordinary element/dynamic/deployment view — a story
    // is never assigned to it — so `isStoryView` must not key off
    // `view._type === 'story'`, only off `context.story`.
    expect(selectBreadcrumbs(snapshot(elementView, story)).isStoryView).toBe(true)
  })

  it('is false again once the story has ended (story cleared)', () => {
    expect(selectBreadcrumbs(snapshot(elementView, null)).isStoryView).toBe(false)
  })
})
