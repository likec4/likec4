import {
  type Fqn,
  GroupElementKind,
  invariant,
  nonNullable,
  Queue,
} from '@likec4/core'
import { useDeepCompareMemo } from '@react-hookz/web'
import { hasAtLeast } from 'remeda'
import { ZIndexes } from '../../base/const'
import type { RelationshipsBrowserTypes } from './_types'
import { LayoutRelationshipsViewResult } from './layout'

// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
export function viewToNodesEdge(
  view: Pick<LayoutRelationshipsViewResult, 'nodes' | 'edges'>,
): {
  xynodes: RelationshipsBrowserTypes.AnyNode[]
  xyedges: RelationshipsBrowserTypes.Edge[]
} {
  const xynodes = [] as RelationshipsBrowserTypes.AnyNode[],
    xyedges = [] as RelationshipsBrowserTypes.Edge[],
    nodeLookup = new Map<Fqn, LayoutRelationshipsViewResult.Node>()

  type TraverseItem = {
    node: LayoutRelationshipsViewResult.Node
    parent: LayoutRelationshipsViewResult.Node | null
  }
  const queue = Queue.from(view.nodes.reduce(
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
    const isCompound = hasAtLeast(node.children, 1) || node.kind == GroupElementKind
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
    } satisfies Omit<RelationshipsBrowserTypes.AnyNode, 'data' | 'type'>

    const fqn = node.modelRef ?? null
    // const deploymentRef = DiagramNode.deploymentRef(node)
    // if (!fqn) {
    //   console.error('Invalid node', node)
    //   throw new Error('Element should have either modelRef or deploymentRef')
    // }

    const navigateTo = { navigateTo: node.navigateTo ?? null }

    switch (true) {
      case node.kind === LayoutRelationshipsViewResult.Empty: {
        xynodes.push(
          {
            ...base,
            type: 'empty',
            data: {
              column: node.column,
            },
          },
        )
        break
      }

      case isCompound && !!fqn: {
        xynodes.push(
          {
            ...base,
            type: 'compound',
            data: {
              id,
              column: node.column,
              title: node.title,
              color: node.color,
              shape: node.shape,
              style: node.style,
              depth: node.depth ?? 0,
              icon: node.icon ?? 'none',
              ports: node.ports,
              existsInCurrentView: node.existsInCurrentView,
              fqn,
              ...navigateTo,
            },
          },
        )
        break
      }
      default: {
        invariant(fqn, 'Element should have either modelRef or deploymentRef')
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
              description: node.description,
              height: node.height,
              width: node.width,
              color: node.color,
              shape: node.shape,
              icon: node.icon ?? 'none',
              ports: node.ports,
              style: node.style,
              existsInCurrentView: node.existsInCurrentView,
              tags: node.tags,
              ...navigateTo,
            },
          },
        )
      }
    }
  }
  for (const edge of view.edges) {
    const source = edge.source
    const target = edge.target
    const id = edge.id

    if (!hasAtLeast(edge.points, 2)) {
      console.error('edge should have at least 2 points', edge)
      continue
    }

    if (!hasAtLeast(edge.relations, 1)) {
      console.error('edge should have at least 1 relation', edge)
      continue
    }

    xyedges.push({
      id,
      type: 'relationship',
      source,
      target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      // selectable: selectable,
      // hidden: !visiblePredicate(edge),
      // deletable: false,
      data: {
        sourceFqn: edge.sourceFqn,
        targetFqn: edge.targetFqn,
        relations: edge.relations,
        color: edge.color ?? 'gray',
        label: edge.label,
        navigateTo: edge.navigateTo ?? null,
        line: edge.line ?? 'dashed',
        existsInCurrentView: edge.existsInCurrentView,
      },
      interactionWidth: 20,
    })
  }

  return {
    xynodes,
    xyedges,
  }
}

export function useViewToNodesEdges({ edges, nodes }: LayoutRelationshipsViewResult) {
  return useDeepCompareMemo(() => {
    return viewToNodesEdge({
      nodes,
      edges,
    })
  }, [nodes, edges])
}
