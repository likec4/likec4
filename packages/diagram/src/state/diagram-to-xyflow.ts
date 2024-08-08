import { extractStep, invariant, nonNullable } from '@likec4/core'
import type { DiagramNode, DiagramView, Fqn } from '@likec4/core/types'
import { hasAtLeast } from 'remeda'
import { ZIndexes } from '../xyflow/const'
import type { XYFlowEdge, XYFlowNode } from '../xyflow/types'

// const nodeZIndex = (node: DiagramNode) => node.level - (node.children.length > 0 ? 1 : 0)

export function diagramViewToXYFlowData(
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | '__'>,
  opts: {
    draggable: boolean
    selectable: boolean
  }
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

  // namespace to force unique ids
  const ns = ''
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let next: typeof traverse[0] | undefined
  while ((next = traverse.shift())) {
    const { node, parent } = next
    if (node.children.length > 0) {
      traverse.push(...node.children.map(child => ({ node: nodeById(child), parent: node })))
    }
    const isCompound = hasAtLeast(node.children, 1)
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
    const draggable = opts.draggable && (!parent || parent.children.length > 1)
    xynodes.push({
      id,
      type: isCompound ? 'compound' : 'element',
      data: {
        fqn: node.id,
        element: node
      },
      draggable,
      selectable: opts.selectable,
      deletable: false,
      position,
      zIndex: isCompound ? ZIndexes.Compound : ZIndexes.Element,
      hidden: false,
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

  for (const edge of view.edges) {
    const source = edge.source
    const target = edge.target
    const id = ns + edge.id
    // const points = isElkEdge(edge) ? edge.points : deriveEdgePoints(edge.points)
    // const controlPoints = deriveEdgePoints(edge.points)
    // if (edge.tailArrowPoint) {
    //   controlPoints.unshift([...edge.tailArrowPoint])
    // }
    // if (edge.headArrowPoint) {
    //   controlPoints.push([...edge.headArrowPoint])
    // }
    invariant(hasAtLeast(edge.points, 2), 'edge should have at least 2 points')
    // invariant(hasAtLeast(controlPoints, 2), 'edge controlPoints should have at least 2 points')

    // const level = Math.max(nodeZIndex(nodeById(source)), nodeZIndex(nodeById(target)))

    xyedges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: ZIndexes.Edge,
      selectable: opts.selectable,
      deletable: false,
      data: {
        edge,
        controlPoints: edge.controlPoints || null,
        stepNum: isDynamicView ? extractStep(edge.id) : null,
        label: !!edge.labelBBox
          ? {
            bbox: edge.labelBBox,
            text: edge.label ?? ''
          }
          : null
      },
      interactionWidth: 20
    })
  }

  return {
    xynodes,
    xyedges
  }
}
