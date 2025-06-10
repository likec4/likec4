import { isTruthy } from 'remeda'
import type { Any } from './aux'
import * as aux from './aux'
import type { _stage, _type, ExtractOnStage, ModelStage } from './const'
import type { ViewType } from './view-common'
import type {
  ComputedDeploymentView,
  ComputedDynamicView,
  ComputedElementView,
} from './view-computed'
import type {
  LayoutedDeploymentView,
  LayoutedDynamicView,
  LayoutedElementView,
} from './view-layouted'
import type { ParsedDeploymentView } from './view-parsed.deployment'
import type { ParsedDynamicView } from './view-parsed.dynamic'
import type { ParsedElementView } from './view-parsed.element'

export type ParsedView<A extends Any = Any> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>

// export type ParsedView<A extends Any = Any> = ExclusiveUnion<{
//   Element: ParsedElementView<A>
//   Deployment: ParsedDeploymentView<A>
//   Dynamic: ParsedDynamicView<A>
// }>
/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type { ParsedView as LikeC4View }

export type ComputedView<A extends Any = Any> =
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
// export type ComputedView<A extends Any = Any> = ExclusiveUnion<{
//   Element: ComputedElementView<A>
//   Deployment: ComputedDeploymentView<A>
//   Dynamic: ComputedDynamicView<A>
// }>

// export type LayoutedView<A extends Any = Any> = ExclusiveUnion<{
//   Element: LayoutedElementView<A>
//   Deployment: LayoutedDeploymentView<A>
//   Dynamic: LayoutedDynamicView<A>
// }>

export type LayoutedView<A extends Any = Any> =
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>

export type ProcessedView<A extends Any = Any> =
  | ComputedView<A>
  | LayoutedView<A>

/**
 * @alias DiagramView
 */
export type { LayoutedView as DiagramView }
export type AnyView<A extends Any = Any> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>
// export type AnyView<A extends Any = Any> = ExclusiveUnion<{
//   ParsedElement: ParsedElementView<A>
//   ParsedDeployment: ParsedDeploymentView<A>
//   ParsedDynamic: ParsedDynamicView<A>
//   ComputedElement: ComputedElementView<A>
//   ComputedDeployment: ComputedDeploymentView<A>
//   ComputedDynamic: ComputedDynamicView<A>
//   LayoutedElement: LayoutedElementView<A>
//   LayoutedDeployment: LayoutedDeploymentView<A>
//   LayoutedDynamic: LayoutedDynamicView<A>
// }>

export type ViewOnStage<V extends AnyView<Any>, T extends ModelStage> = Extract<V, { [_stage]: T }>
export type ViewWithType<V extends AnyView<Any>, T extends ViewType> = Extract<V, { [_type]: T }>

export type ViewRule<A extends Any = Any> = ParsedView<A>['rules'][number]
export type ViewRulePredicate<A extends Any = Any> = Extract<
  ViewRule<A>,
  { include: any[] } | { exclude: any[] }
>

export function isViewRulePredicate<V extends ViewRule<any>>(rule: V): rule is Extract<
  V,
  { include: any[] } | { exclude: any[] }
> {
  return 'include' in rule || 'exclude' in rule
}

export function isViewRuleStyle<V extends ViewRule<any>>(
  rule: V,
): rule is Extract<V, { targets: any[]; style: {} }> {
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

export function isScopedElementView<V extends AnyView<any>>(
  view: V,
): view is ViewWithType<V, 'element'> & { viewOf: aux.StrictFqn<Any> } {
  return isElementView(view) && isTruthy(view.viewOf)
}

export function isExtendsElementView<V extends AnyView<any>>(
  view: V,
): view is ViewWithType<V, 'element'> & { extends: aux.StrictViewId<Any> } {
  return isElementView(view) && isTruthy(view.extends)
}

export function isDeploymentView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'deployment'> {
  return view._type === 'deployment'
}

export function isDynamicView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'dynamic'> {
  return view._type === 'dynamic'
}
