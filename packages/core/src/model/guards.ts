import type { Any, AnyAux } from '../types'
import {
  type DeploymentElementModel,
  DeployedInstanceModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
  NestedElementOfDeployedInstanceModel,
} from './DeploymentElementModel'
import { ElementModel } from './ElementModel'
import { type AnyRelationshipModel, RelationshipModel } from './RelationModel'
import { EdgeModel } from './view/EdgeModel'
import { LikeC4ViewModel } from './view/LikeC4ViewModel'
import { NodeModel } from './view/NodeModel'

type AnyModel<A extends AnyAux> =
  | DeploymentNodeModel<A>
  | DeployedInstanceModel<A>
  | DeploymentRelationModel<A>
  | AnyRelationshipModel<A>
  | NestedElementOfDeployedInstanceModel<A>
  | ElementModel<A>
  | RelationshipModel<A>
  | LikeC4ViewModel<A>
  | NodeModel<A>
  | EdgeModel<A>

export function isDeploymentNodeModel<M extends AnyAux>(
  model: AnyModel<M>,
): model is DeploymentNodeModel<M> {
  return model instanceof DeploymentNodeModel
}

export function isDeployedInstanceModel<M extends AnyAux>(
  model: AnyModel<M>,
): model is DeployedInstanceModel<M> {
  return model instanceof DeployedInstanceModel
}

export function isDeploymentElementModel<M extends AnyAux>(model: AnyModel<M>): model is DeploymentElementModel<M> {
  return isDeploymentNodeModel(model) || isDeployedInstanceModel(model)
}

export function isNestedElementOfDeployedInstanceModel<M extends AnyAux>(
  model: AnyModel<M>,
): model is NestedElementOfDeployedInstanceModel<M> {
  return model instanceof NestedElementOfDeployedInstanceModel
}

export function isDeploymentRelationModel<M extends AnyAux>(
  x: AnyModel<M>,
): x is DeploymentRelationModel<M> {
  return x instanceof DeploymentRelationModel
}

export function isRelationModel<M extends AnyAux>(x: AnyModel<M>): x is RelationshipModel<M> {
  return x instanceof RelationshipModel
}
export {
  isRelationModel as isModelRelation,
  isRelationModel as isRelationshipModel,
}

export function isElementModel<M extends Any>(element: AnyModel<M>): element is ElementModel<M> {
  return element instanceof ElementModel
}

export function isLikeC4ViewModel<M extends Any>(view: AnyModel<M>): view is LikeC4ViewModel<M> {
  return view instanceof LikeC4ViewModel
}

export function isNodeModel<M extends Any>(node: AnyModel<M>): node is NodeModel<M> {
  return node instanceof NodeModel
}

export function isEdgeModel<M extends Any>(edge: AnyModel<M>): edge is EdgeModel<M> {
  return edge instanceof EdgeModel
}
