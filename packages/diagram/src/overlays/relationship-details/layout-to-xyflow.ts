import {
  type Fqn,
  nonNullable,
  Queue,
  RichText,
} from '@likec4/core'
import { hasAtLeast } from 'remeda'
import { ZIndexes } from '../../base/const'
import type { RelationshipDetailsTypes } from './_types'
import type { LayoutResult } from './layout'

// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
export function layoutResultToXYFlow(
  layout: LayoutResult,
): {
  xynodes: RelationshipDetailsTypes.Node[]
  xyedges: RelationshipDetailsTypes.Edge[]
  bounds: { x: number; y: number; width: number; height: number }
} {
  const xynodes = [] as RelationshipDetailsTypes.Node[],
    xyedges = [] as RelationshipDetailsTypes.Edge[],
    nodeLookup = new Map<Fqn, LayoutResult.Node>()

  type TraverseItem = {
    node: LayoutResult.Node
    parent: LayoutResult.Node | null
  }
  const queue = Queue.from(layout.nodes.reduce(
    (acc, node) => {
      nodeLookup.set(node.id, node)
      if (!node.parent) {
        acc.push({ node, parent: null })
      }
      return acc
    },
    [] as TraverseItem[],
  ))
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let next: TraverseItem | undefined
  while ((next = queue.dequeue())) {
    const { node, parent } = next
    const isCompound = hasAtLeast(node.children, 1)
    if (isCompound) {
      for (const child of node.children) {
        queue.enqueue({ node: nodeById(child), parent: node })
      }
    }

    const position = {
      x: node.x,
      y: node.y,
    }
    if (parent) {
      position.x -= parent.x
      position.y -= parent.y
    }

    const id = node.id

    const base = {
      id,
      draggable: false,
      deletable: false,
      position,
      zIndex: isCompound ? ZIndexes.Compound : ZIndexes.Element,
      style: {
        width: node.width,
        height: node.height,
      },
      initialWidth: node.width,
      initialHeight: node.height,
      ...(parent && {
        parentId: parent.id,
      }),
    } satisfies Omit<RelationshipDetailsTypes.Node, 'data' | 'type'>

    const fqn = node.modelRef
    const navigateTo = { navigateTo: node.navigateTo ?? null }

    switch (true) {
      case isCompound: {
        xynodes.push(
          {
            ...base,
            type: 'compound',
            data: {
              id,
              column: node.column,
              title: node.title,
              color: node.color,
              style: node.style,
              depth: node.depth ?? 0,
              icon: node.icon ?? 'none',
              ports: node.ports,
              fqn,
              ...navigateTo,
            },
          },
        )
        break
      }
      default: {
        xynodes.push(
          {
            ...base,
            type: 'element' as const,
            data: {
              id,
              column: node.column,
              fqn,
              title: node.title,
              technology: node.technology,
              description: node.description ?? null,
              height: node.height,
              width: node.width,
              color: node.color,
              shape: node.shape,
              icon: node.icon ?? 'none',
              ports: node.ports,
              style: node.style,
              tags: node.tags,
              ...navigateTo,
            },
          },
        )
      }
    }
  }
  for (
    const {
      source,
      target,
      relationId,
      label,
      technology,
      description,
      navigateTo = null,
      color = 'gray',
      line = 'dashed',
      ...edge
    } of layout.edges
  ) {
    const id = edge.id
    xyedges.push({
      id,
      type: 'relationship',
      source,
      target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      // selectable: selectable,
      // hidden: !visiblePredicate(edge),
      deletable: false,
      data: {
        relationId,
        label,
        color,
        navigateTo,
        line,
        description: description ?? null,
        ...(technology && { technology }),
      },
    })
  }

  return {
    xynodes,
    xyedges,
    bounds: layout.bounds,
  }
}
