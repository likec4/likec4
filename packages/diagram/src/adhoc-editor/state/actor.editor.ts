import { type Any, type Fqn, ModelExpression, ModelFqnExpr } from '@likec4/core'
import { invariant, nonexhaustive, stringHash } from '@likec4/core/utils'
import { last } from 'remeda'
import {
  assertEvent,
} from 'xstate'
import { emitViewUpdate } from './actor.layouter'
import type { Context } from './actor.types'
import {
  type AdhocRule,
  machine,
} from './actor.types'

const to = {
  idle: { target: '#idle' },
  selecting: { target: '#selecting' },
  layouting: { target: '#layouting' },
} as const

function nextId({ rules }: Pick<Context, 'rules'>, salt: string = '') {
  return stringHash((rules.at(-1)?.id ?? new Date().toISOString()) + salt)
}

const isRef = (fqn: Fqn) => (exp: ModelExpression): exp is ModelFqnExpr.Ref<Any> => {
  return ModelFqnExpr.isModelRef(exp) && exp.ref.model === fqn
}

const isRuleOf = (fqn: Fqn) => (rule: AdhocRule): rule is AdhocRule & { expr: ModelFqnExpr.Ref<Any> } => {
  return ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn
}

const isIncludeOf =
  (fqn: Fqn) => (rule: AdhocRule): rule is AdhocRule & { type: 'include'; expr: ModelFqnExpr.Ref<Any> } => {
    return rule.type === 'include' && ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn
  }
const isExcludeOf =
  (fqn: Fqn) => (rule: AdhocRule): rule is AdhocRule & { type: 'exclude'; expr: ModelFqnExpr.Ref<Any> } => {
    return rule.type === 'exclude' && ModelFqnExpr.isModelRef(rule.expr) && rule.expr.ref.model === fqn
  }

function deriveElementState(id: Fqn, { rules, view }: Pick<Context, 'rules' | 'view'>) {
  const ruleOf = rules.find(isRuleOf(id))
  if (ruleOf && !ruleOf.enabled) {
    return {
      state: 'disabled' as const,
      ruleId: ruleOf.id,
    }
  }
  const isIncludedInView = view ? view.nodes.some(node => node.modelRef === id) : false
  const includeRule = rules.find(isIncludeOf(id))
  const excludeRule = rules.find(isExcludeOf(id))
  switch (true) {
    case includeRule && isIncludedInView:
      return {
        state: 'include-explicit' as const,
        ruleId: includeRule.id,
      }
    case !includeRule && isIncludedInView:
      return {
        state: 'include-implicit' as const,
        ruleId: undefined,
      }
    case includeRule && !isIncludedInView:
      return {
        state: 'not-present' as const,
        ruleId: includeRule.id,
      }
    case !!excludeRule:
      return {
        state: 'exclude' as const,
        ruleId: excludeRule.id,
      }
    default: {
      invariant(isIncludedInView === false, 'Element not in view should not be included or excluded by any rule')
      return {
        state: 'not-present' as const,
        ruleId: undefined,
      }
    }
  }
}

const enableRule = (ruleId: string) =>
  machine.assign(({ context }) => {
    return {
      rules: context.rules.map((rule) => {
        if (rule.id === ruleId && !rule.enabled) {
          return {
            ...rule,
            enabled: true,
          }
        }
        return rule
      }),
    }
  })

const addElementRules = (fqn: Fqn, type: 'include' | 'exclude') =>
  machine.assign(({ context }) => {
    // const isRuleOfTheElement = isRuleOf(fqn)
    // // Remove any existing rules of the element
    // const rules = [...context.rules]

    // rules.push({
    //   id: nextId(context, type + fqn),
    //   expr: { ref: { model: fqn } },
    //   enabled: true,
    //   type,
    // })

    return {
      rules: [
        ...context.rules,
        {
          id: nextId(context, type + fqn),
          expr: { ref: { model: fqn } },
          enabled: true,
          type,
        },
      ],
    }
  })

const removeElementRules = (fqn: Fqn) =>
  machine.assign(({ context }) => {
    const isRule = isRuleOf(fqn)
    return {
      rules: context.rules.filter((rule) => {
        return !isRule(rule)
      }),
    }
  })

const toggleElement = () =>
  machine.enqueueActions(({ context, event, enqueue }) => {
    assertEvent(event, 'toggle.element')
    const isRuleOfTheElement = isRuleOf(event.id)
    const lastRule = last(context.rules)
    // If the last rule is about the element,
    // We can just toggle it without searching for the element rules in the list
    if (lastRule && isRuleOfTheElement(lastRule)) {
      enqueue.assign({
        rules: context.rules.slice(0, -1),
      })
      return
    }

    const state = deriveElementState(event.id, context)
    switch (state.state) {
      case 'disabled': {
        enqueue(enableRule(state.ruleId))
        break
      }
      // Include element if it is not in view and not included/excluded by any rule
      case 'not-present': {
        enqueue(removeElementRules(event.id))
        // If the element has an explicit rule, but was not included in the view
        // lets re-add at the end of the rules list to make it effective again
        enqueue(addElementRules(event.id, 'include'))
        break
      }
      case 'include-implicit': {
        enqueue(removeElementRules(event.id))
        enqueue(addElementRules(event.id, 'exclude'))
        break
      }
      case 'include-explicit':
      case 'exclude': {
        enqueue(removeElementRules(event.id))
        break
      }
      default:
        nonexhaustive(state)
    }
  })

// Extracted actions
// const includePredicate = () =>
//   machine.assign(({ context, event }) => {
//     const id = stringHash((context.rules.at(-1)?.id ?? new Date().toISOString()) + event.type)
//     switch (event.type) {
//       case 'include.element': {
//         return {
//           rules: [
//             ...context.rules,
//             {
//               id,
//               expr: { ref: { model: event.model } },
//               enabled: true,
//               type: 'include',
//             },
//           ],
//         }
//       }
//       default: {
//         throw new Error(`Unexpected event ${event.type}}`)
//       }
//     }
//   })

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
    'toggle.element': {
      actions: [
        toggleElement(),
        emitViewUpdate(),
        scheduleLayout(),
      ],
      // ...to.layouting,
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
  initial: 'selecting',
  states: {
    idle,
    selecting,
    layouting,
  },
})
