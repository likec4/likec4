import {
  type DiagramEdge,
  type DiagramNode,
  type LayoutedView,
  type ViewChange,
  type XYPoint,
  BBox,
} from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import { getEdgePosition, getNodeDimensions, getNodesBounds } from '@xyflow/system'
import { hasAtLeast, indexBy, map, omit } from 'remeda'
import type { ActorSystem } from 'xstate'
import type { XYStoreState } from '../../hooks/useXYFlow'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import { calcViewBounds } from '../../utils/view-bounds'
import { bezierControlPoints, isSamePoint } from '../../utils/xyflow'
import type { Types } from '../types'
import type { Context } from './diagram-machine'
import type { SyncLayoutActorRef } from './syncManualLayoutActor'
import type { DiagramActorRef, DiagramContext, System } from './types'

export function typedSystem(system: ActorSystem<any>) {
  return {
    get syncLayoutActorRef(): SyncLayoutActorRef | null {
      return (system as System).get('syncLayout') ?? null
    },
    get overlaysActorRef(): OverlaysActorRef | null {
      return (system as System).get('overlays') ?? null
    },
    get diagramActorRef(): DiagramActorRef | null {
      return (system as System).get('diagram') ?? null
    },
    get searchActorRef(): SearchActorRef | null {
      return (system as System).get('search') ?? null
    },
  }
}

export function findDiagramNode(ctx: Context, xynodeId: string): DiagramNode | null {
  return ctx.view.nodes.find(n => n.id === xynodeId) ?? null
}

export function findDiagramEdge(ctx: Context, xyedgeId: string): DiagramEdge | null {
  return ctx.view.edges.find(e => e.id === xyedgeId) ?? null
}

export function focusedBounds(params: { context: Context }): { bounds: BBox; duration?: number } {
  const knownAbsolutes = new Map<string, XYPoint>()

  const b = params.context.xynodes.reduce((acc, node) => {
    let position = node.position
    if (node.parentId) {
      const parent = knownAbsolutes.get(node.parentId) ?? { x: 0, y: 0 }
      position = {
        x: position.x + parent.x,
        y: position.y + parent.y,
      }
    }
    knownAbsolutes.set(node.id, position)

    if (node.hidden || node.data.dimmed) {
      return acc
    }

    const width = node.measured?.width ?? node.width ?? node.initialWidth
    const height = node.measured?.height ?? node.height ?? node.initialHeight

    acc.minX = Math.min(acc.minX, position.x)
    acc.minY = Math.min(acc.minY, position.y)
    acc.maxX = Math.max(acc.maxX, position.x + width)
    acc.maxY = Math.max(acc.maxY, position.y + height)
    return acc
  }, {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  })

  if (b.minX === Infinity) {
    return {
      bounds: params.context.view.bounds,
    }
  }

  return {
    duration: 350,
    bounds: {
      x: b.minX - 10,
      y: b.minY - 10,
      width: b.maxX - b.minX + 20,
      height: b.maxY - b.minY + 20,
    },
  }
}

const MARGIN = 32
export function activeSequenceBounds(params: { context: Context }): { bounds: BBox; duration?: number } {
  const activeWalkthrough = nonNullable(params.context.activeWalkthrough)

  const stepEdge = nonNullable(params.context.xyedges.find(e => e.id === activeWalkthrough.stepId))
  const xystate = params.context.xystore.getState()

  const sourceNode = nonNullable(xystate.nodeLookup.get(stepEdge.source))
  const targetNode = nonNullable(xystate.nodeLookup.get(stepEdge.target))

  const actorsBounds = getNodesBounds([sourceNode, targetNode], xystate)

  let stepBounds: BBox | undefined | null
  if (activeWalkthrough.parallelPrefix) {
    const parallelArea = params.context.xynodes.find(n =>
      n.type === 'seq-parallel' && n.data.parallelPrefix === activeWalkthrough.parallelPrefix
    )
    if (parallelArea) {
      stepBounds = {
        x: parallelArea.position.x,
        y: parallelArea.position.y,
        ...getNodeDimensions(parallelArea),
      }
    }
  }

  stepBounds ??= getEdgeBounds(stepEdge, xystate)

  if (stepBounds) {
    stepBounds = BBox.merge(stepBounds, actorsBounds)
  } else {
    stepBounds = actorsBounds
  }

  return {
    duration: 350,
    bounds: BBox.expand(
      stepBounds,
      MARGIN,
    ),
  }
}

function getEdgeBounds(edge: Types.Edge, store: XYStoreState): BBox | null {
  const sourceNode = store.nodeLookup.get(edge.source)
  const targetNode = store.nodeLookup.get(edge.target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const edgePosition = getEdgePosition({
    id: edge.id,
    sourceNode,
    targetNode,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    connectionMode: store.connectionMode,
  })

  if (!edgePosition) {
    return null
  }

  return BBox.fromPoints([
    [edgePosition.sourceX, edgePosition.sourceY],
    [edgePosition.targetX, edgePosition.targetY],
  ])
}

export function createViewChange(parentContext: DiagramContext): ViewChange.SaveViewSnapshot {
  const {
    view: {
      drifts: _1, // Ignore drifts from view
      _layout: _2, // Ignore layout type from view
      ...view
    },
    xynodes,
    xyedges,
    xystore,
  } = parentContext

  const { nodeLookup } = xystore.getState()
  const movedNodes = new Set<string>()

  const xynodesLookup = indexBy(xynodes, n => n.data.id)
  const xyedgesLookup = indexBy(xyedges, e => e.data.id)

  const nodes = map(view.nodes, (node): DiagramNode => {
    const xynode = xynodesLookup[node.id]
    if (!xynode) {
      return node
    }
    const internal = nodeLookup.get(xynode.id)!
    const dimensions = getNodeDimensions(internal)

    const isChanged = !isSamePoint(internal.internals.positionAbsolute, node)
      || node.width !== dimensions.width
      || node.height !== dimensions.height
      || node.shape !== xynode.data.shape
      || node.color !== xynode.data.color
      || node.style.border !== xynode.data.style.border
      || node.style.opacity !== xynode.data.style.opacity

    if (!isChanged) {
      return node
    }

    movedNodes.add(xynode.id)

    return {
      ...node,
      shape: xynode.data.shape,
      color: xynode.data.color,
      style: {
        ...node.style,
        ...xynode.data.style,
      },
      x: Math.floor(internal.internals.positionAbsolute.x),
      y: Math.floor(internal.internals.positionAbsolute.y),
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height),
    } satisfies DiagramNode
  })

  const edges = map(view.edges, (edge): DiagramEdge => {
    const xyedge = xyedgesLookup[edge.id]
    if (!xyedge) {
      return edge
    }
    const data = xyedge.data
    let controlPoints = data.controlPoints ?? []
    const sourceOrTargetMoved = movedNodes.has(xyedge.source) || movedNodes.has(xyedge.target)
    // If edge control points are not set, but the source or target node was moved
    if (controlPoints.length === 0 && sourceOrTargetMoved) {
      controlPoints = bezierControlPoints(data.points)
    }
    const _updated: DiagramEdge = {
      ...omit(edge, ['controlPoints']),
      points: data.points,
    }
    if (data.labelXY && data.labelBBox) {
      _updated.labelBBox = {
        ...data.labelBBox,
        ...data.labelXY,
      }
    }
    if (data.labelBBox) {
      _updated.labelBBox ??= data.labelBBox
    }
    if (hasAtLeast(controlPoints, 1)) {
      _updated.controlPoints = controlPoints
    }
    return _updated
  })

  const snapshot: LayoutedView = {
    ...view,
    bounds: calcViewBounds({ nodes, edges }),
    nodes,
    edges,
  }

  return {
    op: 'save-view-snapshot',
    layout: snapshot,
  }
}
