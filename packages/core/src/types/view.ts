import type { Opaque } from './opaque'
import type { ElementShape, Fqn, Tag, ThemeColor } from './element'
import type { ElementExpression, Expression } from './expression'
import type { IconUrl, NonEmptyArray } from './_common'

// Full-qualified-name
export type ViewID = Opaque<string, 'ViewID'>

export interface ViewRuleExpression {
  isInclude: boolean
  exprs: Expression[]
}
export function isViewRuleExpression(rule: ViewRule): rule is ViewRuleExpression {
  return 'exprs' in rule && 'isInclude' in rule
}

export interface ViewRuleStyle {
  targets: ElementExpression[]
  style: {
    color?: ThemeColor
    shape?: ElementShape
    icon?: IconUrl
  }
}
export function isViewRuleStyle(rule: ViewRule): rule is ViewRuleStyle {
  return 'style' in rule && 'targets' in rule
}

export interface ViewRuleAutoLayout {
  autoLayout: 'TB' | 'BT' | 'LR' | 'RL'
}
export function isViewRuleAutoLayout(rule: ViewRule): rule is ViewRuleAutoLayout {
  return 'autoLayout' in rule
}

export type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout

export interface ElementView {
  readonly id: ViewID
  readonly viewOf?: Fqn
  readonly title: string | null
  readonly description: string | null
  readonly tags: NonEmptyArray<Tag> | null
  readonly links: NonEmptyArray<string> | null
  readonly rules: ViewRule[]
}
