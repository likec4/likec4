import { isTruthy } from 'remeda'
import type { IsAny, IsNever, Or } from 'type-fest'
import type * as aux from './_aux'
import type { Any } from './_aux'
import type { _stage, _type, ExtractOnStage, ModelStage } from './const'
import type { ViewType } from './view-common'
import type {
  ComputedDeploymentView,
  ComputedDynamicView,
  ComputedElementView,
  ComputedStoryView,
} from './view-computed'
import type {
  LayoutedDeploymentView,
  LayoutedDynamicView,
  LayoutedElementView,
  LayoutedStoryView,
} from './view-layouted'
import type { ParsedDeploymentView } from './view-parsed.deployment'
import type { ParsedDynamicView } from './view-parsed.dynamic'
import type { ParsedElementView } from './view-parsed.element'
import type { ParsedStoryView } from './view-parsed.story'

export type ParsedView<A extends Any = Any> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ParsedStoryView<A>

/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type { ParsedView as LikeC4View }

export type ComputedView<A extends Any = Any> =
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | ComputedStoryView<A>

export type LayoutedView<A extends Any = Any> =
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>
  | LayoutedStoryView<A>

export type ProcessedView<A extends Any = Any> =
  | ComputedView<A>
  | LayoutedView<A>

export type ProcessedDynamicView<A extends Any = Any> =
  | ComputedDynamicView<A>
  | LayoutedDynamicView<A>

/**
 * @alias DiagramView
 */
export type { LayoutedView as DiagramView }
export type AnyView<A extends Any = Any> =
  | ParsedElementView<A>
  | ParsedDeploymentView<A>
  | ParsedDynamicView<A>
  | ParsedStoryView<A>
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>
  | ComputedStoryView<A>
  | LayoutedElementView<A>
  | LayoutedDeploymentView<A>
  | LayoutedDynamicView<A>
  | LayoutedStoryView<A>

export type ViewOnStage<V extends AnyView<Any>, T extends ModelStage> = Extract<V, { [_stage]: T }>
export type ViewWithType<V extends AnyView<any>, T extends ViewType> = Extract<V, { [_type]: T }>

export type InferViewAux<V> =
  // dprint-ignore
  V extends AnyView<infer A extends Any>
    ? Or<IsAny<A>, IsNever<A>> extends true
      ? never
      : A
  : never

export type ViewRule<A extends Any = Any> = Extract<ParsedView<A>, { rules: unknown[] }>['rules'][number]
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

export function isStoryView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'story'> {
  return view._type === 'story'
}
