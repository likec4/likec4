import { type Element, type Fqn, type ViewID } from '@likec4/core'
import { useMemo } from 'react'
import { useLikeC4Model } from './useLikeC4Model'

interface LikeC4ModelTreeNodeData {
  label: string
  value: Fqn
  children: LikeC4ModelTreeNodeData[]
}

type TreeNode = Pick<Element, 'id' | 'title'>

function buildTree(
  roots: TreeNode[],
  children: (id: Fqn) => TreeNode[]
): LikeC4ModelTreeNodeData[] {
  const buildNode = (nd: TreeNode): LikeC4ModelTreeNodeData => {
    return {
      label: nd.title,
      value: nd.id,
      children: children(nd.id).map(child => buildNode(child))
    }
  }
  return roots.map(root => buildNode(root))
}

/**
 * Returns a tree of elements in the model.
 * If `viewId` is provided, returns the tree of elements in the view.
 */
export function useLikeC4ElementsTree(viewId?: ViewID): LikeC4ModelTreeNodeData[] {
  const model = useLikeC4Model(true)
  return useMemo(() => {
    if (viewId) {
      const view = model.view(viewId)
      const roots = view.roots().map(e => ({
        id: e.id,
        title: e.title
      }))
      return buildTree(
        roots,
        id =>
          view.children(id).map(e => ({
            id: e.id,
            title: e.title
          }))
      )
    } else {
      return buildTree(
        model.roots().map(e => ({
          id: e.id,
          title: e.title
        })),
        id =>
          model.children(id).map(e => ({
            id: e.id,
            title: e.title
          }))
      )
    }
  }, [model, viewId ?? null])
}
