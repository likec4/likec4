import type { BBox } from '@likec4/core'
import { createActorContext } from '@xstate/react'
import {
  type ReactFlowInstance,
  type useStoreApi,
  getViewportForBounds,
} from '@xyflow/react'
import { prop } from 'remeda'
import {
  assign,
  setup,
} from 'xstate'
import { MinZoom } from '../const'
import type { Base } from '../types'

export type XYStoreApi = ReturnType<typeof useStoreApi<Base.Node, Base.Edge>>

export type Input = {
  xystore: XYStoreApi
}

export type Context = Readonly<
  Input & {
    xyflow: ReactFlowInstance<Base.Node, Base.Edge> | null
    initialized: boolean
  }
>

export type Events =
  | { type: 'xyflow.init'; instance: ReactFlowInstance<Base.Node, Base.Edge> }
  | { type: 'xyflow.nodeClick'; node: Base.Node }
  | { type: 'xyflow.edgeClick'; edge: Base.Edge }
  | { type: 'xyflow.paneClick' }
  | { type: 'fitDiagram'; duration?: number; bounds?: BBox }

export const genericXYFlowMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
  },
  actions: {
    'xyflow:fitDiagram': ({ context }, params?: { duration?: number; bounds?: BBox }) => {
      const {
        duration = 450,
        bounds,
      } = params ?? {}
      if (!bounds) {
        context.xyflow?.fitView(duration > 0 ? { duration } : undefined)
        return
      }

      const { width, height, panZoom, fitViewOnInitOptions, transform } = context.xystore.getState()
      const fitViewPadding = fitViewOnInitOptions?.padding ?? 0.1
      const maxZoom = Math.max(1, transform[2])
      const viewport = getViewportForBounds(
        bounds,
        width,
        height,
        MinZoom,
        maxZoom,
        fitViewPadding,
      )
      viewport.x = Math.round(viewport.x)
      viewport.y = Math.round(viewport.y)
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
    },
  },
}).createMachine({
  initial: 'initializing',
  context: ({ input }) => ({
    ...input,
    initialized: false,
    xyflow: null,
  }),
  on: {
    'xyflow.init': {
      actions: [
        assign({
          initialized: true,
          xyflow: ({ event }) => event.instance,
        }),
        {
          type: 'xyflow:fitDiagram',
          params: { duration: 0 },
        },
      ],
    },
    'fitDiagram': {
      actions: {
        type: 'xyflow:fitDiagram',
        params: prop('event'),
      },
    },
  },
})

export const GenericXYFlowMachineContext = createActorContext(genericXYFlowMachine)
