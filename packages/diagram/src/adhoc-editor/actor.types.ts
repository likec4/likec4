import type { AdhocViewPredicate } from '@likec4/core/compute-view'
import type { Fqn, LayoutedElementView } from '@likec4/core/types'
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
  rule: AdhocViewPredicate
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
  | { type: 'select.open' }
  | { type: 'select.close' }
  | { type: 'dispose' }
