import type { ViewId } from '@likec4/core'
import { objectHash } from '@likec4/core/utils'
import { filter, map, piped } from 'remeda'
import {
  assign,
  log,
} from 'xstate'
import {
  type AdhocRule,
  machine,
  ruleToPredicate,
} from './actor.types'

const to = {
  idle: { target: '#layouter-idle' },
  call: { target: '#layouter-call' },
} as const

const idle = machine.createStateConfig({
  id: to.idle.target.substring(1),
  entry: log('entry idle ->'),
  exit: log(' -> idle exit '),
  on: {
    'layout': {
      ...to.call,
    },
  },
})

const selectEnabled = piped(
  filter(rule => rule.enabled),
  map(ruleToPredicate),
) satisfies (rules: AdhocRule[]) => any

const call = machine.createStateConfig({
  id: to.call.target.substring(1),
  entry: log('entry call ->'),
  exit: log(' -> call exit '),
  invoke: {
    src: 'service',
    input: ({ context }) => ({
      predicates: selectEnabled(context.rules),
    }),
    onDone: {
      actions: assign({
        view: ({ context, event }) => {
          const id = objectHash(selectEnabled(context.rules)) as ViewId
          return ({
            ...event.output.view,
            hash: id,
            id,
          })
        },
        error: undefined,
      }),
      ...to.idle,
    },
    onError: {
      actions: [
        log(({ event }) => `error: ${event.error}`),
        assign({
          error: ({ event }) => `${event.error}`,
        }),
      ],
      ...to.idle,
    },
  },
})

export const layouter = machine.createStateConfig({
  initial: 'idle',
  states: {
    idle,
    call,
  },
})
