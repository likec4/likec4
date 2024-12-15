import { type LikeC4Model } from '../../model'
import type { ConnectionModel } from '../../model/connection/model'
import type { ElementModel } from '../../model/ElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import type { ElementExpression, Expression, RelationExpression } from '../../types/expression'
import type { Memory, Patch } from './Memory'
import type { Stage } from './Stage'

export type Where<T extends {}> = (x: T) => boolean

export type Elem = ElementModel<AnyAux>
export type Connection = ConnectionModel<AnyAux>

export type ElementWhere = Where<Elem>
export type ElementWhereFilter = (elements: readonly Elem[]) => Elem[]
export type ConnectionWhere = Where<Connection>
export type RelationshipWhere = Where<RelationshipModel>
export type ConnectionWhereFilter = (connections: readonly Connection[]) => Connection[]

export type { Memory, Patch }

export type Connections<M extends AnyAux = AnyAux> = ReadonlyArray<ConnectionModel<M>>

export interface PredicateCtx<Expr extends Expression = Expression> {
  expr: Expr
  // View scope
  scope: Elem | null
  model: LikeC4Model
  stage: Stage
  memory: Memory
  where: Expr extends RelationExpression ? RelationshipWhere
    : Expr extends ElementExpression ? ElementWhere
    : never
  filterWhere: Expr extends RelationExpression ? ConnectionWhereFilter
    : Expr extends ElementExpression ? ElementWhereFilter
    : never
}

export interface PredicateExecutor<Expr extends Expression> {
  include(ctx: PredicateCtx<Expr>): Patch | undefined
  exclude(ctx: PredicateCtx<Expr>): Patch | undefined
}
