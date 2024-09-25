import type { DiagramNode, DiagramView, Fqn } from '@likec4/core'
import { nonNullable } from '@likec4/core'
import type { Edge as XYFlowEdge, Node as XYFlowNode } from '@xyflow/react'
import { hasAtLeast } from 'remeda'
// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)

export function diagramViewToXYFlowData(
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | '__'>
): {
  xynodes: XYFlowNode[]
  xyedges: XYFlowEdge[]
} {
  const isDynamicView = view.__ === 'dynamic',
    xynodes = [] as XYFlowNode[],
    xyedges = [] as XYFlowEdge[],
    nodeLookup = new Map<Fqn, DiagramNode>()

  const traverse = view.nodes.reduce(
    (acc, node) => {
      nodeLookup.set(node.id, node)
      if (!node.parent) {
        acc.push({ node, parent: null })
      }
      return acc
    },
    new Array<{
      node: DiagramNode
      parent: DiagramNode | null
    }>()
  )

  // const visiblePredicate = opts.where ? whereOperatorAsPredicate(opts.where) : () => true

  // namespace to force unique ids
  const ns = ''
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let next: typeof traverse[0] | undefined
  while ((next = traverse.shift())) {
    const { node, parent } = next
    const isCompound = hasAtLeast(node.children, 1)
    if (isCompound) {
      traverse.push(...node.children.map(child => ({ node: nodeById(child), parent: node })))
    }

    const position = {
      x: node.position[0],
      y: node.position[1]
    }
    if (parent) {
      position.x -= parent.position[0]
      position.y -= parent.position[1]
    }

    // const outEdges = node.outEdges.map(e => view.edges.find(edge => edge.id === e)).filter(Boolean)
    // const inEdges = node.inEdges.map(e => view.edges.find(edge => edge.id === e)).filter(Boolean)

    const id = ns + node.id

    xynodes.push({
      id,
      type: isCompound ? 'group' : 'node',
      data: {
        label: node.title
      },
      deletable: false,
      position,
      width: node.width,
      height: node.height,
      // parentId: parent ? ns + parent.id : null,
      ...(parent && {
        parentId: ns + parent.id
      }),
      ...(isCompound && {
        dragHandle: '.likec4-compound-title'
      })
    })
  }

  // for (const edge of view.edges) {
  //   const source = edge.source
  //   const target = edge.target
  //   const id = ns + edge.id

  //   if (!hasAtLeast(edge.points, 2)) {
  //     console.error('edge should have at least 2 points', edge)
  //     continue
  //   }

  //   xyedges.push({
  //     id,
  //     type: 'relationship',
  //     source: ns + source,
  //     target: ns + target,
  //     zIndex: ZIndexes.Edge,
  //     selectable: opts.selectable,
  //     hidden: !visiblePredicate(edge),
  //     deletable: false,
  //     data: {
  //       edge,
  //       controlPoints: edge.controlPoints || null,
  //       label: !!edge.labelBBox
  //         ? {
  //           bbox: edge.labelBBox,
  //           text: edge.label ?? ''
  //         }
  //         : null
  //     },
  //     interactionWidth: 20
  //   })
  // }

  return {
    xynodes,
    xyedges
  }
}
