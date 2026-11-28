import type { LikeC4Model } from '@likec4/core/model'
import type { LayoutType, ViewId } from '@likec4/core/types'
import type { ReadableAtom } from 'nanostores'
import { useDidUpdate } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { atom, batch, batched, computed, readonlyType } from 'nanostores'
import { type PropsWithChildren, useState } from 'react'
import { LikeC4ViewCtx, useLikeC4ProjectContext } from './safeCtx'

function createViewContext($model: ReadableAtom<LikeC4Model.Layouted>, viewId: ViewId) {
  const $viewId = atom(viewId)
  const $layoutType = atom<LayoutType>('manual')
  const $viewContext = batched([$model, $viewId, $layoutType], (model, viewId, layoutType) => {
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
    /**
     * Switches to another view, back to the manual layout
     */
    setViewId: (viewId: ViewId) => {
      if ($viewId.get() === viewId) {
        return
      }
      batch(() => {
        $viewId.set(viewId)
        $layoutType.set('manual')
      })
    },
    setLayoutType: (layoutType: LayoutType) => $layoutType.set(layoutType),
  }
}

/**
 * The view the user is on: atoms of the view id, its view model and its view (in the selected layout)
 */
export type LikeC4ViewContextValue = ReturnType<typeof createViewContext>

/**
 * Provides the view the user is on, inside `LikeC4ProjectContext`
 */
export function LikeC4ViewContext({ viewId, children }: PropsWithChildren<{ viewId: ViewId }>) {
  const { $model } = useLikeC4ProjectContext()
  const [value, setValue] = useState(() => createViewContext($model, viewId))

  useDidUpdate(() => {
    setValue(createViewContext($model, viewId))
  }, [$model])

  useDidUpdate(() => {
    value.setViewId(viewId)
  }, [viewId])

  return (
    <LikeC4ViewCtx value={value}>
      {children}
    </LikeC4ViewCtx>
  )
}
