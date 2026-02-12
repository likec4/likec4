import type { AnyAux, AutoLayoutDirection, MarkdownOrString } from '@likec4/core/types'
import { FqnRef } from '@likec4/core/types'
import { nameFromFqn, parentFqn } from '@likec4/core/utils'

export function quoteString(value: string): string {
  if (value.includes('\'')) {
    return `"${value}"`
  }
  return `'${value}'`
}

export function quoteMarkdownOrString(value: MarkdownOrString): string {
  if (value.md) {
    return `'''\n${value.md}\n'''`
  }
  return quoteString(value.txt!)
}

export function printAutoLayoutDirection(direction: AutoLayoutDirection): string {
  switch (direction) {
    case 'TB':
      return 'TopBottom'
    case 'BT':
      return 'BottomTop'
    case 'LR':
      return 'LeftRight'
    case 'RL':
      return 'RightLeft'
    default:
      return direction
  }
}

export function printModelRef(ref: FqnRef.ModelRef): string {
  if (FqnRef.isImportRef(ref)) {
    return `@${ref.project}.${ref.model}`
  }
  return ref.model as string
}

export function printDeploymentRef(ref: FqnRef.DeploymentRef<AnyAux>): string {
  if (FqnRef.isInsideInstanceRef(ref)) {
    return `${ref.deployment}.${ref.element}`
  }
  return ref.deployment as string
}

export interface ElementTreeNode<E> {
  id: string
  name: string
  element: E
  children: ElementTreeNode<E>[]
}

export function buildTree<E extends { id: string }>(
  elements: Record<string, E>,
): ElementTreeNode<E>[] {
  const nodes = new Map<string, ElementTreeNode<E>>()
  const roots: ElementTreeNode<E>[] = []

  // Sort by FQN depth (shallowest first)
  const sorted = Object.values(elements).sort((a, b) => {
    const depthA = a.id.split('.').length
    const depthB = b.id.split('.').length
    return depthA - depthB
  })

  for (const element of sorted) {
    const id = element.id as string
    const name = nameFromFqn(id)
    const node: ElementTreeNode<E> = { id, name, element, children: [] }
    nodes.set(id, node)

    const parent = parentFqn(id)
    if (parent && nodes.has(parent)) {
      nodes.get(parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
