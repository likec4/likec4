import type { LikeC4Model } from '@likec4/core/model'
import type { LayoutType, ViewId } from '@likec4/core/types'
import type { ReadableAtom } from 'nanostores'
import { shallowEqual } from 'fast-equals'
import { atom, batched, computed, readonlyType } from 'nanostores'
import { type PropsWithChildren, useMemo } from 'react'
import { LikeC4ViewCtx, useLikeC4ProjectContext } from './safeCtx'

function createViewContext($model: ReadableAtom<LikeC4Model.Layouted>, viewId: ViewId) {
  const $viewId = atom(viewId)
  const $layoutType = atom<LayoutType>('manual')
  const $viewContext = batched([$model, $layoutType], (model, layoutType) => {
    const viewModel = model.findView(viewId)
    if (viewModel) {
      return {
        viewModel,
        view: layoutType === 'auto' ? viewModel.$view : viewModel.$layouted,
      } as const
    }
    return {
      viewModel: null,
      view: null,
    }
  })
  $viewContext.eq = shallowEqual
  return {
    $viewId: readonlyType($viewId),
    $viewModel: computed($viewContext, context => context.viewModel),
    $view: computed($viewContext, context => context.view),
    setLayoutType: (layoutType: LayoutType) => $layoutType.set(layoutType),
  }
}

/**
 * The view the user is on: atoms of the view id, its view model and its view (in the selected layout)
 */
export type LikeC4ViewContextValue = ReturnType<typeof createViewContext>

/**
 * Provides the view the user is on, inside `LikeC4ProjectContext`.
 * A new view id creates a new context, so children read the new view in the same render,
 * and the layout is back to manual.
 */
export function LikeC4ViewContext({ viewId, children }: PropsWithChildren<{ viewId: ViewId }>) {
  const { $model } = useLikeC4ProjectContext()
  const value = useMemo(() => createViewContext($model, viewId), [$model, viewId])
  return (
    <LikeC4ViewCtx value={value}>
      {children}
    </LikeC4ViewCtx>
  )
}
