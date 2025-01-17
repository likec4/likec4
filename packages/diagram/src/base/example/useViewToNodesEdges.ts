import {
  type DiagramView,
  type Fqn,
  DiagramNode,
  ElementKind,
  nonNullable,
} from '@likec4/core'
import { useDeepCompareMemo } from '@react-hookz/web'
import Queue from 'mnemonist/queue'
import { hasAtLeast } from 'remeda'
import { ZIndexes } from '../../base/const'
import type { ExampleTypes } from './_types'

// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)
function viewToNodesEdge(
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges'>,
): {
  xynodes: ExampleTypes.Node[]
  xyedges: ExampleTypes.Edge[]
} {
  const xynodes = [] as ExampleTypes.Node[],
    xyedges = [] as ExampleTypes.Edge[],
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
    } satisfies Omit<ExampleTypes.Node, 'data' | 'type'>

    const fqn = DiagramNode.modelRef(node)
    // const deploymentRef = DiagramNode.deploymentRef(node)
    if (!fqn) {
      console.error('Invalid node', node)
      throw new Error('Element should have either modelRef or deploymentRef')
    }

    const navigateTo = { navigateTo: node.navigateTo ?? null }

    switch (true) {
      case isCompound: {
        xynodes.push(
          {
            ...base,
            type: 'compound',
            data: {
              title: node.title,
              color: node.color,
              shape: node.shape,
              style: node.style,
              depth: node.depth ?? 0,
              icon: node.icon ?? null,
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
              fqn,
              title: node.title,
              technology: node.technology,
              description: node.description,
              height: node.height,
              width: node.width,
              color: node.color,
              shape: node.shape,
              icon: node.icon ?? null,
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
    const id = ns + edge.id

    if (!hasAtLeast(edge.points, 2)) {
      console.error('edge should have at least 2 points', edge)
      continue
    }

    xyedges.push({
      id,
      type: 'relationships',
      source: ns + source,
      target: ns + target,
      zIndex: ZIndexes.Edge,
      // selectable: selectable,
      // hidden: !visiblePredicate(edge),
      deletable: false,
      data: {
        color: edge.color ?? 'gray',
        // label: edge.label,
        // technology: edge.technology,
        // navigateTo: edge.navigateTo,
        // labelBBox: edge.labelBBox ?? null,
        // points: edge.points,
        // color: edge.color ?? 'gray',
        // line: edge.line ?? 'dashed',
        // dir: edge.dir ?? 'forward',
        // head: edge.head ?? 'normal',
        // tail: edge.tail ?? 'none',
      },
      interactionWidth: 20,
    })
  }

  return {
    xynodes,
    xyedges,
  }
}

export function useViewToNodesEdges(
  {
    id,
    nodes,
    edges,
  }: Pick<DiagramView, 'id' | 'nodes' | 'edges'>,
) {
  return useDeepCompareMemo(() => {
    return viewToNodesEdge({
      id,
      nodes,
      edges,
    })
  }, [id, nodes, edges])
}
