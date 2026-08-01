import { describe, expect, it } from 'vitest'
import { _type } from '../types/const'
import { StepPath } from '../types/scalar'
import type { ComputedStoryView } from '../types/view-computed'
import { StoryFlow } from '../types/view-story-flow'
import { nonNullable } from '../utils'
import { type ResolveSceneView, firstCursor, nextCursor, nextSceneCursor, prevCursor } from './cursor'

const SCENE_1 = StepPath(1) // 'step-01' — static scene
const SCENE_2 = StepPath(2) // 'step-02' — dynamic scene, resolves to view "dyn"
const SCENE_3 = StepPath(3) // 'step-03' — static scene

// The dynamic view "dyn" numbers its own steps independently of the scene ids
// above (every dynamic view starts its own step numbering at 1). Distinct
// numbers here keep a scene/innerStep parameter mix-up in the implementation
// from accidentally producing a passing test.
const INNER_1 = StepPath(11)
const INNER_2 = StepPath(12)

const storyView = {
  [_type]: 'story',
  scenes: [
    { id: SCENE_1, view: 'static1', astPath: '/a' },
    { id: SCENE_2, view: 'dyn', astPath: '/b' },
    { id: SCENE_3, view: 'static2', astPath: '/c' },
  ],
} as unknown as ComputedStoryView

// `dyn` has two steps. `DynamicViewFlow` resolves every step to an edge (with a
// source/target node), so the stub needs minimal-but-real nodes/edges, not
// empty arrays — otherwise its constructor throws before the cursor is exercised.
const resolve: ResolveSceneView = (viewId) =>
  viewId === 'dyn'
    ? ({
      id: 'dyn',
      flow: [INNER_1, INNER_2],
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [
        { id: INNER_1, source: 'a', target: 'b' },
        { id: INNER_2, source: 'b', target: 'a' },
      ],
    } as any)
    : null

describe('story cursor', () => {
  const flow = StoryFlow.from(storyView)

  it('starts on the first scene with no inner step for a static view', () => {
    expect(firstCursor(flow, resolve)).toEqual({ scene: SCENE_1, innerStep: null })
  })

  it('seeds the inner step when entering a dynamic scene', () => {
    const c = nextCursor(flow, resolve, { scene: SCENE_1, innerStep: null })
    expect(c).toEqual({ scene: SCENE_2, innerStep: INNER_1 })
  })

  it('advances within a dynamic scene before leaving it', () => {
    const c = nextCursor(flow, resolve, { scene: SCENE_2, innerStep: INNER_1 })
    expect(c).toEqual({ scene: SCENE_2, innerStep: INNER_2 })
  })

  it('leaves a dynamic scene once its steps are exhausted', () => {
    // Chained from the real entry point rather than a hand-picked cursor: if
    // `resolve` silently failed to resolve the dynamic scene (e.g. returned
    // null unconditionally), `entered` and `advanced` below would already
    // diverge from the asserted values — both would show `innerStep: null`
    // instead of genuinely walking into "dyn"'s two steps. That rules out
    // this test passing merely because a broken inner resolution and a
    // genuinely exhausted inner flow happen to produce the same fallback
    // shape `{ scene: SCENE_3, innerStep: null }`.
    const entered = nextCursor(flow, resolve, { scene: SCENE_1, innerStep: null })
    expect(entered).toEqual({ scene: SCENE_2, innerStep: INNER_1 })

    const advanced = nextCursor(flow, resolve, nonNullable(entered))
    expect(advanced).toEqual({ scene: SCENE_2, innerStep: INNER_2 })

    const left = nextCursor(flow, resolve, nonNullable(advanced))
    expect(left).toEqual({ scene: SCENE_3, innerStep: null })
  })

  it('returns null at the end of the story', () => {
    expect(nextCursor(flow, resolve, { scene: SCENE_3, innerStep: null })).toBeNull()
  })

  it('re-enters a dynamic scene on its last step when going backwards', () => {
    const c = prevCursor(flow, resolve, { scene: SCENE_3, innerStep: null })
    expect(c).toEqual({ scene: SCENE_2, innerStep: INNER_2 })
  })

  it('steps backward within a dynamic scene before leaving it', () => {
    const c = prevCursor(flow, resolve, { scene: SCENE_2, innerStep: INNER_2 })
    expect(c).toEqual({ scene: SCENE_2, innerStep: INNER_1 })
  })

  it('returns null before the start of the story', () => {
    expect(prevCursor(flow, resolve, { scene: SCENE_1, innerStep: null })).toBeNull()
  })

  it('nextSceneCursor skips a dynamic scene’s remaining steps', () => {
    const c = nextSceneCursor(flow, resolve, { scene: SCENE_2, innerStep: INNER_1 })
    expect(c).toEqual({ scene: SCENE_3, innerStep: null })
  })
})
