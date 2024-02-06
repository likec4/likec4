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
import { getBezierEdgeCenter, MarkerType, type Node } from '@xyflow/react'
import { hasAtLeast } from 'remeda'
import type { EditorNode } from './types'
import { dataFromComputedNode, type EditorEdge } from './types'

function deriveEdgePoints(bezierSpline: NonEmptyArray<Point>) {
  let [start, ...bezierPoints] = bezierSpline
  invariant(start, 'start should be defined')
  const handles = [
    start
  ]

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
    if (rest.length === 0) {
      handles.push(
        end
      )
    }
    bezierPoints = rest
    start = end
  }
  invariant(bezierPoints.length === 0, 'all points should be consumed')

  return handles
}

function nodeZIndex<N extends Pick<DiagramNode, 'children' | 'level'>>(node: N) {
  return node.children.length > 0 ? 0 : node.level + 1
}

export function fromDiagramView(
  view: DiagramView
): { nodes: EditorNode[]; edges: EditorEdge[] } {
  const nodes: EditorNode[] = []
  const edges: EditorEdge[] = []

  const ns = view.id + ':'

  const nodeById = (id: Fqn) => nonNullable(view.nodes.find(n => n.id === id))

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
    invariant(hasAtLeast(controlPoints, 2), 'edge controlPoints should have at least 2 points')

    const level = Math.min(nodeById(source).level, nodeById(target).level)

    edges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: level + 1,
      data: {
        id: edge.id,
        type: 'bezier',
        source,
        target,
        points: edge.points,
        headPoint: edge.headArrowPoint ?? null,
        tailPoint: edge.tailArrowPoint ?? null,
        label: edge.labelBBox
          ? {
            bbox: edge.labelBBox,
            text: edge.labels ? edge.labels.map(l => l.text).join('\n') : ''
          }
          : null,
        color: edge.color ?? null,
        line: edge.line ?? null
      },
      markerEnd: {
        type: MarkerType.ArrowClosed
      },
      interactionWidth: 20
    })
  }

  const createNode = (node: DiagramNode) => {
    const children = [...node.children]
    const isCompound = hasAtLeast(children, 1)
    const id = ns + node.id
    const position = {
      x: node.position[0],
      y: node.position[1]
    }
    const parent = node.parent ? view.nodes.find(n => n.id === node.parent) : null
    if (parent) {
      position.x -= parent.position[0]
      position.y -= parent.position[1]
    }
    const zIndex = nodeZIndex(node)

    const base = {
      id,
      data: {
        ...dataFromComputedNode(node),
        w: node.size.width,
        h: node.size.height,
        inEdges: [...node.inEdges],
        outEdges: [...node.outEdges]
      },
      draggable: false,
      deletable: false,
      position,
      zIndex,
      style: {
        width: node.size.width,
        height: node.size.height
      },
      ...node.size,
      ...(parent
        ? {
          parentNode: ns + parent.id
        }
        : {})
    } satisfies Node<EditorNode.BaseData>

    nodes.push(
      isCompound
        ? {
          ...base,
          type: 'compound',
          data: {
            ...base.data,
            depth: node.depth ?? 0
            // children: children.map(c => ns + c),
          }
        }
        : {
          ...base,
          selectable: true,
          type: 'element'
        }
    )

    if (node.children) {
      for (const childId of node.children) {
        const child = view.nodes.find(n => n.id === childId)
        invariant(child, 'child not found')
        createNode(child)
      }
    }
  }

  const rootNodes = view.nodes.filter(n => !n.parent)
  for (const node of rootNodes) {
    createNode(node)
  }

  for (const edge of view.edges) {
    createEdge(edge)
  }

  return { nodes, edges }
}
