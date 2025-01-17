import type { BBox } from '@likec4/core'
import { type ReactFlowInstance, type useStoreApi, type Viewport } from '@xyflow/react'
import { type ActorRefFrom, setup } from 'xstate'
import { MaxZoom, MinZoom } from './const'
import type { Base } from './types'

export interface TodoItem {
  id: string
  title: string
  completed: boolean
}

export type TodosFilter = 'all' | 'active' | 'completed'

type StoreApi = ReturnType<typeof useStoreApi<Base.Node, Base.Edge>>

export const xyflowMachine = setup({
  types: {
    input: {} as {
      xyflow: ReactFlowInstance<Base.Node, Base.Edge>
      fitViewPadding?: number
    },
    context: {} as {
      xyflow: ReactFlowInstance<Base.Node, Base.Edge>
      fitViewPadding: number
    },
    events: {} as
      | { type: 'fitBounds'; bounds: BBox; duration?: number }
      | { type: 'fitView'; duration?: number }
      | { type: 'setCenter'; center: { x: number; y: number }; duration?: number }
      | { type: 'setViewport'; viewport: Viewport; duration?: number },
  },
}).createMachine({
  id: 'xyflow',
  context: ({ input }) => ({
    fitViewPadding: 0,
    ...input,
  }),
  on: {
    'fitBounds': {
      actions: ({ context, event }) => {
        const { bounds, duration = 0 } = event
        context.xyflow.fitBounds(bounds, {
          padding: context.fitViewPadding,
          ...duration > 0 && { duration },
        })
      },
    },
    'fitView': {
      actions: ({ context, event }) => {
        const { duration = 0 } = event
        context.xyflow.fitView({
          minZoom: MinZoom,
          maxZoom: MaxZoom,
          padding: context.fitViewPadding,
          ...duration > 0 && { duration },
        })
      },
    },
    'setCenter': {
      actions: ({ context, event }) => {
        const { center, duration = 0 } = event
        context.xyflow.setCenter(center.x, center.y, duration > 0 ? { duration } : undefined)
      },
    },
    'setViewport': {
      actions: ({ context, event }) => {
        const { viewport, duration = 0 } = event
        context.xyflow.setViewport(viewport, duration > 0 ? { duration } : undefined)
      },
    },
  },
})

export type XYFlowActorRef = ActorRefFrom<typeof xyflowMachine>
