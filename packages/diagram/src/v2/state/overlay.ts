import type { BBox } from '@likec4/core'
import {
  type ReactFlowInstance,
  type useStoreApi,
} from '@xyflow/react'
import {
  type ActorRefFromLogic,
  type AnyActorRef,
  setup,
} from 'xstate'
import type { Base } from '../../base'

export type XYStoreApi = ReturnType<typeof useStoreApi<Base.Node, Base.Edge>>

export type Input = {
  parent: AnyActorRef
}

export type Context = Readonly<
  Input & {
    xystore: XYStoreApi | null
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
  | { type: 'close' }

// export type OverlayActorLogic = StateMachine<Context, Snapshot<{asdasd: string}>, Events, Input>
// export type OverlayActorLogic = Ac
export const overlayActor = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Events,
  },
  delays: {
    '10sec': 10000,
  },
}).createMachine({
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
    initialized: false,
    xystore: null,
    xyflow: null,
  }),
  states: {
    idle: {
      after: {
        '10sec': 'closed',
      },
      // on: {
      //   'close': {
      //     target: 'closed',
      //   },
      // },
    },
    'closed': {
      type: 'final',
    },
  },
  output: () => ({
    heelo: 'world',
  }),
})

export type OverlayActorRef = ActorRefFromLogic<typeof overlayActor>
