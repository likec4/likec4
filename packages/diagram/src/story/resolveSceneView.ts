import type { ResolveSceneView } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { ProcessedDynamicView } from '@likec4/core/types'
import { useCallbackRef } from '../hooks'
import { useOptionalLikeC4Model } from '../hooks/useLikeC4Model'

/**
 * Resolves a scene's view id to a dynamic view, or `null` when the view is
 * missing from the model or is not a dynamic view.
 *
 * This is the real counterpart to the story actor's `resolve: () => null`
 * placeholder used when no model is available (see
 * {@link useOptionalResolveSceneView}): an XState actor cannot reach
 * `useLikeC4Model`, so scene resolution is supplied from whoever drives the
 * actor and does have model access. `.$view` (rather than `.$layouted`) is
 * used because inner-step traversal (`DynamicViewFlow`) only reads flow/step
 * structure, not geometry, so this works the same whether the model is
 * computed or layouted.
 */
export function resolveSceneView(model: LikeC4Model<any>, viewId: string): ProcessedDynamicView<any> | null {
  const viewModel = model.findView(viewId)
  return viewModel?.isDynamicView() ? viewModel.$view : null
}

/**
 * React-layer supply of the story actor's real `ResolveSceneView`, for
 * `DiagramActorProvider.tsx` to feed into the diagram machine's `input`
 * (`context.resolve`, read by both of the actor's spawn sites — `machine.ts`'s
 * root `entry:` and `machine.state.navigating.ts`'s `syncStoryActor`).
 *
 * Uses `useOptionalLikeC4Model` rather than the throwing `useLikeC4Model`
 * (contrast `LikeC4View.tsx`'s view-by-id resolution): unlike `StoryControls.tsx`,
 * which only mounts when the current view already is a story,
 * `DiagramActorProvider.tsx` mounts unconditionally for every view type, so it
 * cannot assume a `LikeC4ModelProvider` is present. With no model, this
 * degrades to the same `() => null` placeholder every scene already tolerates
 * (`cursor.ts`'s functions treat a `null` resolve result as "not a dynamic
 * view").
 *
 * `useCallbackRef` keeps the returned function's identity stable across
 * renders while always calling through to the latest `model`, so passing it
 * once as machine `input` is enough — it never needs a follow-up update event
 * to see a model that arrives or changes later.
 */
export function useOptionalResolveSceneView(): ResolveSceneView {
  const model = useOptionalLikeC4Model()
  return useCallbackRef((viewId: string) => model ? resolveSceneView(model, viewId) : null)
}
