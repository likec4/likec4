import type * as aux from './_aux';
import type { Any } from './_aux';
import type { _stage, _type, ExtractOnStage, ModelStage } from './const';
import type { ViewType } from './view-common';
import type { ComputedDeploymentView, ComputedDynamicView, ComputedElementView } from './view-computed';
import type { LayoutedDeploymentView, LayoutedDynamicView, LayoutedElementView } from './view-layouted';
import type { ParsedDeploymentView } from './view-parsed.deployment';
import type { ParsedDynamicView } from './view-parsed.dynamic';
import type { ParsedElementView } from './view-parsed.element';
export type ParsedView<A extends Any = Any> = ParsedElementView<A> | ParsedDeploymentView<A> | ParsedDynamicView<A>;
/**
 * Should be `ParsedView` but keep it for backward compatibility
 * @deprecated use `ParsedView`
 */
export type { ParsedView as LikeC4View };
export type ComputedView<A extends Any = Any> = ComputedElementView<A> | ComputedDeploymentView<A> | ComputedDynamicView<A>;
export type LayoutedView<A extends Any = Any> = LayoutedElementView<A> | LayoutedDeploymentView<A> | LayoutedDynamicView<A>;
export type ProcessedView<A extends Any = Any> = ComputedView<A> | LayoutedView<A>;
/**
 * @alias DiagramView
 */
export type { LayoutedView as DiagramView };
export type AnyView<A extends Any = Any> = ParsedElementView<A> | ParsedDeploymentView<A> | ParsedDynamicView<A> | ComputedElementView<A> | ComputedDeploymentView<A> | ComputedDynamicView<A> | LayoutedElementView<A> | LayoutedDeploymentView<A> | LayoutedDynamicView<A>;
export type ViewOnStage<V extends AnyView<Any>, T extends ModelStage> = Extract<V, {
    [_stage]: T;
}>;
export type ViewWithType<V extends AnyView<Any>, T extends ViewType> = Extract<V, {
    [_type]: T;
}>;
export type ViewRule<A extends Any = Any> = ParsedView<A>['rules'][number];
export type ViewRulePredicate<A extends Any = Any> = Extract<ViewRule<A>, {
    include: any[];
} | {
    exclude: any[];
}>;
export declare function isViewRulePredicate<V extends ViewRule<any>>(rule: V): rule is Extract<V, {
    include: any[];
} | {
    exclude: any[];
}>;
export declare function isViewRuleStyle<V extends ViewRule<any>>(rule: V): rule is Extract<V, {
    targets: any[];
    style: {};
}>;
export declare function isComputedView<V extends AnyView<any>>(view: V): view is ExtractOnStage<V, 'computed'>;
export declare function isDiagramView<V extends AnyView<any>>(view: V): view is ExtractOnStage<V, 'layouted'>;
export { isDiagramView as isLayoutedView };
export declare function isElementView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'element'>;
export declare function isScopedElementView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'element'> & {
    viewOf: aux.StrictFqn<Any>;
};
export declare function isExtendsElementView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'element'> & {
    extends: aux.StrictViewId<Any>;
};
export declare function isDeploymentView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'deployment'>;
export declare function isDynamicView<V extends AnyView<any>>(view: V): view is ViewWithType<V, 'dynamic'>;
