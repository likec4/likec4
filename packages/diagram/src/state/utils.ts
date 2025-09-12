import { type DiagramEdge, type DiagramNode, type XYPoint, BBox } from '@likec4/core/types'
import { nonNullable } from '@likec4/core/utils'
import { getEdgePosition, getNodeDimensions } from '@xyflow/system'
import { hasAtLeast } from 'remeda'
import type { ActorSystem } from 'xstate'
import type { XYStoreState } from '../hooks'
import type { Types } from '../likec4diagram/types'
import type { OverlaysActorRef } from '../overlays/overlaysActor'
import type { SearchActorRef } from '../search/searchActor'
import type { Context } from './diagram-machine'
import type { DiagramActorRef, System } from './types'

export function typedSystem(system: ActorSystem<any>) {
  return {
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

  if (activeWalkthrough.parallelPrefix) {
    const parallelArea = params.context.xynodes.find(n =>
      n.type === 'seq-parallel' && n.data.parallelPrefix === activeWalkthrough.parallelPrefix
    )
    if (parallelArea) {
      return {
        duration: 350,
        bounds: BBox.expand({
          x: parallelArea.position.x,
          y: parallelArea.position.y,
          ...getNodeDimensions(parallelArea),
        }, MARGIN),
      }
    }
  }

  const xystate = params.context.xystore.getState()

  const b = params.context.xyedges.reduce((acc, edge) => {
    if (edge.hidden || edge.data.dimmed) {
      return acc
    }
    const bounds = getEdgeBounds(edge, xystate)
    if (bounds) {
      acc.push(bounds)
    }
    return acc
  }, [] as BBox[])

  return {
    duration: 350,
    bounds: hasAtLeast(b, 1) ? BBox.expand(BBox.merge(...b), MARGIN) : params.context.view.bounds,
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
