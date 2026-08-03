import type { StoryCursor } from '@likec4/core'
import { _stage, _type } from '@likec4/core/types'
import type { LayoutedElementView, LayoutedStoryView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { NavigationPanelActorSnapshot } from './actor'
import { selectBreadcrumbs } from './NavigationPanelControls'

// Minimal fixtures — `selectBreadcrumbs` only reads `context.view`,
// `context.viewModel`, and `context.activeStoryCursor`.
const elementView = {
  id: 'view:scene',
  [_type]: 'element',
  [_stage]: 'layouted',
  title: 'A Scene',
  nodes: [],
  edges: [],
} as unknown as LayoutedElementView

const storyView = {
  id: 'view:story',
  [_type]: 'story',
  [_stage]: 'layouted',
  title: 'A Story',
  nodes: [],
  edges: [],
} as unknown as LayoutedStoryView

const cursor: StoryCursor = { scene: 'step-01' as any, innerStep: null }

function snapshot(view: LayoutedElementView | LayoutedStoryView, activeStoryCursor: StoryCursor | null) {
  return {
    context: {
      view,
      viewModel: null,
      activeStoryCursor,
    },
  } as unknown as NavigationPanelActorSnapshot
}

describe('selectBreadcrumbs — isStoryView', () => {
  it('is false when there is no active story cursor, even while mounted directly on a story view', () => {
    // The narrow window before the dispatch link's first `story.scene` has
    // landed: `view` is still the story wrapper, but nothing has resolved yet.
    expect(selectBreadcrumbs(snapshot(storyView, null)).isStoryView).toBe(false)
  })

  it('is true once a story is active, even though `view` is an ordinary scene view', () => {
    // The steady state for almost the entire lifetime of a story session:
    // `story.scene` has already replaced `view` with the current scene's own
    // view (element/dynamic/deployment), never the story wrapper again.
    // `isStoryView` must not regress to keying off `view._type === 'story'`,
    // or the StoryWalkthrough controls disappear right after the first scene
    // renders.
    expect(selectBreadcrumbs(snapshot(elementView, cursor)).isStoryView).toBe(true)
  })

  it('is false again once the story has ended (activeStoryCursor cleared)', () => {
    expect(selectBreadcrumbs(snapshot(elementView, null)).isStoryView).toBe(false)
  })
})
