import { stringHash } from '@likec4/core/utils'
import {
  assertEvent,
} from 'xstate'
import {
  machine,
} from './actor.types'

const to = {
  idle: { target: '#idle' },
  selecting: { target: '#selecting' },
  layouting: { target: '#layouting' },
} as const

// Extracted actions
const includePredicate = () =>
  machine.assign(({ context, event }) => {
    const id = stringHash((context.rules.at(-1)?.id ?? new Date().toISOString()) + event.type)
    switch (event.type) {
      case 'include.element': {
        return {
          rules: [
            ...context.rules,
            {
              id,
              expr: { ref: { model: event.model } },
              enabled: true,
              type: 'include',
            },
          ],
        }
      }
      default: {
        throw new Error(`Unexpected event ${event.type}}`)
      }
    }
  })

const toggleRule = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'toggle.rule')
    return {
      rules: context.rules.map((rule) => {
        if (rule.id === event.ruleId) {
          return {
            ...rule,
            enabled: !rule.enabled,
          }
        }
        return rule
      }),
    }
  })

const deleteRule = () =>
  machine.assign(({ context, event }) => {
    assertEvent(event, 'delete.rule')
    return {
      rules: context.rules.filter((rule) => rule.id !== event.ruleId),
    }
  })

const scheduleLayout = () => machine.raise({ type: 'layout' })

const idle = machine.createStateConfig({
  id: 'idle',
  on: {
    'select.open': {
      ...to.selecting,
    },
    'toggle.rule': {
      actions: toggleRule(),
      ...to.layouting,
    },
    'delete.rule': {
      actions: deleteRule(),
      ...to.layouting,
    },
  },
})

const selecting = machine.createStateConfig({
  id: 'selecting',
  on: {
    'include.element': {
      actions: includePredicate(),
      ...to.layouting,
    },
    'select.close': {
      ...to.idle,
    },
  },
})

const layouting = machine.createStateConfig({
  id: 'layouting',
  always: {
    actions: scheduleLayout(),
    ...to.idle,
  },
})

export const editor = machine.createStateConfig({
  initial: 'idle',
  states: {
    idle,
    selecting,
    layouting,
  },
})
