import {
  type DiagramEdge,
  type DiagramView,
  type Fqn,
  type WhereOperator,
  DiagramNode,
  ElementKind,
  invariant,
  nonNullable,
  whereOperatorAsPredicate,
} from '@likec4/core'
import { useDeepCompareMemo } from '@react-hookz/web'
import Queue from 'mnemonist/queue'
import { hasAtLeast } from 'remeda'
import { ZIndexes } from '../xyflow/const'
import type { Types } from './types'

// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
function viewToNodesEdge(opts: {
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | '__'>
  where: WhereOperator<string, string> | undefined
  nodesDraggable: boolean
  nodesSelectable: boolean
}): {
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const {
    view,
    nodesDraggable: draggable,
    nodesSelectable: selectable,
  } = opts
  const isDynamicView = view.__ === 'dynamic',
    xynodes = [] as Types.Node[],
    xyedges = [] as Types.Edge[],
    nodeLookup = new Map<Fqn, DiagramNode>()

  type TraverseItem = {
    node: DiagramNode
    parent: DiagramNode | null
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

  let visiblePredicate = (_nodeOrEdge: DiagramNode | DiagramEdge): boolean => true
  if (opts.where) {
    try {
      visiblePredicate = whereOperatorAsPredicate(opts.where)
    } catch (e) {
      console.error('Error in where filter:', e)
    }
  }

  // const visiblePredicate = opts.where ? whereOperatorAsPredicate(opts.where) : () => true

  // namespace to force unique ids
  const ns = ''
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let next: TraverseItem | undefined
  while ((next = queue.dequeue())) {
    const { node, parent } = next
    const isCompound = hasAtLeast(node.children, 1) || node.kind == ElementKind.Group
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
      draggable: draggable,
      selectable: selectable && node.kind !== ElementKind.Group,
      focusable: selectable && !isCompound,
      deletable: false,
      position,
      zIndex: isCompound ? ZIndexes.Compound : ZIndexes.Element,
      style: {
        width: node.width,
        height: node.height,
      },
      initialWidth: node.width,
      initialHeight: node.height,
      hidden: node.kind !== ElementKind.Group && !visiblePredicate(node),
      ...(parent && {
        parentId: ns + parent.id,
      }),
    } satisfies Omit<Types.Node, 'data' | 'type'>

    const compoundData = {
      title: node.title,
      color: node.color,
      shape: node.shape,
      style: node.style,
      depth: node.depth ?? 0,
      icon: node.icon ?? null,
    } satisfies Types.CompoundNodeData

    const leafNodeData = {
      title: node.title,
      technology: node.technology,
      description: node.description,
      height: node.height,
      width: node.width,
      level: node.level,
      color: node.color,
      shape: node.shape,
      icon: node.icon ?? null,
    } satisfies Types.LeafNodeData

    if (node.kind === ElementKind.Group) {
      xynodes.push({
        ...base,
        type: 'view-group',
        data: {
          isViewGroup: true,
          ...compoundData,
        },
        dragHandle: '.likec4-compound-title',
      })
    }

    const modelRef = DiagramNode.modelRef(node)
    const deploymentRef = DiagramNode.deploymentRef(node)
    if (!modelRef && !deploymentRef) {
      console.error('Invalid node', node)
      throw new Error('Element should have either modelRef or deploymentRef')
    }

    const navigateTo = { navigateTo: node.navigateTo ?? null }

    switch (true) {
      case isCompound && !!deploymentRef: {
        xynodes.push(
          {
            ...base,
            type: 'compound-deployment',
            data: {
              ...compoundData,
              ...navigateTo,
              deploymentFqn: deploymentRef,
              modelRef,
            },
          } satisfies Types.CompoundDeploymentNode,
        )
        break
      }
      case isCompound: {
        invariant(!!modelRef, 'ModelRef expected')
        xynodes.push(
          {
            ...base,
            type: 'compound-element',
            data: {
              ...compoundData,
              ...navigateTo,
              fqn: modelRef,
            },
            dragHandle: '.likec4-compound-title',
          } satisfies Types.CompoundElementNode,
        )
        break
      }
      case !!deploymentRef: {
        xynodes.push(
          {
            ...base,
            type: 'deployment',
            data: {
              ...leafNodeData,
              ...navigateTo,
              deploymentFqn: deploymentRef,
              modelRef,
            },
          } satisfies Types.DeploymentElementNode,
        )
        break
      }
      default: {
        invariant(!!modelRef, 'ModelRef expected')
        xynodes.push(
          {
            ...base,
            type: 'element',
            data: {
              ...leafNodeData,
              ...navigateTo,
              fqn: modelRef,
            },
          } satisfies Types.ElementNode,
        )
      }
    }
  }
  for (const edge of view.edges) {
    const source = edge.source
    const target = edge.target
    const id = ns + edge.id

    if (!hasAtLeast(edge.points, 2)) {
      console.error('edge should have at least 2 points', edge)
      continue
    }

    xyedges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: ZIndexes.Edge,
      selectable: selectable,
      hidden: !visiblePredicate(edge),
      deletable: false,
      data: {
        points: edge.points,
        color: edge.color ?? 'gray',
        line: edge.line ?? 'dashed',
        dir: edge.dir ?? 'forward',
        head: edge.head ?? 'normal',
        tail: edge.tail ?? 'none',
      },
      interactionWidth: 20,
    })
  }

  return {
    xynodes,
    xyedges,
  }
}

export function useViewToNodesEdges({
  view: {
    id,
    nodes,
    edges,
    __ = 'element',
  },
  ...opts
}: {
  view: DiagramView
  where: WhereOperator<string, string> | undefined
  nodesDraggable: boolean
  nodesSelectable: boolean
}) {
  return useDeepCompareMemo(() => {
    return viewToNodesEdge({
      view: {
        id,
        nodes,
        edges,
        __,
      },
      ...opts,
    })
  }, [id, __, nodes, edges, opts])
}
