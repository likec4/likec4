import {
  compareByFqnHierarchically,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type Fqn,
  invariant,
  type NonEmptyArray,
  nonNullable,
  type Point
} from '@likec4/core'
import { getBezierEdgeCenter } from '@xyflow/react'
import { hasAtLeast, isNullish } from 'remeda'
import type { XYFlowData } from '../xyflow/types'

function deriveEdgePoints(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...bezierPoints] = bezierSpline
  invariant(start, 'start should be defined')
  const handles = [
    // start
  ] as Point[]

  while (hasAtLeast(bezierPoints, 3)) {
    const [cp1, cp2, end, ...rest] = bezierPoints
    const [centerX, centerY] = getBezierEdgeCenter({
      sourceX: start[0],
      sourceY: start[1],
      targetX: end[0],
      targetY: end[1],
      sourceControlX: cp1[0],
      sourceControlY: cp1[1],
      targetControlX: cp2[0],
      targetControlY: cp2[1]
    })
    handles.push(
      [centerX, centerY]
    )
    // if (rest.length === 0) {
    //   handles.push(
    //     end
    //   )
    // }
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')

  return handles
}

function nodeZIndex<N extends Pick<DiagramNode, 'children' | 'level'>>(node: N) {
  return node.children.length > 0 ? 0 : node.level + 1
}

export function diagramViewToXYFlowData(
  view: Pick<DiagramView, 'nodes' | 'edges'>,
  dragEnabled: boolean
): XYFlowData {
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
    const zIndex = nodeZIndex(node)

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
      draggable: dragEnabled && (!parent || parent.children.length > 1),
      deletable: false,
      position,
      zIndex,
      hidden: false,
      /*       initialWidth: node.width,
      initialHeight: node.height, */
      width: node.width,
      height: node.height,
      measured: {
        width: node.width,
        height: node.height
      },
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
    const controlPoints = deriveEdgePoints(edge.points)
    // if (edge.tailArrowPoint) {
    //   controlPoints.unshift([...edge.tailArrowPoint])
    // }
    // if (edge.headArrowPoint) {
    //   controlPoints.push([...edge.headArrowPoint])
    // }
    invariant(hasAtLeast(edge.points, 2), 'edge should have at least 2 points')
    // invariant(hasAtLeast(controlPoints, 2), 'edge controlPoints should have at least 2 points')

    const level = Math.min(nodeById(source).level, nodeById(target).level)

    editor.edges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: level + 1,
      deletable: false,
      data: {
        edge,
        type: 'bezier',
        controlPoints,
        headPoint: edge.headArrowPoint ?? null,
        tailPoint: edge.tailArrowPoint ?? null,
        label: edge.labelBBox && edge.label
          ? {
            bbox: edge.labelBBox,
            // text: edge.labels ? edge.labels.map(l => l.text).join('\n') : ''
            text: edge.label
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
