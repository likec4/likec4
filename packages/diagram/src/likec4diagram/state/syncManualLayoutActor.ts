import type { DiagramEdge, ViewChange, ViewId } from '@likec4/core/types'
import { type Rect, boxToRect, getBoundsOfRects, getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, indexBy, map, omit } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRef,
  type ActorRefFromLogic,
  type MachineSnapshot,
  type SnapshotFrom,
  assign,
  enqueueActions,
  setup,
} from 'xstate'
import { bezierControlPoints, isSamePoint } from '../../utils'
import type { Context as DiagramContext, Events as DiagramEvents } from './diagram-machine'

export type Input = {
  /**
   * Actually this is DiagramActorRef
   * But we can't use it here due to circular type inference
   */
  parent: ActorRef<
    MachineSnapshot<DiagramContext, DiagramEvents, any, any, any, any, any, any>,
    DiagramEvents,
    any
  >
  viewId: ViewId
}

export type Context = Readonly<
  Input & {}
>

export type Events =
  | { type: 'sync' }
  | { type: 'synced' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'cancel' }
  | { type: 'stop' }

const syncManualLayout = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
    tags: '' as 'pending' | 'ready',
  },
  delays: {
    'timeout': 1_000,
  },
  guards: {
    'same view': ({ context }) => context.parent.getSnapshot().context.view.id === context.viewId,
  },
})

const idle = syncManualLayout.createStateConfig({
  tags: 'ready',
  on: {
    sync: {
      target: 'pending',
    },
  },
})

const paused = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    resume: {
      target: 'pending',
    },
    sync: {
      target: 'pending',
    },
    cancel: {
      target: 'idle',
    },
  },
})

const pending = syncManualLayout.createStateConfig({
  tags: 'pending',
  on: {
    sync: {
      target: 'pending',
      reenter: true,
    },
    resume: {
      target: 'pending',
      reenter: true,
    },
    cancel: {
      target: 'idle',
    },
    pause: {
      target: 'paused',
    },
  },
  after: {
    'timeout': [{
      guard: 'same view',
      target: 'syncing',
    }, {
      target: 'stopped',
    }],
  },
})

const syncing = syncManualLayout.createStateConfig({
  always: {
    actions: enqueueActions(({ context, enqueue }) => {
      const parentContext = context.parent.getSnapshot().context
      enqueue.sendTo(context.parent, {
        type: 'emit.onChange',
        viewChange: createViewChange(parentContext),
      })
    }),
    target: 'synced',
  },
})

const synced = syncManualLayout.createStateConfig({
  tags: 'ready',
  on: {
    sync: {
      target: 'pending',
    },
  },
})

const _syncManualLayoutActorLogic = syncManualLayout.createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    idle,
    paused,
    pending,
    syncing,
    synced,
    stopped: {
      entry: assign({
        parent: null as any,
      }),
      type: 'final',
    },
  },
  on: {
    synced: {
      target: '.synced',
    },
    stop: {
      target: '.stopped',
    },
  },
})

/**
 * Here is a trick to reduce inference types
 */
type InferredMachine = ActorLogicFrom<typeof _syncManualLayoutActorLogic>
export interface SyncLayoutActorLogic extends InferredMachine {}

export type SyncLayoutActorRef = ActorRefFromLogic<SyncLayoutActorLogic>
export type SyncLayoutActorSnapshot = SnapshotFrom<SyncLayoutActorLogic>

export const syncManualLayoutActorLogic: SyncLayoutActorLogic = _syncManualLayoutActorLogic as any

function createViewChange(parentContext: DiagramContext): ViewChange.SaveViewSnapshot {
  const { view, xynodes, xyedges, xystore } = parentContext

  const { nodeLookup } = xystore.getState()
  const movedNodes = new Set<string>()

  const xynodesLookup = indexBy(xynodes, n => n.data.id)

  let bounds: Rect | undefined

  const nodes = map(view.nodes, (node) => {
    const xynode = xynodesLookup[node.id]
    if (!xynode) {
      bounds = bounds ? getBoundsOfRects(bounds, node) : node
      return node
    }
    const internal = nodeLookup.get(xynode.id)!
    const dimensions = getNodeDimensions(internal)
    if (
      !isSamePoint(internal.internals.positionAbsolute, node) || node.width !== dimensions.width ||
      node.height !== dimensions.height
    ) {
      movedNodes.add(xynode.id)
    }
    const rect = {
      ...node,
      x: Math.floor(internal.internals.positionAbsolute.x),
      y: Math.floor(internal.internals.positionAbsolute.y),
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height),
    }
    bounds = bounds ? getBoundsOfRects(bounds, rect) : rect
    return rect
  })

  const edges = map(view.edges, (edge) => {
    const xyedge = xyedges.find(e => e.data.id === edge.id)
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
    if (data.points.length === 0 && controlPoints.length === 0) {
      return edge
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
    // if (!sourceOrTargetMoved && data.edge.dotpos) {
    //   _updated.dotpos = data.edge.dotpos
    // }
    const allX = [
      ...data.points.map(p => p[0]),
      ...controlPoints.map(p => p.x),
      ...(_updated.labelBBox ? [_updated.labelBBox.x, _updated.labelBBox.x + _updated.labelBBox.width] : []),
    ]
    const allY = [
      ...data.points.map(p => p[1]),
      ...controlPoints.map(p => p.y),
      ...(_updated.labelBBox ? [_updated.labelBBox.y, _updated.labelBBox.y + _updated.labelBBox.height] : []),
    ]
    const rect = boxToRect({
      x: Math.floor(Math.min(...allX)),
      y: Math.floor(Math.min(...allY)),
      x2: Math.ceil(Math.max(...allX)),
      y2: Math.ceil(Math.max(...allY)),
    })
    bounds = bounds ? getBoundsOfRects(bounds, rect) : rect
    return _updated
  })

  bounds ??= view.bounds

  return {
    op: 'save-view-snapshot',
    layout: {
      ...view,
      bounds,
      nodes,
      edges,
    },
  }
}
