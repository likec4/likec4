import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn, ViewId } from '@likec4/core/types'
import { compareNatural } from '@likec4/core/utils'
import type { TreeNodeData } from '@mantine/core'
import { useMemo } from 'react'
import { useLikeC4Model } from './useLikeC4Model'

export interface LikeC4ModelTreeNodeData extends TreeNodeData {
  label: string
  value: Fqn
  children: LikeC4ModelTreeNodeData[]
  hasChildren: boolean
}

export const sortByLabel = (a: LikeC4ModelTreeNodeData, b: LikeC4ModelTreeNodeData): number =>
  compareNatural(a.label, b.label)

function buildNode(
  element: LikeC4Model.Node | LikeC4Model.Element,
): LikeC4ModelTreeNodeData {
  const children = [...element.children()].map(buildNode).sort(sortByLabel)
  return {
    label: element.title || element.id,
    value: element.id,
    children,
    hasChildren: children.length > 0,
  }
}

/**
 * Returns a tree of elements in the model.
 * If `viewId` is provided, returns the tree of elements in the view.
 */
export function useLikeC4ElementsTree(viewId?: ViewId): LikeC4ModelTreeNodeData[] {
  const model = useLikeC4Model()
  return useMemo(() => {
    if (viewId) {
      const view = model.view(viewId)
      return [...view.roots()].map(buildNode).sort(sortByLabel)
    } else {
      return [...model.roots()].map(buildNode).sort(sortByLabel)
    }
  }, [model, viewId])
}
