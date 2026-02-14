import type { IsLiteral } from 'type-fest';
import type { Expression } from '../types';
import type { AnyTypes, Invalid, Types } from './_types';
import type { LikeC4ViewBuilder, ViewPredicate } from './Builder.view-common';
import type { ViewsBuilder } from './Builder.views';
export interface ElementViewBuilder<T extends AnyTypes> extends LikeC4ViewBuilder<T, T['Fqn'], Expression<Types.ToAux<T>>> {
}
export type ElementViewRulesBuilder<T extends AnyTypes> = (b: ElementViewBuilder<T>) => ElementViewBuilder<T>;
export interface AddViewRules<Id extends string> {
    with<S extends AnyTypes>(...rules: ElementViewRulesBuilder<S>[]): (builder: ViewsBuilder<S>) => ViewsBuilder<Types.AddView<S, Id>>;
}
export interface AddViewHelper {
    <const Id extends string, T extends AnyTypes>(id: Id): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, propsOrTitle: NoInfer<T['NewViewProps']> | string): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, propsOrTitle: NoInfer<T['NewViewProps']> | string | undefined, builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
}
type ValidFqn<T extends AnyTypes> = IsLiteral<T['Fqn']> extends true ? T['Fqn'] : Invalid<'Fqn must be a literal'>;
export interface AddViewOfHelper {
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<T>): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>;
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<T>, propsOrTitle: T['NewViewProps'] | string | ElementViewRulesBuilder<T>): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>;
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<T>, propsOrTitle: NoInfer<T>['NewViewProps'] | string, builder: (b: ElementViewBuilder<T>) => ElementViewBuilder<T>): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>;
}
export interface TypedAddViewOfHelper<A extends AnyTypes> {
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<A>): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<A>, builder: ((b: ElementViewBuilder<A>) => ElementViewBuilder<A>) | A['NewViewProps'] | string): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
    <const Id extends string, T extends AnyTypes>(id: Id, of: ValidFqn<A>, propsOrTitle: A['NewViewProps'] | string, builder: (b: ElementViewBuilder<A>) => ElementViewBuilder<A>): AddViewRules<Id> & {
        (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>;
    };
}
export declare function $expr<T extends AnyTypes>(expr: ViewPredicate.Expression<T> | Expression): Expression<Types.ToAux<T>>;
export {};
