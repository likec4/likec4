import type {
  DeploymentElementModel,
  DeploymentRelationEndpoint,
  NestedElementOfDeployedInstanceModel,
} from './DeploymentElementModel'
import { DeployedInstanceModel, DeploymentNodeModel } from './DeploymentElementModel'
import type { AnyAux } from './types'

export function isDeploymentNode(model: DeploymentElementModel): model is DeploymentNodeModel {
  return model.isDeploymentNode()
}

export function isDeployedInstance(model: DeploymentElementModel): model is DeployedInstanceModel {
  return model.isInstance()
}

export function isNestedElementOfDeployedInstanceModel<M extends AnyAux = AnyAux>(
  model: DeploymentRelationEndpoint<M>,
): model is NestedElementOfDeployedInstanceModel<M> {
  return !model.isInstance() && !model.isDeploymentNode()
}

export function isDeploymentElementModel(x: any): x is DeploymentElementModel {
  return x instanceof DeploymentNodeModel || x instanceof DeployedInstanceModel
}
