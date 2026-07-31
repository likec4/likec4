import { describe, expect, it } from 'vitest'
import { _type } from '../types/const'
import type { ComputedStoryView } from '../types/view-computed'
import { StoryFlow } from '../types/view-story-flow'
import { type ResolveSceneView, firstCursor, nextCursor, nextSceneCursor, prevCursor } from './cursor'

const storyView = {
  [_type]: 'story',
  scenes: [
    { id: 'step-01', view: 'static1', astPath: '/a' },
    { id: 'step-02', view: 'dyn', astPath: '/b' },
    { id: 'step-03', view: 'static2', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

// `dyn` has two steps. `DynamicViewFlow` resolves every step to an edge (with a
// source/target node), so the stub needs minimal-but-real nodes/edges, not
// empty arrays — otherwise its constructor throws before the cursor is exercised.
const resolve: ResolveSceneView = (viewId) =>
  viewId === 'dyn'
    ? ({
      id: 'dyn',
      flow: ['step-01', 'step-02'],
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [
        { id: 'step-01', source: 'a', target: 'b' },
        { id: 'step-02', source: 'b', target: 'a' },
      ],
    } as any)
    : null

describe('story cursor', () => {
  const flow = StoryFlow.from(storyView)

  it('starts on the first scene with no inner step for a static view', () => {
    expect(firstCursor(flow, resolve)).toEqual({ scene: 'step-01', innerStep: null })
  })

  it('seeds the inner step when entering a dynamic scene', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-01', innerStep: null })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-01' })
  })

  it('advances within a dynamic scene before leaving it', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-01' })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-02' })
  })

  it('leaves a dynamic scene once its steps are exhausted', () => {
    const c = nextCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-02' })
    expect(c).toEqual({ scene: 'step-03', innerStep: null })
  })

  it('returns null at the end of the story', () => {
    expect(nextCursor(flow, resolve, { scene: 'step-03', innerStep: null })).toBeNull()
  })

  it('re-enters a dynamic scene on its last step when going backwards', () => {
    const c = prevCursor(flow, resolve, { scene: 'step-03', innerStep: null })
    expect(c).toEqual({ scene: 'step-02', innerStep: 'step-02' })
  })

  it('returns null before the start of the story', () => {
    expect(prevCursor(flow, resolve, { scene: 'step-01', innerStep: null })).toBeNull()
  })

  it('nextSceneCursor skips a dynamic scene’s remaining steps', () => {
    const c = nextSceneCursor(flow, resolve, { scene: 'step-02', innerStep: 'step-01' })
    expect(c).toEqual({ scene: 'step-03', innerStep: null })
  })
})
