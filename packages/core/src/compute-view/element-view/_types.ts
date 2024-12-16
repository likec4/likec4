import { type LikeC4Model } from '../../model'
import type { ConnectionModel } from '../../model/connection/model'
import type { ElementModel } from '../../model/ElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import type { ElementExpression, Expression, RelationExpression } from '../../types/expression'

import type { Ctx, Memory, Stage, StageExclude, StageInclude } from './memory'

export type Where<T extends {}> = (x: T) => boolean

export type Elem = Ctx['Element']
export type Connection = Ctx['Connection']

export type ElementWhere = Where<Elem>
export type ElementWhereFilter = (elements: readonly Elem[]) => Elem[]
export type ConnectionWhere = Where<Connection>
export type RelationshipWhere = Where<RelationshipModel>
export type ConnectionWhereFilter = (connections: readonly Connection[]) => Connection[]

export { Memory } from './memory'

export type Connections = ReadonlyArray<ConnectionModel<AnyAux>>

export interface PredicateCtx<Expr extends Expression = Expression> {
  expr: Expr
  stage: Stage
  // View scope
  scope: Elem | null
  model: LikeC4Model<AnyAux>
  memory: Memory
  where: Expr extends RelationExpression ? RelationshipWhere
    : Expr extends ElementExpression ? ElementWhere
    : never
  filterWhere: Expr extends RelationExpression ? ConnectionWhereFilter
    : Expr extends ElementExpression ? ElementWhereFilter
    : never
}
export interface IncludePredicateCtx<Expr extends Expression = Expression> extends PredicateCtx<Expr> {
  stage: StageInclude
}
export interface ExcludePredicateCtx<Expr extends Expression = Expression> extends PredicateCtx<Expr> {
  stage: StageExclude
}

export interface PredicateExecutor<Expr extends Expression> {
  include(ctx: IncludePredicateCtx<Expr>): StageInclude | undefined | void
  exclude(ctx: ExcludePredicateCtx<Expr>): StageExclude | undefined | void
}
