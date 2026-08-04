import type { AnyStoryView, DiagramView } from '@likec4/core/types'
import { _type } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { DiagramMachineSnapshot } from '../likec4diagram/state/machine'
import { select } from './NavigationPanel'

// `select` is a `selectDiagramContext(...)` result, i.e. a
// `[selector, compare]` tuple (see `createSafeContextForActor.selectContext`
// in `../hooks/safeContext.tsx`) — the selector itself reads
// `snapshot.context`, so fixtures below only need a `context` object with
// the fields the selector actually touches: `view`, `story`,
// `activeWalkthrough`, and `dynamicViewVariant`.
const [selectMode] = select

const elementView = {
  [_type]: 'element',
  id: 'view:element',
} as unknown as DiagramView

const dynamicView = {
  [_type]: 'dynamic',
  id: 'view:dynamic',
} as unknown as DiagramView

const dynamicSequenceViewWithFlow = {
  [_type]: 'dynamic',
  id: 'view:dynamic-sequence',
  flow: {},
} as unknown as DiagramView

const story = {
  [_type]: 'story',
  id: 'view:story',
  scenes: [],
} as unknown as AnyStoryView

function snapshot(context: {
  view: DiagramView
  story?: AnyStoryView | null
  activeWalkthrough?: unknown
  dynamicViewVariant?: string | null
}) {
  return {
    context: {
      story: null,
      activeWalkthrough: null,
      dynamicViewVariant: null,
      ...context,
    },
  } as unknown as DiagramMachineSnapshot
}

describe('NavigationPanel select — mode derivation', () => {
  it('is "default" for a non-dynamic view, even with an active walkthrough flag set', () => {
    expect(selectMode(snapshot({ view: elementView, activeWalkthrough: { stepId: 'e1' } })).mode).toBe('default')
  })

  it('is "default" for a dynamic view with no active walkthrough', () => {
    expect(selectMode(snapshot({ view: dynamicView })).mode).toBe('default')
  })

  it('is "walkthrough" for a dynamic-view walkthrough with no story in context', () => {
    expect(
      selectMode(snapshot({ view: dynamicView, activeWalkthrough: { stepId: 'e1' } })).mode,
    ).toBe('walkthrough')
  })

  it('is "walkthrough-in-story" when both a story and an active walkthrough are set on a dynamic view', () => {
    expect(
      selectMode(snapshot({ view: dynamicView, activeWalkthrough: { stepId: 'e1' }, story })).mode,
    ).toBe('walkthrough-in-story')
  })

  it('is "walkthrough-flow" for a sequence view with flow, regardless of story, not "walkthrough-in-story"', () => {
    expect(
      selectMode(snapshot({
        view: dynamicSequenceViewWithFlow,
        activeWalkthrough: { stepId: 'e1' },
        dynamicViewVariant: 'sequence',
        story,
      })).mode,
    ).toBe('walkthrough-flow')

    expect(
      selectMode(snapshot({
        view: dynamicSequenceViewWithFlow,
        activeWalkthrough: { stepId: 'e1' },
        dynamicViewVariant: 'sequence',
        story: null,
      })).mode,
    ).toBe('walkthrough-flow')
  })
})
