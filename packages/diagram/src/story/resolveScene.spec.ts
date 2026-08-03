import type { StoryCursor } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import type { ComputedStoryView, LayoutedView, StorySceneLayout } from '@likec4/core/types'
import { _stage, _type, StepPath, StoryFlow } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { applyOffset, positionsOf, resolveCurrentScene, resolveScene } from './resolveScene'

// Minimal fixture — `positionsOf`/`applyOffset` only look at `nodes[].id/x/y`,
// so the rest of the view shape is irrelevant to these pure helpers.
const view = {
  id: 'v1',
  [_type]: 'element',
  [_stage]: 'layouted',
  nodes: [
    { id: 'a', x: 100, y: 100, width: 10, height: 10 },
    { id: 'b', x: 200, y: 100, width: 10, height: 10 },
  ],
  edges: [],
} as unknown as LayoutedView

describe('positionsOf', () => {
  it('maps node id to position', () => {
    expect([...positionsOf(view)]).toEqual([
      ['a', { x: 100, y: 100 }],
      ['b', { x: 200, y: 100 }],
    ])
  })
})

describe('applyOffset', () => {
  it('translates every node and leaves the original untouched', () => {
    const moved = applyOffset(view, { x: -50, y: 25 })
    expect(moved.nodes.map(n => [n.x, n.y])).toEqual([[50, 125], [150, 125]])
    expect(view.nodes[0]!.x).toBe(100)
  })

  it('is a no-op for a zero offset', () => {
    expect(applyOffset(view, { x: 0, y: 0 })).toBe(view)
  })
})

describe('resolveScene', () => {
  // A minimal, hand-rolled layouted view for the target scene: two nodes,
  // one ('shared') overlapping the id used in `outgoing` so `anchored` mode
  // has something to align against.
  const targetView = {
    id: 'scene-view',
    [_type]: 'element',
    [_stage]: 'layouted',
    nodes: [
      { id: 'shared', x: 0, y: 0, width: 10, height: 10, tags: [] },
      { id: 'only-in-target', x: 40, y: 0, width: 10, height: 10, tags: [] },
    ],
    edges: [],
  } as unknown as LayoutedView

  const model = LikeC4Model.fromDump({
    _stage: 'layouted',
    specification: { elements: {} },
    deployments: {},
    views: {
      'scene-view': targetView,
    },
  })

  const scene = {
    id: 'step-01',
    view: 'scene-view',
    astPath: 'scenes@0',
  } as any

  it('returns null when the scene view is missing from the model', () => {
    const result = resolveScene({
      scene: { ...scene, view: 'does-not-exist' },
      model,
      outgoing: new Map(),
      sceneLayout: 'anchored' as StorySceneLayout,
    })
    expect(result).toBeNull()
  })

  it('resolves the scene and aligns it against the outgoing positions', () => {
    // Outgoing scene currently shows 'shared' at (30, 0), 10px right of where
    // the target view lays it out (0, 0) — so anchored mode should translate
    // the incoming scene by (+30, 0) to keep 'shared' visually still.
    const outgoing = new Map([['shared', { x: 30, y: 0 }]])

    const resolved = resolveScene({
      scene,
      model,
      outgoing,
      sceneLayout: 'anchored' as StorySceneLayout,
    })

    expect(resolved).not.toBeNull()
    expect(resolved!.offset).toEqual({ x: 30, y: 0 })
    expect(resolved!.view.nodes.map(n => [n.id, n.x, n.y])).toEqual([
      ['shared', 30, 0],
      ['only-in-target', 70, 0],
    ])
  })

  it('returns a zero offset in independent mode', () => {
    const outgoing = new Map([['shared', { x: 30, y: 0 }]])

    const resolved = resolveScene({
      scene,
      model,
      outgoing,
      sceneLayout: 'independent' as StorySceneLayout,
    })

    expect(resolved!.offset).toEqual({ x: 0, y: 0 })
    expect(resolved!.view).toBe(targetView)
  })
})

describe('resolveCurrentScene', () => {
  // Reuses `resolveScene`'s `model`/`targetView` fixtures above — this suite
  // only exercises the cursor-lookup and `previous`-vs-`outgoing` wiring on
  // top of them, not scene resolution itself (already covered above).
  const model = LikeC4Model.fromDump({
    _stage: 'layouted',
    specification: { elements: {} },
    deployments: {},
    views: {
      'scene-view': {
        id: 'scene-view',
        [_type]: 'element',
        [_stage]: 'layouted',
        nodes: [
          { id: 'shared', x: 0, y: 0, width: 10, height: 10, tags: [] },
          { id: 'only-in-target', x: 40, y: 0, width: 10, height: 10, tags: [] },
        ],
        edges: [],
      } as unknown as LayoutedView,
    },
  })

  const flow = StoryFlow.from({
    [_type]: 'story',
    scenes: [
      { id: StepPath(1), view: 'scene-view', astPath: '/a' },
    ],
  } as unknown as ComputedStoryView)

  const cursor: StoryCursor = { scene: StepPath(1), innerStep: null }

  it('returns null when the cursor points to a scene unknown to flow', () => {
    const result = resolveCurrentScene({
      cursor: { scene: StepPath(99), innerStep: null },
      flow,
      model,
      previous: null,
      sceneLayout: 'anchored' as StorySceneLayout,
    })
    expect(result).toBeNull()
  })

  it('resolves with a zero offset when there is no previous scene on screen', () => {
    const resolved = resolveCurrentScene({
      cursor,
      flow,
      model,
      previous: null,
      sceneLayout: 'anchored' as StorySceneLayout,
    })
    expect(resolved).not.toBeNull()
    expect(resolved!.offset).toEqual({ x: 0, y: 0 })
  })

  it('aligns against the previous (already offset-applied) scene, not the incoming scene\'s native layout', () => {
    // 'shared' was last shown at (30, 0) -- 30px right of where 'scene-view'
    // lays it out natively (0, 0) -- so anchored mode should offset by (+30, 0)
    // exactly like `resolveScene`'s own `outgoing`-map test above.
    const previous = {
      id: 'prev-scene',
      [_type]: 'element',
      [_stage]: 'layouted',
      nodes: [
        { id: 'shared', x: 30, y: 0, width: 10, height: 10, tags: [] },
      ],
      edges: [],
    } as unknown as LayoutedView

    const resolved = resolveCurrentScene({
      cursor,
      flow,
      model,
      previous,
      sceneLayout: 'anchored' as StorySceneLayout,
    })

    expect(resolved!.offset).toEqual({ x: 30, y: 0 })
  })

  it('forces a zero offset in independent mode regardless of previous', () => {
    const previous = {
      id: 'prev-scene',
      [_type]: 'element',
      [_stage]: 'layouted',
      nodes: [
        { id: 'shared', x: 30, y: 0, width: 10, height: 10, tags: [] },
      ],
      edges: [],
    } as unknown as LayoutedView

    const resolved = resolveCurrentScene({
      cursor,
      flow,
      model,
      previous,
      sceneLayout: 'independent' as StorySceneLayout,
    })

    expect(resolved!.offset).toEqual({ x: 0, y: 0 })
  })
})
