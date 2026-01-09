import {
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type Fqn,
  type XYPoint,
  BBox,
} from '@likec4/core/types'
import { nonexhaustive, nonNullable } from '@likec4/core/utils'
import { type Viewport, getEdgePosition, getNodeDimensions, getNodesBounds, getViewportForBounds } from '@xyflow/system'
import type { ActorSystem } from 'xstate'
import { MinZoom } from '../../base/const'
import type { EditorActorRef } from '../../editor/editorActor'
import type { XYStoreState } from '../../hooks/useXYFlow'
import type { ViewPaddings } from '../../LikeC4Diagram.props'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import { pickViewBounds } from '../../utils/view-bounds'
import type { Types } from '../types'
import type { Context } from './machine.setup'
import type { DiagramActorRef, NodeWithData, System } from './types'

export const findNodeByModelFqn = <T extends NodeWithData>(
  xynodes: T[],
  elementFqn: Fqn,
): (T & { data: { modelFqn: Fqn } }) | null => {
  const node = xynodes.find(n => 'modelFqn' in n.data && n.data['modelFqn'] === elementFqn)
  return node ? (node as T & { data: { modelFqn: Fqn } }) : null
}

export function typedSystem(system: ActorSystem<any>) {
  return {
    get overlaysActorRef(): OverlaysActorRef | null {
      return (system as System).get('overlays') ?? null
    },
    get diagramActorRef(): DiagramActorRef {
      return nonNullable((system as System).get('diagram'), 'Diagram actor not found')
    },
    get searchActorRef(): SearchActorRef | null {
      return (system as System).get('search') ?? null
    },
    get editorActorRef(): EditorActorRef | null {
      return (system as System).get('editor') ?? null
    },
  }
}
typedSystem.editorActor = ({ system }: { system: ActorSystem<any> }): EditorActorRef => {
  return (system as System).get('editor')!
}
typedSystem.overlaysActor = ({ system }: { system: ActorSystem<any> }): OverlaysActorRef => {
  return (system as System).get('overlays')!
}
typedSystem.diagramActor = ({ system }: { system: ActorSystem<any> }): DiagramActorRef => {
  return (system as System).get('diagram')!
}
typedSystem.searchActor = ({ system }: { system: ActorSystem<any> }): SearchActorRef => {
  return (system as System).get('search')!
}

export function findDiagramNode(ctx: Context, xynodeId: string): DiagramNode | null {
  return ctx.view.nodes.find(n => n.id === xynodeId) ?? null
}

export function findDiagramEdge(ctx: Context, xyedgeId: string): DiagramEdge | null {
  return ctx.view.edges.find(e => e.id === xyedgeId) ?? null
}

/**
 * Returns the bounds of the current view from the context.
 * If {@link nextView} is provided, returns the bounds of the next view.
 */
export function viewBounds(
  ctx: Pick<Context, 'view' | 'dynamicViewVariant'>,
  nextView?: DiagramView,
): BBox {
  const view = nextView ?? ctx.view
  return pickViewBounds(view, ctx.dynamicViewVariant)
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
      bounds: viewBounds(params.context),
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
export function activeSequenceBounds(params: { context: Context }): { bounds: BBox; duration: number } {
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

export function nodeRef(node: Types.Node) {
  switch (node.type) {
    case 'element':
    case 'compound-element':
    case 'seq-actor':
      return node.data.modelFqn
    case 'deployment':
    case 'compound-deployment':
      return node.data.modelFqn ?? node.data.deploymentFqn
    case 'seq-parallel':
    case 'view-group':
      return null
    default:
      nonexhaustive(node)
  }
}

export function findCorrespondingNode(
  context: Pick<Context, 'lastOnNavigate' | 'xynodes'>,
  event: { view: DiagramView; xynodes: Types.Node[] },
) {
  const fromNodeId = context.lastOnNavigate?.fromNode
  const fromNode = fromNodeId && context.xynodes.find(n => n.id === fromNodeId)
  const fromRef = fromNode && nodeRef(fromNode)
  const toNode = fromRef && event.xynodes.find(n => nodeRef(n) === fromRef)
  return { fromNode, toNode }
}

export function calcViewportForBounds(
  context: Pick<Context, 'xystore' | 'fitViewPadding'>,
  bounds: BBox,
): Viewport {
  let {
    width,
    height,
    transform,
  } = context.xystore.getState()
  const maxZoom = Math.max(transform[2], 1)
  return getViewportForBounds(
    bounds,
    width,
    height,
    MinZoom,
    maxZoom,
    context.fitViewPadding,
  )
}

export function parseAsNumber(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function parseViewPaddings(paddings: ViewPaddings): {
  top: number
  right: number
  bottom: number
  left: number
} {
  const top = parseAsNumber(paddings.top ?? paddings.y)
  const bottom = parseAsNumber(paddings.bottom ?? paddings.y)
  const left = parseAsNumber(paddings.left ?? paddings.x)
  const right = parseAsNumber(paddings.right ?? paddings.x)
  return { top, right, bottom, left }
}
