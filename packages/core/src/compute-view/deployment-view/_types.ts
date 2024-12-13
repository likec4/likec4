import { LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/connection/deployment'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { AnyAux } from '../../model/types'
import type { ExpressionV2 } from '../../types'
import type { Memory, Patch } from './Memory'
import type { Stage } from './Stage'

export type Elem = DeploymentElementModel<AnyAux>

export type Connections<M extends AnyAux = AnyAux> = ReadonlyArray<DeploymentConnectionModel<M>>

export type PredicateParams<Expr extends ExpressionV2 = any> = {
  expr: Expr
  model: LikeC4DeploymentModel
  stage: Stage
  memory: Memory
}

export interface PredicateCtx {
  model: LikeC4DeploymentModel
  stage: Stage
  memory: Memory
}

export interface PredicateExecutor<Expr extends ExpressionV2> {
  include(expr: Expr, ctx: PredicateCtx): Patch
  exclude(expr: Expr, ctx: PredicateCtx): Patch
}
