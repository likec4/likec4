import type { ViewChange, ViewId } from '@likec4/core'
import {
  type useStoreApi,
} from '@xyflow/react'
import { boxToRect, getBoundsOfRects, getNodeDimensions } from '@xyflow/system'
import { hasAtLeast, reduce } from 'remeda'
import {
  type ActorRef,
  type ActorRefFromLogic,
  type MachineSnapshot,
  assign,
  setup,
} from 'xstate'
import type { Base } from '../../base'
import { bezierControlPoints, isSamePoint } from '../../xyflow/utils'
import type * as Machine from './machine'

export type XYStoreApi = ReturnType<typeof useStoreApi<Base.Node, Base.Edge>>

export type Input = {
  parent: ActorRef<MachineSnapshot<Machine.Context, Machine.Events, any, any, any, any, any, any>, Machine.Events, any>
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

export const layoutActor = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
  },
  delays: {
    'debounce': 5_000,
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
    // parent: input.parent,
    // viewId: input.parent.getSnapshot().context.view.id,
  }),
  states: {
    idle: {
      on: {
        sync: {
          target: 'pending',
        },
      },
    },
    paused: {
      on: {
        sync: {
          target: 'pending',
        },
      },
    },
    pending: {
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
        'debounce': [{
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

export type LayoutActorRef = ActorRefFromLogic<typeof layoutActor>

function createViewChange(parentContext: Machine.Context): ViewChange.SaveManualLayout {
  const { view, xystore, xyflow } = parentContext

  const { nodeLookup } = xystore.getState()
  const movedNodes = new Set<string>()
  let bounds = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  }

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
    bounds = getBoundsOfRects(bounds, rect)
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
    bounds = getBoundsOfRects(bounds, rect)
    return acc
  }, {} as ViewChange.SaveManualLayout['layout']['edges'])

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
