import type { IconUrl, NonEmptyArray } from './_common'
import type { ElementShape, Fqn, Tag } from './element'
import type { ElementExpression, Expression } from './expression'
import type { Opaque } from './opaque'
import type { ThemeColor } from './theme'

// Full-qualified-name
export type ViewID = Opaque<string, 'ViewID'>

export type ViewRuleExpression =
  | {
    include: Expression[]
    exclude?: never
  }
  | {
    include?: never
    exclude: Expression[]
  }
export function isViewRuleExpression(rule: ViewRule): rule is ViewRuleExpression {
  return (
    ('include' in rule && Array.isArray(rule.include))
    || ('exclude' in rule && Array.isArray(rule.exclude))
  )
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

export type AutoLayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'
export interface ViewRuleAutoLayout {
  autoLayout: AutoLayoutDirection
}
export function isViewRuleAutoLayout(rule: ViewRule): rule is ViewRuleAutoLayout {
  return 'autoLayout' in rule
}

export type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout

export interface BasicElementView {
  readonly id: ViewID
  readonly viewOf?: Fqn
  readonly title: string | null
  readonly description: string | null
  readonly tags: NonEmptyArray<Tag> | null
  readonly links: NonEmptyArray<string> | null
  readonly rules: ViewRule[]
  /**
   * URI to the source file of this view.
   * Undefined if the view is auto-generated.
   */
  readonly docUri?: string
  /**
   * For all views we find common ancestor path.
   * This is used to generate relative paths, i.e.:
   * - "" for views in the common ancestor directory (or root)
   * - "subdir" for views in "<root>/subdir"
   * - "subdir/subdir1" for views in "<root>/subdir/subdir1"
   *
   * Undefined if the view is auto-generated.
   */
  readonly relativePath?: string
}
export interface StrictElementView extends BasicElementView {
  readonly viewOf: Fqn
}
export function isStrictElementView(view: ElementView): view is StrictElementView {
  return 'viewOf' in view
}

export interface ExtendsElementView extends BasicElementView {
  readonly extends: ViewID
}
export function isExtendsElementView(view: ElementView): view is ExtendsElementView {
  return 'extends' in view
}

export type ElementView = StrictElementView | ExtendsElementView | BasicElementView
