import { LikeC4Model } from '@likec4/core/model'

/**
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: any): LikeC4Model.Layouted {
  return LikeC4Model.create(model) as LikeC4Model.Layouted
}

export {
  type AnyAux,
  type Aux,
  Connection,
  ConnectionModel,
  DeployedInstanceModel,
  deploymentConnection,
  DeploymentConnectionModel,
  type DeploymentElementModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
  differenceConnections,
  EdgeModel,
  ElementModel,
  findAscendingConnections,
  findDeepestNestedConnection,
  findDescendantConnections,
  hasSameSource,
  hasSameSourceTarget,
  hasSameTarget,
  isAnyInOut,
  isDeployedInstance,
  isDeploymentNode,
  isIncoming,
  isNestedConnection,
  isOutgoing,
  LikeC4DeploymentModel,
  LikeC4Model,
  LikeC4ViewModel,
  mergeConnections,
  modelConnection,
  NodeModel,
  RelationshipModel,
  sortConnectionsByBoundaryHierarchy,
  sortDeepestFirst,
  type Unknown,
} from '@likec4/core/model'

export * from '@likec4/core/types'
