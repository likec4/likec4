import type { Opaque } from 'type-fest'
import type { ElementShape, Fqn, ThemeColor } from './element'
import type { ElementExpression, Expression } from './expression'

// Full-qualified-name
export type ViewID = Opaque<string, 'ViewID'>

export interface ViewRuleInclude {
  include: Expression[]
}
export function isViewRuleInclude(rule: ViewRule): rule is ViewRuleInclude {
  return 'include' in rule
}

export interface ViewRuleExclude {
  exclude: Expression[]
}

export function isViewRuleExclude(rule: ViewRule): rule is ViewRuleExclude {
  return 'exclude' in rule
}


export interface ViewRuleStyle {
  style: {
    targets: ElementExpression[]
    color?: ThemeColor
    shape?: ElementShape
  }
}
export function isViewRuleStyle(rule: ViewRule): rule is ViewRuleStyle {
  return 'style' in rule
}


export type ViewRule = ViewRuleInclude | ViewRuleExclude | ViewRuleStyle

export interface ElementView {
  readonly id: ViewID
  readonly viewOf?: Fqn
  readonly title?: string
  readonly description?: string
  readonly rules: ViewRule[]
}
