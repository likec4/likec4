import type { XYPoint } from '../geometry'
import type { LikeC4Model } from '../model/LikeC4Model'
import type { LayoutedView } from '../types/view'
import type { ComputedStoryScene } from '../types/view-computed'
import type { StorySceneLayout } from '../types/view-parsed.story'
import { calcSceneOffset } from './align'

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
