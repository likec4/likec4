import type { AnyAux, Unknown } from '../types'
import type {
  DeploymentElementModel,
  DeploymentRelationEndpoint,
  NestedElementOfDeployedInstanceModel,
} from './DeploymentElementModel'
import { DeployedInstanceModel, DeploymentNodeModel, DeploymentRelationModel } from './DeploymentElementModel'
import { ElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import { type AnyRelationshipModel, RelationshipModel } from './RelationModel'

export function isDeploymentNode<M extends AnyAux>(
  model: DeploymentElementModel<M>,
): model is DeploymentNodeModel<M> {
  return model.isDeploymentNode()
}

export function isDeployedInstance<M extends AnyAux>(
  model: DeploymentElementModel<M>,
): model is DeployedInstanceModel<M> {
  return model.isInstance()
}

export function isNestedElementOfDeployedInstanceModel<M extends AnyAux>(
  model: DeploymentRelationEndpoint<M>,
): model is NestedElementOfDeployedInstanceModel<M> {
  return !model.isInstance() && !model.isDeploymentNode()
}

export function isDeploymentRelation<M extends AnyAux>(x: AnyRelationshipModel<M>): x is DeploymentRelationModel<M> {
  return x instanceof DeploymentRelationModel
}

export function isModelRelation<M extends AnyAux>(x: AnyRelationshipModel<M>): x is RelationshipModel<M> {
  return x instanceof RelationshipModel
}

export function isDeploymentElementModel<M extends AnyAux = Unknown>(x: unknown): x is DeploymentElementModel<M> {
  return x instanceof DeploymentNodeModel || x instanceof DeployedInstanceModel
}

export function isElementModel<M extends AnyAux = Unknown>(element: unknown): element is ElementModel<M> {
  return element instanceof ElementModel
}

export function isComputedLikeC4Model<M extends AnyAux>(model: LikeC4Model<M, any>): model is LikeC4Model.Computed<M> {
  return model.type === 'computed'
}

export function isLayoutedLikeC4Model<M extends AnyAux>(model: LikeC4Model<M, any>): model is LikeC4Model.Layouted<M> {
  return model.type === 'layouted'
}
