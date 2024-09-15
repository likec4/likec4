import { type DiagramView, LikeC4DiagramModel, LikeC4Model, type ViewID } from '@likec4/core'
import { createContext, useContext } from 'react'
import type { LiteralUnion } from 'type-fest'

export const LikeC4ModelContext = createContext<LikeC4Model.Layouted | null>(null)

export function useLikeC4Model(): LikeC4Model.Layouted | null
export function useLikeC4Model(strict: true): LikeC4Model.Layouted
export function useLikeC4Model(strict?: boolean): LikeC4Model.Layouted | null {
  const model = useContext(LikeC4ModelContext)
  if (strict && !model) {
    throw new Error('No LikeC4ModelProvider in context')
  }
  return model
}

export function useLikeC4Views(): Readonly<Record<ViewID, DiagramView>> {
  return useLikeC4Model(true).sourcemodel.views
}

export function useLikeC4ViewModel(viewId: LiteralUnion<ViewID, string>): LikeC4DiagramModel {
  return useLikeC4Model(true).view(viewId)
}

export function useLikeC4View(viewId: LiteralUnion<ViewID, string>): DiagramView | null {
  try {
    return useLikeC4Model(true).view(viewId).view
  } catch (error) {
    console.error(error)
    return null
  }
}
