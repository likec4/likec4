import {
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
import { hasAtLeast, isNil } from 'remeda'
import type { XYFlowEdge, XYFlowNode } from '../xyflow/types'

import { createLayoutConstraints } from './cassowary'

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

type XYFlowData = { nodes: XYFlowNode[]; edges: XYFlowEdge[] }

export function fromDiagramView(
  view: Pick<DiagramView, 'nodes' | 'edges'>,
  dragEnabled = true
): XYFlowData {
  const editor: XYFlowData = {
    nodes: [],
    edges: []
  }

  // const ns = view.id + ':'
  const ns = ''

  const nodeById = (id: Fqn) => nonNullable(view.nodes.find(n => n.id === id))

  const positioned = new Map(createLayoutConstraints(view.nodes).solve().map(n => [n.id, n]))

  const createNode = (node: DiagramNode) => {
    // const children = [...node.children]
    const isCompound = hasAtLeast(node.children, 1)
    const id = ns + node.id
    const {
      position,
      width,
      height
    } = nonNullable(positioned.get(node.id))
    // const position = {
    //   x: node.position[0],
    //   y: node.position[1]
    // }
    const parent = node.parent ? nodeById(node.parent) : null
    // if (parent) {
    //   position.x -= parent.position[0]
    //   position.y -= parent.position[1]
    // }
    const zIndex = nodeZIndex(node)

    const draggable = dragEnabled && (!parent || parent.children.length > 1)

    editor.nodes.push({
      id,
      type: isCompound ? 'compound' : 'element',
      data: {
        id,
        element: node
      },
      draggable,
      deletable: false,
      position,
      zIndex,
      width,
      height,
      // ...node.size,
      // style: {
      //   display: 'flex',
      //   width: 'auto',
      //   minWidth: node.size.width,
      //   height: 'auto',
      //   minHeight: node.size.height
      // },
      ...(parent
        ? {
          parentNode: ns + parent.id
          // extent: [
          //   [-10, -10],
          //   [parent.width - node.width + 10, parent.height - node.height + 10]
          // ]
        }
        : {})
    })

    if (node.children.length > 0) {
      for (const child of view.nodes.filter(n => n.parent === node.id)) {
        createNode(child)
      }
    }
  }

  for (const node of view.nodes.filter(n => isNil(n.parent))) {
    createNode(node)
  }
  // console.group()
  // createSolver(Object.values(view.nodes))
  // console.groupEnd()

  const createEdge = (edge: DiagramEdge) => {
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

  for (const edge of view.edges) {
    createEdge(edge)
  }

  return editor
}
