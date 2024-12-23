import { compareNatural, nonexhaustive } from '@likec4/core'
import type { TreeNodeData } from '@mantine/core'
import { type DiagramView, ComputedView } from 'likec4/model'
import { useMemo } from 'react'
import { find, values } from 'remeda'
import { useLikeC4Model } from 'virtual:likec4/model'

interface DiagramTreeNodeData {
  label: string
  value: string
  type: 'file' | 'folder' | 'view' | 'deployment-view'
  children: DiagramTreeNodeData[]
}

export type GroupBy = 'by-files' | 'by-folders' | 'none'

export const isTreeNodeData = (node: TreeNodeData): node is DiagramTreeNodeData =>
  'type' in node && ['file', 'folder', 'view', 'deployment-view'].includes(node.type as any)

function dropFilename(relativePath: string) {
  if (relativePath === '') {
    return ''
  }
  return relativePath.split('/').slice(0, -1).join('/')
}

function compareTreeNodes(a: DiagramTreeNodeData, b: DiagramTreeNodeData) {
  if (a.children.length === 0 && b.children.length > 0) {
    return 1
  }
  if (a.children.length > 0 && b.children.length === 0) {
    return -1
  }
  return compareNatural(a.label, b.label)
}

function buildDiagramTreeData(views: DiagramView[], groupBy: GroupBy): DiagramTreeNodeData[] {
  const root: DiagramTreeNodeData = {
    value: '',
    label: 'Diagrams',
    type: 'folder',
    children: [],
  }

  const findParent = (path: string): DiagramTreeNodeData => {
    let parent = root
    if (path === '') {
      return parent
    }
    const segments = path.split('/')
    const traversed = ['@fs'] as string[]
    while (segments.length) {
      const label = segments.shift() as string
      traversed.push(label)
      const value = traversed.join('/')
      let node = find(parent.children!, n => n.value === value)
      if (!node) {
        node = { label, value, type: 'folder', children: [] }
        parent.children.push(node)
      }
      parent = node
    }
    return parent
  }

  for (const view of views) {
    let relativePath
    switch (groupBy) {
      case 'by-files':
        relativePath = view.relativePath ?? ''
        break
      case 'by-folders':
        relativePath = dropFilename(view.relativePath ?? '')
        break
      case 'none':
        relativePath = ''
        break
      default:
        nonexhaustive(groupBy)
    }
    const parent = findParent(relativePath)
    parent.children.push({
      value: view.id,
      label: view.title ?? view.id,
      type: ComputedView.isDeployment(view) ? 'deployment-view' : 'view',
      children: [],
    })
    if (parent !== root) {
      parent.children.sort(compareTreeNodes)
      if (groupBy === 'by-files' && parent.type !== 'file') {
        parent.type = 'file'
      }
    }
  }

  return root.children.sort(compareTreeNodes)
}

export function useDiagramsTreeData(groupBy: GroupBy = 'by-files') {
  const views = useLikeC4Model().$model.views
  return useMemo(() => buildDiagramTreeData(values(views), groupBy), [views, groupBy])
}
