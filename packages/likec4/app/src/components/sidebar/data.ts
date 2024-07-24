import type { DiagramView } from '@likec4/core'
import { find, values } from 'remeda'
import { useLikeC4Views } from 'virtual:likec4/store'

interface DiagramTreeNodeData {
  label: string
  value: string
  children: DiagramTreeNodeData[]
}

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
        node = { label, value, children: [] }
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
      children: []
    })
    if (parent !== root) {
      parent.children.sort(compareTreeNodes)
    }
  }

  return root.children.sort(compareTreeNodes)
}

// const $diagramsTree = batched($views, views => buildDiagramTreeData(values(views)))

export function useDiagramsTreeData() {
  const views = useLikeC4Views() as unknown as Record<string, DiagramView>
  return buildDiagramTreeData(values(views))
}
