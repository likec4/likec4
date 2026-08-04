import { describe, expect, it } from 'vitest'
import { LikeC4Model } from '../model/LikeC4Model'
import { _stage, _type } from '../types/const'
import type { LayoutedView } from '../types/view'
import type { StorySceneLayout } from '../types/view-parsed.story'
import { applyOffset, positionsOf, resolveScene } from './resolveScene'

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
