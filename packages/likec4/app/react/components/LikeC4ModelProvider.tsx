import { type LayoutedLikeC4Model, LikeC4Model as OrginLikeC4Model, type ViewID } from '@likec4/core'
import {
  LikeC4ModelProvider as Provider,
  useLikeC4Model as useLikeC4ModelGeneric,
  useLikeC4View as useLikeC4ViewGeneric,
  useLikeC4ViewModel as useLikeC4ViewModelGeneric,
  useLikeC4Views as useLikeC4ViewsGeneric
} from '@likec4/diagram'
import { type PropsWithChildren } from 'react'
import type { LikeC4DiagramModel, LikeC4Model, ViewData } from './types'

interface LikeC4ModelProviderProps extends
  PropsWithChildren<{
    value: LikeC4Model
  }>
{
}

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider({
  value,
  children
}: LikeC4ModelProviderProps) {
  const model = useLikeC4ModelGeneric()

  if (model) {
    return <>{children}</>
  }

  return (
    <Provider likec4model={value}>
      {children}
    </Provider>
  )
}

export function useLikeC4View<ViewId extends string>(viewId: ViewId): ViewData<ViewId> {
  const view = useLikeC4ViewGeneric(viewId)
  if (!view) {
    throw new Error(`View not found: ${viewId}`)
  }
  return view as any
}

export function useLikeC4Views<ViewId extends string = ViewID>(): Readonly<Record<ViewId, ViewData<ViewId>>> {
  return useLikeC4ViewsGeneric() as any
}

export function useLikeC4ViewModel<ViewId extends string>(viewId: ViewId): LikeC4DiagramModel {
  return useLikeC4ViewModelGeneric(viewId)
}

export function useLikeC4Model(): LikeC4Model {
  return useLikeC4ModelGeneric(true)
}

export function createLikeC4Model(model: LayoutedLikeC4Model): LikeC4Model {
  return OrginLikeC4Model.layouted(model)
}
