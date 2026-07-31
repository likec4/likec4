import type * as scalar from '../types/scalar'
import type { ProcessedDynamicView } from '../types/view'
import { DynamicViewFlow } from '../types/view-dynamic-flow'
import type { StoryFlow } from '../types/view-story-flow'

/**
 * Position within a story: the current scene, and — when that scene is itself a
 * dynamic view — the step within it.
 *
 * Traversal is a *composition* of two existing traversals, not one new flow
 * structure: `StoryFlow` walks scenes, and the pre-existing `DynamicViewFlow`
 * walks steps inside a scene that happens to be a dynamic view. Merging them
 * into a single flow was considered and rejected — `DynamicViewFlow`'s walker
 * resolves every step to an edge, and scenes are not edges. Keeping the two
 * traversals separate means this module only has to sequence "when do we hand
 * off between them", not reimplement either one. See RFC 0001, "The cursor is
 * a composition".
 */
export interface StoryCursor {
  readonly scene: scalar.StepPath
  readonly innerStep: scalar.StepPath | null
}

/**
 * Resolves a scene's view id to a dynamic view, or `null` when the scene's view
 * is not a dynamic view (and therefore has no inner steps to descend into).
 */
export type ResolveSceneView = (viewId: string) => ProcessedDynamicView<any> | null

/**
 * Looks up the `DynamicViewFlow` for a scene, or `null` if the scene's view is
 * not a dynamic view.
 */
function innerFlow(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  scene: scalar.StepPath,
): DynamicViewFlow<any> | null {
  const viewId = flow.lookup(scene)?.view
  if (!viewId) {
    return null
  }
  const view = resolve(viewId)
  return view ? DynamicViewFlow.from(view) : null
}

/**
 * Builds the cursor for entering `scene` fresh, seeding `innerStep` to the
 * scene's first or last step when it is a dynamic view, or `null` otherwise.
 *
 * For the `'last'` case, `DynamicViewFlow.paths` is filtered down to steps
 * (excluding subflow ids) and the final entry is taken. `paths` is backed by a
 * `Map` populated during a single synchronous depth-first walk in
 * `DynamicViewFlow`'s constructor, and `Map` iteration order is
 * insertion-order by spec — so `paths` reflects traversal order, and its last
 * step is the dynamic view's actual last step, not an arbitrary one.
 */
function enter(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  scene: scalar.StepPath,
  at: 'first' | 'last',
): StoryCursor {
  const inner = innerFlow(flow, resolve, scene)
  if (!inner) {
    return { scene, innerStep: null }
  }
  if (at === 'first') {
    return { scene, innerStep: inner.firstStep() }
  }
  const steps = inner.paths.filter(p => inner.isStep(p))
  return { scene, innerStep: steps.at(-1) ?? null }
}

/**
 * First position in the story: its first scene, entered on that scene's first
 * inner step if it is a dynamic view. Returns `null` if the story has no
 * scenes.
 */
export function firstCursor(flow: StoryFlow, resolve: ResolveSceneView): StoryCursor | null {
  const scene = flow.firstScene()
  return scene ? enter(flow, resolve, scene, 'first') : null
}

/**
 * Advances the cursor by one step: within the current scene's inner steps if
 * it is a dynamic view with more steps to visit, otherwise to the next scene
 * (entered on its first inner step, per {@link enter}). Returns `null` once
 * the end of the story is reached.
 */
export function nextCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  if (cursor.innerStep) {
    const inner = innerFlow(flow, resolve, cursor.scene)
    const next = inner?.prevAndNext(cursor.innerStep).next
    if (next) {
      return { scene: cursor.scene, innerStep: next }
    }
  }
  return nextSceneCursor(flow, resolve, cursor)
}

/**
 * Advances straight to the next scene, skipping any remaining inner steps of
 * the current scene. Returns `null` once the end of the story is reached.
 *
 * Exists as a deferred-decision hook: whether the UI exposes one Next/Previous
 * pair (via {@link nextCursor}/{@link prevCursor}) or a second, scene-level
 * pair is left open in RFC 0001. Exporting this now means adding that second
 * pair later is wiring a control up to an existing function, not restructuring
 * traversal.
 */
export function nextSceneCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  const next = flow.prevAndNext(cursor.scene).next
  return next ? enter(flow, resolve, next, 'first') : null
}

/**
 * Mirror image of {@link nextCursor}: steps backward within the current
 * scene's inner steps if possible, otherwise moves to the previous scene —
 * entered on its *last* inner step, per {@link enter}, so stepping back into a
 * dynamic scene lands where a viewer walking forward would have left it.
 * Returns `null` once the start of the story is reached.
 */
export function prevCursor(
  flow: StoryFlow,
  resolve: ResolveSceneView,
  cursor: StoryCursor,
): StoryCursor | null {
  if (cursor.innerStep) {
    const inner = innerFlow(flow, resolve, cursor.scene)
    const prev = inner?.prevAndNext(cursor.innerStep).prev
    if (prev) {
      return { scene: cursor.scene, innerStep: prev }
    }
  }
  const prevScene = flow.prevAndNext(cursor.scene).prev
  return prevScene ? enter(flow, resolve, prevScene, 'last') : null
}
