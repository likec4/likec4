import dagre, { type GraphLabel, type Label } from '@dagrejs/dagre'
import {
  type AbstractRelation,
  type DiagramEdge,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type LikeC4Model,
  type XYPoint,
  compareFqnHierarchically,
  compareRelations,
  DiagramNode,
  invariant,
  isAncestor,
  nonNullable,
  Queue,
} from '@likec4/core'
import { useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import { useMemo } from 'react'
import { filter, first, forEach, hasAtLeast, isTruthy, map, pipe, prop, reverse, sort, sortBy, takeWhile } from 'remeda'
import { ZIndexes } from '../../base/const'
import { useLikeC4Model } from '../../likec4model'
import type { RelationshipDetailsTypes } from './_types'
import type { RelationshipDetailsSnapshot } from './actor'
import {
  type RelationshipDetailsViewData,
  computeEdgeDetailsViewData,
  computeRelationshipDetailsViewData,
} from './compute'
import { useRelationshipDetailsActor, useRelationshipDetailsState } from './hooks'
import { type LayoutResult, layoutRelationshipDetails } from './layout'

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
  const ns = ''
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
      x: node.position[0],
      y: node.position[1],
    }
    if (parent) {
      position.x -= parent.position[0]
      position.y -= parent.position[1]
    }

    const id = ns + node.id

    const base = {
      id,
      draggable: false,
      selectable: true,
      focusable: true,
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
        parentId: ns + parent.id,
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
              column: node.column,
              fqn,
              title: node.title,
              technology: node.technology,
              description: node.description,
              height: node.height,
              width: node.width,
              color: node.color,
              shape: node.shape,
              icon: node.icon ?? 'none',
              ports: node.ports,
              style: node.style,
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
    const id = ns + edge.id
    xyedges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      zIndex: ZIndexes.Edge,
      // selectable: selectable,
      // hidden: !visiblePredicate(edge),
      deletable: false,
      data: {
        relationId,
        label,
        color,
        navigateTo,
        line,
        ...(technology && { technology }),
        ...(description && { description }),
      },
    })
  }

  return {
    xynodes,
    xyedges,
    bounds: layout.bounds,
  }
}
