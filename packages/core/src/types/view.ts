import { isTruthy } from 'remeda'
import type { AnyAux } from './aux'
import type { _stage, _type, ExtractOnStage, ModelStage } from './const'
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

export type AnyView<A extends AnyAux = AnyAux> =
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

export type AnyViews<S extends ModelStage, T extends ViewType = ViewType, A extends AnyAux = AnyAux> = AnyView<A> & {
  [_stage]: S
  [_type]: T
}

export type ViewWithType<V extends AnyView<AnyAux>, T extends ViewType> = Extract<V, { [_type]: T }>

export type ParsedView<A extends AnyAux = AnyAux> = ExtractOnStage<AnyView<A>, 'parsed'>
export type ComputedView<A extends AnyAux = AnyAux> = ExtractOnStage<AnyView<A>, 'computed'>
export type DiagramView<A extends AnyAux = AnyAux> = ExtractOnStage<AnyView<A>, 'layouted'>
/**
 * @alias DiagramView
 */
export type { DiagramView as LayoutedView }

/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type { ParsedView as LikeC4View }

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

export function isElementView<V>(view: V): view is V & { [_type]: 'element' } {
  return (view as any)._type === 'element'
}

export function isScopedElementView<V extends AnyView<AnyAux>>(
  view: V,
): view is Extract<V, { [_type]: 'element'; viewOf: string }> {
  return view._type === 'element' && isTruthy(view.viewOf)
}

export function isDeploymentView<V>(view: V): view is V & { [_type]: 'deployment' } {
  return (view as any)._type === 'deployment'
}

export function isDynamicView<V>(view: V): view is V & { [_type]: 'dynamic' } {
  return (view as any)._type === 'dynamic'
}
