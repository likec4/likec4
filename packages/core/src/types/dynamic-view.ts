import type { Fqn } from './element'
import type { BasicView, ViewID, ViewRuleAutoLayout, ViewRuleStyle } from './view'

export interface DynamicViewStep {
  readonly source: Fqn
  readonly target: Fqn
  readonly text: string
}

export type DynamicViewRule = ViewRuleStyle | ViewRuleAutoLayout

export interface DynamicView extends BasicView<'dynamic'> {
  readonly __: 'dynamic'

  readonly steps: DynamicViewStep[]

  readonly rules: DynamicViewRule[]
}

export function isDynamicView(view: BasicView): view is DynamicView {
  return view.__ === 'dynamic'
}
