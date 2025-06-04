import { isTruthy } from 'remeda'
import type { AnyAux } from './aux'
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

export type ParsedView<A extends AnyAux = AnyAux> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type { ParsedView as LikeC4View }

export type ComputedView<A extends AnyAux = AnyAux> =
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>

export type LayoutedView<A extends AnyAux = AnyAux> =
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>
/**
 * @alias DiagramView
 */
export type { LayoutedView as DiagramView }

export type AnyView<A extends AnyAux = AnyAux> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>

export type AnyViews<S extends ModelStage, T extends ViewType = ViewType, A extends AnyAux = AnyAux> = AnyView<A> & {
  [_stage]: S
  [_type]: T
}

export type ViewWithType<V extends AnyView<AnyAux>, T extends ViewType> = Extract<V, { [_type]: T }>

export type ViewRule<A extends AnyAux = AnyAux> = ParsedView<A>['rules'][number]
export type ViewRulePredicate<A extends AnyAux = AnyAux> = Extract<
  ViewRule<A>,
  { include: any[] } | { exclude: any[] }
>

export function isViewRulePredicate<R extends ViewRule<any>>(rule: R): rule is Extract<
  R,
  { include: any[] } | { exclude: any[] }
> {
  return 'include' in rule || 'exclude' in rule
}

export function isViewRuleStyle<R extends ViewRule<AnyAux>>(
  rule: R,
): rule is Extract<R, { targets: any[]; style: {} }> {
  return 'targets' in rule && 'style' in rule
}

export function isComputedView<V extends AnyView<AnyAux>>(view: V): view is ExtractOnStage<V, 'computed'> {
  return view._stage === 'computed'
}

export function isDiagramView<V extends AnyView<AnyAux>>(view: V): view is ExtractOnStage<V, 'layouted'> {
  return view._stage === 'layouted'
}
export { isDiagramView as isLayoutedView }

export function isElementView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'element'> {
  return view._type === 'element'
}

export function isScopedElementView<V extends AnyView<any>>(
  view: V,
): view is ViewWithType<V, 'element'> & { viewOf: aux.StrictFqn<AnyAux> } {
  return isElementView(view) && isTruthy(view.viewOf)
}

export function isExtendsElementView<V extends AnyView<any>>(
  view: V,
): view is ViewWithType<V, 'element'> & { extends: aux.StrictViewId<AnyAux> } {
  return isElementView(view) && isTruthy(view.extends)
}

export function isDeploymentView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'deployment'> {
  return view._type === 'deployment'
}

export function isDynamicView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'dynamic'> {
  return view._type === 'dynamic'
}
