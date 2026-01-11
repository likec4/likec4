import { stringHash } from '@likec4/core/utils'
import { map, prop } from 'remeda'
import {
  type ActorRef,
  type SnapshotFrom,
  assign,
  setup,
} from 'xstate'
import type { AdhocViewServiceActor, Context, EmittedEvents, Events } from './actor.types'

type Tags = 'hasView'

const machine = setup({
  types: {
    context: {} as Context,
    tags: '' as Tags,
    // input: {} as Input,
    events: {} as Events,
    emitted: {} as EmittedEvents,
  },
  actors: {
    service: {} as AdhocViewServiceActor,
  },
  guards: {
    hasView: ({ context }) => context.view !== null,
  },
})

const to = {
  idle: { target: '#idle' },
  selecting: { target: '#selecting' },
  callservice: { target: '#callservice' },
} as const

// Extracted actions
const includePredicate = () =>
  machine.assign(({ context, event }) => {
    switch (event.type) {
      case 'include.element': {
        const id = stringHash(event.model + context.rules.length)
        return {
          rules: [
            ...context.rules,
            { id, rule: { include: [{ ref: { model: event.model } }] } },
          ],
        }
      }
      default: {
        throw new Error(`Unexpected event ${event.type}}`)
      }
    }
  })

const selecting = machine.createStateConfig({
  id: 'selecting',
  on: {
    'include.element': {
      actions: includePredicate(),
      ...to.callservice,
    },
    'select.close': {
      ...to.idle,
    },
  },
})

const callService = machine.createStateConfig({
  id: 'callservice',
  invoke: {
    src: 'service',
    input: ({ context }) => ({
      predicates: map(context.rules, prop('rule')),
    }),
    onDone: {
      actions: assign({
        view: ({ event }) => event.output.view,
        error: undefined,
      }),
      ...to.idle,
    },
    onError: {
      actions: assign({
        error: ({ event }) => `${event.error}`,
      }),
      ...to.idle,
    },
  },
})

const _adhocEditorLogic = machine.createMachine({
  id: 'adhoc-editor',
  context: () => ({
    view: null,
    error: undefined,
    rules: [],
  }),
  initial: 'idle',
  on: {
    'dispose': {
      target: '.closed',
    },
  },
  states: {
    idle: {
      id: 'idle',
      on: {
        'select.open': {
          ...to.selecting,
        },
      },
    },
    selecting,
    callService,
    closed: {
      id: 'closed',
      type: 'final',
    },
  },
})

type Infer = typeof _adhocEditorLogic
export interface AdhocEditorLogic extends Infer {}

export const adhocEditorLogic: AdhocEditorLogic = _adhocEditorLogic as any

export type AdhocEditorSnapshot = SnapshotFrom<AdhocEditorLogic>
export interface AdhocEditorActorRef extends ActorRef<AdhocEditorSnapshot, Events, EmittedEvents> {
}
