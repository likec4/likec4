import type { DeployedInstanceModel, DeploymentElementModel, DeploymentNodeModel } from './DeploymentElementModel'

export function isDeploymentNode(model: DeploymentElementModel): model is DeploymentNodeModel {
  return model.isDeploymentNode()
}

export function isDeployedInstance(model: DeploymentElementModel): model is DeployedInstanceModel {
  return model.isInstance()
}
