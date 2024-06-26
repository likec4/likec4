import { extractStep, invariant, nonNullable } from '@likec4/core'
import type { DiagramNode, DiagramView, Fqn } from '@likec4/core/types'
import { hasAtLeast } from 'remeda'
import type { XYFlowData } from '../xyflow/types'

// const nodeZIndex = (node: DiagramNode) => node.level + (hasAtLeast(node.children, 1) ? 2 : 1)
const nodeZIndex = (node: DiagramNode) => node.level + 1

export function diagramViewToXYFlowData(
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | '__' | 'manualLayout'>,
  opts: {
    draggable: boolean
    selectable: boolean
  }
): XYFlowData {
  const isDynamicView = view.__ === 'dynamic'
  const editor: XYFlowData = {
    nodes: [],
    edges: []
  }

  const nodeLookup = new Map<Fqn, DiagramNode>()

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
  while ((next = traverse.pop())) {
    const { node, parent } = next
    if (node.children.length > 0) {
      traverse.unshift(...node.children.map(child => ({ node: nodeById(child), parent: node })))
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
    editor.nodes.push({
      id,
      type: isCompound ? 'compound' : 'element',
      data: {
        fqn: node.id,
        element: node
      },
      draggable: opts.draggable && (!parent || parent.children.length > 1),
      selectable: opts.selectable,
      deletable: false,
      position,
      zIndex: nodeZIndex(node),
      hidden: false,
      /*       initialWidth: node.width,
      initialHeight: node.height, */
      width: node.width,
      height: node.height,
      // measured: {
      //   width: node.width,
      //   height: node.height
      // },
      ...(parent && {
        parentId: ns + parent.id
      })
      // handles: [
      //   ...outEdges.map(out => ({
      //     id: `${out.id}`,
      //     type: 'source' as const,
      //     position: Position.Bottom,
      //     x: out.points[0][0],
      //     y: out.points[0][1],
      //     width: 10,
      //     height: 10
      //   })),
      //   ...inEdges.map(out => ({
      //     id: out.id,
      //     type: 'target' as const,
      //     position: Position.Top,
      //     x: out.points[0][0],
      //     y: out.points[0][1],
      //     width: 10,
      //     height: 10
      //   }))
      // ],
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

    const level = Math.max(nodeZIndex(nodeById(source)), nodeZIndex(nodeById(target)))

    editor.edges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: level,
      deletable: false,
      data: {
        edge,
        type: 'bezier',
        controlPoints: view.manualLayout?.edges[edge.id]?.controlPoints || null,
        stepNum: isDynamicView ? extractStep(edge.id) : null,
        label: !!edge.labelBBox
          ? {
            bbox: edge.labelBBox,
            // text: edge.labels ? edge.labels.map(l => l.text).join('\n') : ''
            text: edge.label ?? ''
          }
          : null
      },
      // markerEnd: {
      //   type: MarkerType.ArrowClosed
      // },
      interactionWidth: 20
    })
  }

  return editor
}
