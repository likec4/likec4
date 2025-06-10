import type { ViewChange, ViewId } from '@likec4/core/types'
import { type Rect, boxToRect, getBoundsOfRects, getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, reduce } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRef,
  type MachineSnapshot,
  assign,
  setup,
} from 'xstate'
import { bezierControlPoints, isSamePoint } from '../utils'
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
  | { type: 'cancel' }
  | { type: 'stop' }

const _syncManualLayoutActorLogic = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
    tags: '' as 'pending' | 'ready',
  },
  delays: {
    'timeout': 2_000,
  },
  actions: {
    'trigger:OnChange': (_, _params: { change: ViewChange }) => {
    },
  },
  guards: {
    'same view': ({ context }) => context.parent.getSnapshot().context.view.id === context.viewId,
  },
}).createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    idle: {
      tags: 'ready',
      on: {
        sync: {
          target: 'pending',
        },
      },
    },
    paused: {
      tags: 'pending',
      on: {
        sync: {
          target: 'pending',
        },
      },
    },
    pending: {
      tags: 'pending',
      on: {
        sync: {
          target: 'pending',
          reenter: true,
        },
        cancel: {
          target: 'paused',
        },
      },
      after: {
        'timeout': [{
          guard: 'same view',
          actions: {
            type: 'trigger:OnChange',
            params: ({ context }) => {
              const change = createViewChange(context.parent.getSnapshot().context)
              return { change }
            },
          },
          target: 'synced',
        }, {
          target: 'stopped',
        }],
      },
    },
    synced: {
      tags: 'ready',
      on: {
        sync: {
          target: 'pending',
        },
      },
    },
    'stopped': {
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

export interface SyncLayoutActorLogic extends ActorLogicFrom<typeof _syncManualLayoutActorLogic> {}

export const syncManualLayoutActorLogic: SyncLayoutActorLogic = _syncManualLayoutActorLogic

function createViewChange(parentContext: DiagramContext): ViewChange.SaveManualLayout {
  const { view, xystore, xyflow } = parentContext

  const { nodeLookup } = xystore.getState()
  const movedNodes = new Set<string>()
  let bounds: Rect | undefined

  const nodes = reduce([...nodeLookup.values()], (acc, node) => {
    const dimensions = getNodeDimensions(node)
    if (
      !isSamePoint(node.internals.positionAbsolute, node.data.position) || node.initialWidth !== dimensions.width ||
      node.initialHeight !== dimensions.height
    ) {
      movedNodes.add(node.id)
    }
    const rect = acc[node.id] = {
      isCompound: node.type !== 'element' && node.type !== 'deployment',
      x: Math.floor(node.internals.positionAbsolute.x),
      y: Math.floor(node.internals.positionAbsolute.y),
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height),
    }
    bounds = bounds ? getBoundsOfRects(bounds, rect) : rect
    return acc
  }, {} as ViewChange.SaveManualLayout['layout']['nodes'])

  const edges = reduce(xyflow?.getEdges() ?? [], (acc, { source, target, data }) => {
    let controlPoints = data.controlPoints ?? []
    const sourceOrTargetMoved = movedNodes.has(source) || movedNodes.has(target)
    // If edge control points are not set, but the source or target node was moved
    if (controlPoints.length === 0 && sourceOrTargetMoved) {
      controlPoints = bezierControlPoints(data)
    }
    if (data.points.length === 0 && controlPoints.length === 0) {
      return acc
    }
    const _updated: ViewChange.SaveManualLayout['layout']['edges'][string] = acc[data.id] = {
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
    return acc
  }, {} as ViewChange.SaveManualLayout['layout']['edges'])

  bounds ??= view.bounds

  return {
    op: 'save-manual-layout',
    layout: {
      hash: view.hash,
      autoLayout: view.autoLayout,
      nodes,
      edges,
      ...bounds,
    },
  }
}
