import type { AnyAux, Unknown } from './aux'
import type { ViewStage } from './view-common'
import type { ComputedDeploymentView, ComputedDynamicView, ComputedElementView } from './view-computed'
import type { LayoutedDeploymentView, LayoutedDynamicView, LayoutedElementView } from './view-layouted'
import type { ParsedDeploymentView } from './view-parsed.deployment'
import type { ParsedDynamicView } from './view-parsed.dynamic'
import type { ParsedElementView } from './view-parsed.element'

export type AnyLikeC4View<A extends AnyAux> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>

export type PickLikeC4ViewByStage<A extends AnyAux, S extends ViewStage> = Extract<AnyLikeC4View<A>, { _stage: S }>

/**
 * Should be `ParsedLikeC4View` but keep it for backward compatibility
 */
export type LikeC4View<A extends AnyAux = Unknown> = PickLikeC4ViewByStage<A, 'parsed'>

export type ViewRule<A extends AnyAux = Unknown> = LikeC4View<A>['rules'][number]
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

export type ViewRuleStyle<A extends AnyAux = Unknown> = Extract<ViewRule<A>, { targets: any[]; style: {} }>
export function isViewRuleStyle<R extends ViewRule<any>>(rule: R): rule is Extract<R, { targets: any[]; style: {} }> {
  return 'targets' in rule && 'style' in rule
}

export type ComputedView<A extends AnyAux = Unknown> = PickLikeC4ViewByStage<A, 'computed'>
export function isComputedView<V extends AnyLikeC4View<any>>(view: V): view is Extract<V, { _stage: 'computed' }> {
  return view._stage === 'computed'
}

export type DiagramView<A extends AnyAux = Unknown> = PickLikeC4ViewByStage<A, 'layouted'>
export function isDiagramView<V extends AnyLikeC4View<any>>(view: V): view is Extract<V, { _stage: 'layouted' }> {
  return view._stage === 'layouted'
}

export function isElementView<V extends AnyLikeC4View<any>>(view: V): view is Extract<V, { _type: 'element' }> {
  return view._type === 'element'
}

export function isDeploymentView<V extends AnyLikeC4View<any>>(view: V): view is Extract<V, { _type: 'deployment' }> {
  return view._type === 'deployment'
}

export function isDynamicView<V extends AnyLikeC4View<any>>(view: V): view is Extract<V, { _type: 'dynamic' }> {
  return view._type === 'dynamic'
}
