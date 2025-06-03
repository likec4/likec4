import type { AnyAux, Unknown } from './aux'
import type { _type, ExtractOnStage } from './const'
import type { ViewType } from './view-common'
import type {
  ComputedDeploymentView,
  ComputedDynamicView,
  ComputedElementView,
  ComputedScopedElementView,
} from './view-computed'
import type {
  LayoutedDeploymentView,
  LayoutedDynamicView,
  LayoutedElementView,
  LayoutedScopedElementView,
} from './view-layouted'
import type { ParsedDeploymentView } from './view-parsed.deployment'
import type { ParsedDynamicView } from './view-parsed.dynamic'
import type { ParsedElementView, ParsedScopedElementView } from './view-parsed.element'

export type AnyView<A extends AnyAux> =
  | ParsedElementView<A>
  | ParsedScopedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ComputedElementView<A>
  | ComputedScopedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | LayoutedElementView<A>
  | LayoutedScopedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>

export type ViewWithType<V extends AnyView<any>, T extends ViewType> = Extract<V, { [_type]: T }>

export type ParsedView<A extends AnyAux = Unknown> = ExtractOnStage<AnyView<A>, 'parsed'>
export type ComputedView<A extends AnyAux = Unknown> = ExtractOnStage<AnyView<A>, 'computed'>
export type DiagramView<A extends AnyAux = Unknown> = ExtractOnStage<AnyView<A>, 'layouted'>
/**
 * @alias DiagramView
 */
export type LayoutedView<A extends AnyAux = Unknown> = DiagramView<A>

/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type LikeC4View<A extends AnyAux = Unknown> = ParsedView<A>

export type ViewRule<A extends AnyAux = Unknown> = ParsedView<A>['rules'][number]
export type ViewRulePredicate<A extends AnyAux = Unknown> = Extract<
  ViewRule<A>,
  { include: any[] } | { exclude: any[] }
>

export function isViewRulePredicate<R extends ViewRule<any>>(rule: R): rule is Extract<
  R,
  { include: any[] } | { exclude: any[] }
> {
  return 'include' in rule || 'exclude' in rule
}

export function isViewRuleStyle<R extends ViewRule<any>>(rule: R): rule is Extract<R, { targets: any[]; style: {} }> {
  return 'targets' in rule && 'style' in rule
}

export function isComputedView<V extends AnyView<any>>(view: V): view is ExtractOnStage<V, 'computed'> {
  return view._stage === 'computed'
}

export function isDiagramView<V extends AnyView<any>>(view: V): view is ExtractOnStage<V, 'layouted'> {
  return view._stage === 'layouted'
}
export { isDiagramView as isLayoutedView }

export function isElementView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'element'> {
  return view._type === 'element'
}

export function isDeploymentView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'deployment'> {
  return view._type === 'deployment'
}

export function isDynamicView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'dynamic'> {
  return view._type === 'dynamic'
}
