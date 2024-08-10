import type { DiagramView } from '@likec4/core'
import type { TreeNodeData } from '@mantine/core'
import { useMemo } from 'react'
import { find, isTruthy, values } from 'remeda'
import { useLikeC4Views } from 'virtual:likec4/store'

interface DiagramTreeNodeData {
  label: string
  value: string
  type: 'file' | 'folder' | 'diagram'
  children: DiagramTreeNodeData[]
}

export const isTreeNodeData = (node: TreeNodeData): node is DiagramTreeNodeData =>
  'type' in node && ['file', 'folder', 'diagram'].includes(node.type as any)

function compareTreeNodes(a: DiagramTreeNodeData, b: DiagramTreeNodeData) {
  if (a.children.length === 0 && b.children.length > 0) {
    return 1
  }
  if (a.children.length > 0 && b.children.length === 0) {
    return -1
  }
  return a.label.localeCompare(b.label)
}

function buildDiagramTreeData(views: DiagramView[]): DiagramTreeNodeData[] {
  const root: DiagramTreeNodeData = {
    value: '',
    label: 'Diagrams',
    type: 'folder',
    children: []
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
    const parent = findParent(view.relativePath ?? '')
    parent.children.push({
      value: view.id,
      label: view.title ?? view.id,
      type: 'diagram',
      children: []
    })
    if (parent !== root) {
      parent.children.sort(compareTreeNodes)
      if (isTruthy(view.relativePath) && parent.type !== 'file') {
        parent.type = 'file'
      }
    }
  }

  return root.children.sort(compareTreeNodes)
}

// const $diagramsTree = batched($views, views => buildDiagramTreeData(values(views)))

export function useDiagramsTreeData() {
  const views = useLikeC4Views() as unknown as Record<string, DiagramView>
  return useMemo(() => buildDiagramTreeData(values(views)), [views])
}
