import { LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/connection/deployment'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { AnyAux } from '../../model/types'
import type { ExpressionV2 } from '../../types'
import { type Memory as GenericMemory, MutableMemory, type Patch as GenericPatch } from '../Memory'
import { Stage as GenericStage } from '../Stage'

export type Elem = DeploymentElementModel<AnyAux>
export type Connection = DeploymentConnectionModel<AnyAux>

export type Memory = GenericMemory<Elem, Connection>
export type Stage = GenericStage<Elem, Connection>
export const Stage = GenericStage<Elem, Connection>
export type Patch = GenericPatch<Memory>

export const emptyMemory = (): Memory =>
  new MutableMemory<DeploymentElementModel, DeploymentConnectionModel>(
    new Set(),
    new Set(),
    [],
    new Set()
  )

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
