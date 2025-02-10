import { type Fqn, type LikeC4Model, type ViewId, compareNatural } from '@likec4/core'
import { useMemo } from 'react'
import { useLikeC4Model } from './useLikeC4Model'

interface LikeC4ModelTreeNodeData {
  label: string
  value: Fqn
  children: LikeC4ModelTreeNodeData[]
}

export const sortByLabel = (a: LikeC4ModelTreeNodeData, b: LikeC4ModelTreeNodeData) => compareNatural(a.label, b.label)

function buildNode(
  element: LikeC4Model.Node | LikeC4Model.Element,
): LikeC4ModelTreeNodeData {
  return {
    label: element.title,
    value: element.id,
    children: [...element.children()].map(buildNode).sort(sortByLabel),
  }
}

/**
 * Returns a tree of elements in the model.
 * If `viewId` is provided, returns the tree of elements in the view.
 */
export function useLikeC4ElementsTree(viewId?: ViewId): LikeC4ModelTreeNodeData[] {
  const model = useLikeC4Model(true)
  return useMemo(() => {
    if (viewId) {
      const view = model.view(viewId)
      return [...view.roots()].map(buildNode).sort(sortByLabel)
    } else {
      return [...model.roots()].map(buildNode).sort(sortByLabel)
    }
  }, [model, viewId ?? null])
}
