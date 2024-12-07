import { LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/connection/deployment'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { AnyAux } from '../../model/types'
import type { DeploymentExpression } from '../../types'
import type { Memory, Patch } from './Memory'
import type { Stage } from './Stage'

export type Elem = DeploymentElementModel<AnyAux>

export type Connections<M extends AnyAux = AnyAux> = ReadonlyArray<DeploymentConnectionModel<M>>

export type PredicateParams<Expr extends DeploymentExpression = any> = {
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

export interface PredicateExecutor<Expr extends DeploymentExpression> {
  include(expr: Expr, ctx: PredicateCtx): Patch
  exclude(expr: Expr, ctx: PredicateCtx): Patch
}
