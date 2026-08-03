import type { ResolveSceneView } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { ProcessedDynamicView } from '@likec4/core/types'
import { useCallbackRef } from '../hooks'
import { useLikeC4Model } from '../hooks/useLikeC4Model'

/**
 * Resolves a scene's view id to a dynamic view, or `null` when the view is
 * missing from the model or is not a dynamic view.
 *
 * This is the real counterpart to the story actor's `resolve: () => null`
 * placeholder (`./actor.ts`, spawned from `machine.ts`): an XState actor
 * cannot reach `useLikeC4Model`, so scene resolution is supplied from
 * whoever drives the actor and does have model access. `.$view` (rather than
 * `.$layouted`) is used because inner-step traversal (`DynamicViewFlow`)
 * only reads flow/step structure, not geometry, so this works the same
 * whether the model is computed or layouted.
 */
export function resolveSceneView(model: LikeC4Model<any>, viewId: string): ProcessedDynamicView<any> | null {
  const viewModel = model.findView(viewId)
  return viewModel?.isDynamicView() ? viewModel.$view : null
}

/**
 * React-layer supply of the story actor's real `ResolveSceneView`: reads the
 * model via `useLikeC4Model` (the same accessor `LikeC4View.tsx` uses to
 * resolve a view by id) and binds it to {@link resolveSceneView}.
 *
 * `useCallbackRef` keeps the returned function's identity stable across
 * renders while always calling through to the latest `model`, so a caller
 * that sends this to the story actor (e.g. `StoryControls.tsx`) doesn't
 * re-fire an effect keyed on it every render.
 */
export function useResolveSceneView(): ResolveSceneView {
  const model = useLikeC4Model()
  return useCallbackRef((viewId: string) => resolveSceneView(model, viewId))
}
