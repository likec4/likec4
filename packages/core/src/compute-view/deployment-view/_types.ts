import { LikeC4DeploymentModel } from '../../model'
import type { DeploymentConnectionModel } from '../../model/DeploymentConnectionModel'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { AnyAux } from '../../model/types'
import type { DeploymentExpression } from '../../types'
import type { Memory } from './Memory'
import type { Stage } from './Stage'

export type Elem = DeploymentElementModel<AnyAux>

export type Connections<M extends AnyAux = AnyAux> = ReadonlyArray<DeploymentConnectionModel<M>>

export type PredicateParams<Expr extends DeploymentExpression = any> = {
  expr: Expr
  model: LikeC4DeploymentModel
  stage: Stage
  memory: Memory
}
