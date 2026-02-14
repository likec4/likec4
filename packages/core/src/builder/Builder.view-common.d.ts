import type { Simplify } from 'type-fest';
import type { AnyViewRuleStyle as ViewRuleStyle, AutoLayoutDirection, ModelRelationExpr, NonEmptyArray } from '../types';
import { ModelFqnExpr } from '../types';
import type { Participant } from '../types/operators';
import type { AnyTypes, Types } from './_types';
export interface LikeC4ViewBuilder<Types extends AnyTypes, Fqn extends string, TypedExpr, ElementExpr extends string = ViewPredicate.ElementExpr<Fqn>, Expr extends string = ViewPredicate.AllExpression<ElementExpr>> {
    Types: Types;
    ElementExpr: ElementExpr;
    Expr: Expr;
    TypedExpr: TypedExpr;
    $expr(expr: Expr | TypedExpr): TypedExpr;
    include(...exprs: Expr[]): this;
    exclude(...exprs: Expr[]): this;
    style(rule: ViewRuleStyle<any>): this;
    autoLayout(layout: AutoLayoutDirection): this;
}
export declare namespace ViewPredicate {
    type ElementExpr<Fqn extends string> = '*' | Fqn | `${Fqn}.*` | `${Fqn}._` | `${Fqn}.**`;
    type AllExpression<ElementExpr extends string> = ElementExpr | `-> ${ElementExpr} ->` | `-> ${ElementExpr}` | `${ElementExpr} ->` | `${ElementExpr} ${'->' | '<->'} ${ElementExpr}`;
    type Expression<T extends AnyTypes> = T extends Types<any, infer F extends string, any, any, any, any, any, any> ? AllExpression<ViewPredicate.ElementExpr<F>> : never;
    type ConnectionExpression<T extends AnyTypes> = T extends Types<any, infer F extends string, any, any, any, any, any, any> ? `${F} -> ${F}` : never;
    type DeploymentExpression<T extends AnyTypes> = T extends Types<any, any, any, any, any, any, any, infer F extends string> ? AllExpression<ViewPredicate.ElementExpr<F>> : never;
    type DeploymentConnectionExpression<T extends AnyTypes> = T extends Types<any, any, any, any, any, any, any, infer F extends string> ? `${F} -> ${F}` : never;
    type WhereTag<Tag extends string> = `tag ${'is' | 'is not'} #${Tag}`;
    type WhereKind<Kind extends string> = `kind ${'is' | 'is not'} ${Kind}`;
    type WhereParticipant<Types extends AnyTypes> = `${Participant}.${WhereTag<Types['Tag']> | WhereKind<Types['ElementKind']>}`;
    type WhereEq<Types extends AnyTypes> = ViewPredicate.WhereTag<Types['Tag']> | ViewPredicate.WhereKind<Types['ElementKind']> | ViewPredicate.WhereKind<Types['DeploymentKind']> | ViewPredicate.WhereParticipant<Types>;
    type WhereOperator<Types extends AnyTypes> = ViewPredicate.WhereEq<Types> | {
        and: NonEmptyArray<ViewPredicate.WhereOperator<Types>>;
        or?: never;
        not?: never;
    } | {
        or: NonEmptyArray<ViewPredicate.WhereOperator<Types>>;
        and?: never;
        not?: never;
    } | {
        not: ViewPredicate.WhereOperator<Types>;
        and?: never;
        or?: never;
    };
    type Custom<Types extends AnyTypes> = {
        where?: ViewPredicate.WhereOperator<Types>;
        with?: Simplify<Omit<ModelFqnExpr.Custom['custom'] & ModelRelationExpr.Custom['customRelation'], 'expr' | 'relation' | 'navigateTo'> & {
            navigateTo?: Types['ViewId'];
        }>;
    };
}
declare function $include<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(...args: [B['Expr']] | [B['TypedExpr']] | [B['Expr'], ViewPredicate.Custom<B['Types']>]): (b: B) => B;
declare function $exclude<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(...args: [B['Expr']] | [B['TypedExpr']] | [B['Expr'], ViewPredicate.Custom<B['Types']>] | [B['TypedExpr'], ViewPredicate.Custom<B['Types']>]): (b: B) => B;
/**
 * @example
 *  builder.views(({ view, $style }, _) =>
 *    _(
 *      view('view1').with(
 *        $style('*', {
 *          color: 'red',
 *        }),
 *        $style(['bob', 'alice'], {
 *          color: 'blue',
 *        }),
 *      ),
 *    )
 *  )
 */
declare function $style<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(element: B['ElementExpr'] | B['TypedExpr'] | NonEmptyArray<B['ElementExpr']>, { notation, ...style }: ViewRuleStyle<any>['style'] & {
    notation?: string;
}): (b: B) => B;
declare function $autoLayout<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(layout: AutoLayoutDirection): (b: B) => B;
type Op<T> = (b: T) => T;
declare function $rules<B extends LikeC4ViewBuilder<AnyTypes, any, any>>(...rules: Op<B>[]): (b: B) => B;
export { $autoLayout, $exclude, $include, $rules, $style };
