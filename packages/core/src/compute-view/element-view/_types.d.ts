import type { LikeC4Model } from '../../model';
import type { ConnectionModel } from '../../model';
import type { RelationshipModel } from '../../model';
import type { ModelExpression, ModelFqnExpr, ModelRelationExpr } from '../../types';
import type { Ctx, Memory, Stage, StageExclude, StageInclude } from './memory';
export type Where<T extends {}> = (x: T) => boolean;
export type Elem = Ctx['Element'];
export type Connection = Ctx['Connection'];
export type ElementWhere = Where<Elem>;
export type ElementWhereFilter = (elements: readonly Elem[]) => Elem[];
export type ConnectionWhere = Where<Connection>;
export type RelationshipWhere = Where<RelationshipModel<any>>;
export type ConnectionWhereFilter = (connections: readonly Connection[]) => Connection[];
export { Memory } from './memory';
export type Connections = ReadonlyArray<ConnectionModel<any>>;
export interface PredicateCtx<Expr = ModelExpression<any>> {
    expr: Expr;
    stage: Stage;
    scope: Elem | null;
    model: LikeC4Model<any>;
    memory: Memory;
    where: Expr extends ModelRelationExpr<any> ? RelationshipWhere : Expr extends ModelFqnExpr<any> ? ElementWhere : never;
    filterWhere: Expr extends ModelRelationExpr<any> ? ConnectionWhereFilter : Expr extends ModelFqnExpr<any> ? ElementWhereFilter : never;
}
export interface IncludePredicateCtx<Expr = ModelExpression<any>> extends PredicateCtx<Expr> {
    stage: StageInclude;
}
export interface ExcludePredicateCtx<Expr = ModelExpression<any>> extends PredicateCtx<Expr> {
    stage: StageExclude;
}
export interface PredicateExecutor<Expr = ModelExpression<any>> {
    include(ctx: IncludePredicateCtx<Expr>): StageInclude | undefined;
    exclude(ctx: ExcludePredicateCtx<Expr>): StageExclude | undefined;
}
