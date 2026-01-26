import type { AdhocViewPredicate } from '@likec4/core/compute-view'
import type { Fqn, LayoutedElementView, ModelExpression } from '@likec4/core/types'
import { setup } from 'xstate'
import type { PromiseActorLogic } from 'xstate/actors'

type CalcAdhocViewInput = {
  predicates: AdhocViewPredicate[]
}
type CalcAdhocViewOutput = {
  view: LayoutedElementView
}

export type AdhocViewService = {
  process: (input: CalcAdhocViewInput) => Promise<CalcAdhocViewOutput>
}

export type AdhocViewServiceActor = PromiseActorLogic<CalcAdhocViewOutput, CalcAdhocViewInput>

export type Input = {}

export type AdhocRule = {
  id: string
  expr: ModelExpression
  enabled: boolean
  type: 'include' | 'exclude'
}

export function ruleToPredicate(rule: AdhocRule): AdhocViewPredicate {
  return rule.type === 'include' ? { include: [rule.expr] } : { exclude: [rule.expr] }
}

export interface Context {
  view: LayoutedElementView | null
  error: string | undefined
  rules: AdhocRule[]
}

export type EmittedEvents = { type: 'navigate.to' }

export type Events =
  | { type: 'include.element'; model: Fqn }
  | { type: 'exclude.element'; model: Fqn }
  | { type: 'toggle.rule'; ruleId: string }
  | { type: 'delete.rule'; ruleId: string }
  | { type: 'select.open' }
  | { type: 'select.close' }
  | { type: 'layout' }
  | { type: 'dispose' }

type Tags = 'hasView'

export const machine = setup({
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
