import type { Expression } from '../types';
import type { AnyTypes, Types } from './_types';
import type { LikeC4ViewBuilder, ViewPredicate } from './Builder.view-common';
import type { ViewsBuilder } from './Builder.views';
export interface DeploymentViewBuilder<T extends AnyTypes> extends LikeC4ViewBuilder<T, T['DeploymentFqn'], Types.ToExpression<T>> {
}
export type DeploymentRulesBuilderOp<Types extends AnyTypes> = (b: DeploymentViewBuilder<Types>) => DeploymentViewBuilder<Types>;
export interface AddDeploymentViewRules<Id extends string> {
    with<S extends AnyTypes>(...rules: DeploymentRulesBuilderOp<S>[]): (builder: ViewsBuilder<S>) => ViewsBuilder<Types.AddView<S, Id>>;
}
/**
 * Chainable builder to create element
 */
export interface AddDeploymentViewHelper {
    <const Id extends string, T extends AnyTypes>(id: Id): AddDeploymentViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, bulder: (b: DeploymentViewBuilder<T>) => DeploymentViewBuilder<T>): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>;
    <const Id extends string, T extends AnyTypes>(id: Id, propsOrTitle: T['NewViewProps'] | string): AddDeploymentViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, propsOrTitle: T['NewViewProps'] | string, bulder: (b: DeploymentViewBuilder<T>) => DeploymentViewBuilder<T>): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>;
}
export declare function $deploymentExpr<T extends AnyTypes>(expr: ViewPredicate.DeploymentExpression<T> | Expression): Types.ToExpression<T>;
