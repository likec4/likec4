import type { RelationshipModel } from '../../model'
import { LikeC4DeploymentModel } from '../../model'
import type { AnyAux, Expression, OperatorPredicate } from '../../types'
import type { Ctx, Memory, Stage, StageExclude, StageInclude } from './memory'

export { Memory, type Stage } from './memory'

export type Where<T extends {}> = (x: T) => boolean

export type Elem = Ctx['Element']
export type Connection = Ctx['Connection']

export type ElementWhere = Where<Elem>
export type ElementWhereFilter = (elements: readonly Elem[]) => Elem[]
export type ConnectionWhere = Where<Connection>
export type RelationshipWhere = Where<RelationshipModel<any>>
export type ConnectionWhereFilter = (connections: readonly Connection[]) => Connection[]

export type Connections = ReadonlyArray<Connection>

export interface PredicateCtx<Expr = Expression<AnyAux>> {
  expr: Expr
  stage: Stage
  model: LikeC4DeploymentModel<AnyAux>
  memory: Memory
  where: OperatorPredicate<AnyAux> | null
}
export interface IncludePredicateCtx<Expr = Expression<AnyAux>> extends PredicateCtx<Expr> {
  stage: StageInclude
}
export interface ExcludePredicateCtx<Expr = Expression<AnyAux>> extends PredicateCtx<Expr> {
  stage: StageExclude
}

export interface PredicateExecutor<Expr extends Expression<AnyAux> = Expression<AnyAux>> {
  include(ctx: IncludePredicateCtx<Expr>): StageInclude | undefined
  exclude(ctx: ExcludePredicateCtx<Expr>): StageExclude | undefined
}
