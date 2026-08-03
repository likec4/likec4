import { calcSceneOffset } from '@likec4/core'
import type { StoryCursor } from '@likec4/core'
import type { XYPoint } from '@likec4/core/geometry'
import type { LikeC4Model } from '@likec4/core/model'
import type { ComputedStoryScene, LayoutedView, StoryFlow, StorySceneLayout } from '@likec4/core/types'

/**
 * A scene resolved to the geometry the canvas should render: the target view,
 * translated by the offset that keeps it visually continuous with whatever is
 * currently on screen.
 */
export interface ResolvedScene {
  readonly view: LayoutedView
  readonly offset: XYPoint
}

/**
 * Positions of a view's nodes, keyed by node id.
 *
 * A node's id *is* its element FQN (`packages/core/src/compute-view/utils/buildComputedNodes.ts:46`),
 * so the same element occupies the same key across two different views — this
 * map is what {@link resolveScene} matches `outgoing` and `incoming` scenes by.
 */
export function positionsOf(view: LayoutedView): ReadonlyMap<string, XYPoint> {
  return new Map(view.nodes.map(node => [node.id as string, { x: node.x, y: node.y }]))
}

/**
 * Returns a copy of `view` with every node translated by `offset`.
 *
 * Returns `view` unchanged (same reference) when the offset is zero, so callers
 * that compare by reference (or skip re-rendering on an unchanged view) don't
 * pay for a translation that wouldn't move anything.
 */
export function applyOffset(view: LayoutedView, offset: XYPoint): LayoutedView {
  if (offset.x === 0 && offset.y === 0) {
    return view
  }
  return {
    ...view,
    nodes: view.nodes.map(node => ({
      ...node,
      x: node.x + offset.x,
      y: node.y + offset.y,
    })),
  } as LayoutedView
}

/**
 * Resolves a story scene to the view it should render, aligned against the
 * scene currently on screen (`outgoing`).
 *
 * A story owns no geometry of its own (RFC 0001, "A story is a view") — each
 * scene only names another view, and that view's layouted geometry is fetched
 * from `model` here, at render time. The alignment offset is translation-only
 * (see `calcSceneOffset`) and is computed from `outgoing` (positions of the
 * scene currently on screen) against the incoming scene's own layout.
 *
 * @returns `null` when the scene's view is missing from the model, or is not
 * (yet) layouted.
 */
export function resolveScene({ scene, model, outgoing, sceneLayout }: {
  scene: ComputedStoryScene<any>
  model: LikeC4Model<any>
  outgoing: ReadonlyMap<string, XYPoint>
  sceneLayout: StorySceneLayout
}): ResolvedScene | null {
  const viewModel = model.findView(scene.view)
  if (!viewModel || !viewModel.isLayouted()) {
    return null
  }
  const target = viewModel.$layouted
  const offset = calcSceneOffset(outgoing, positionsOf(target), sceneLayout)
  return {
    view: applyOffset(target, offset),
    offset,
  }
}

/**
 * Resolves the scene a story cursor currently points to, ready to dispatch as
 * `story.scene` to the main diagram machine.
 *
 * This is the pure step behind the story cursor's dispatch link
 * (`DiagramActorProvider.tsx`'s `StoryCursorSync`) — everything impure
 * (finding the model, finding the story actor, tracking what was previously
 * on screen) is the React layer's job; this function only looks the cursor's
 * scene up in `flow` and delegates to {@link resolveScene}.
 *
 * `previous` is the last *resolved* scene (already offset-applied) — i.e.
 * exactly what `story.scene` last carried as `view` — not the incoming
 * scene's own native layout. Aligning against what is actually on screen
 * keeps `anchored` mode's offsets from resetting to each scene's raw layout
 * every step; passing `null` (a story's first scene, or the first scene after
 * a fresh mid-session entry — `machine.state.navigating.ts`'s
 * `syncStoryActor`) is equivalent to an empty `outgoing` map, so the scene
 * renders at its own native layout with zero offset.
 *
 * @returns `null` when `cursor.scene` is unknown to `flow`, or when
 * {@link resolveScene} itself returns `null`.
 */
export function resolveCurrentScene({ cursor, flow, model, previous, sceneLayout }: {
  cursor: StoryCursor
  flow: StoryFlow
  model: LikeC4Model<any>
  previous: LayoutedView | null
  sceneLayout: StorySceneLayout
}): ResolvedScene | null {
  const scene = flow.lookup(cursor.scene)
  if (!scene) {
    return null
  }
  return resolveScene({
    scene,
    model,
    outgoing: previous ? positionsOf(previous) : new Map(),
    sceneLayout,
  })
}
