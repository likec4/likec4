import { LikeC4Model } from '@likec4/core/model'
import type * as types from '@likec4/core/types'

export type UnknownLayouted = types.UnknownLayouted

/**
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: any): LikeC4Model<UnknownLayouted> {
  return LikeC4Model.create(model as types.LayoutedLikeC4ModelData<UnknownLayouted>)
}

export {
  Connection,
  ConnectionModel,
  DeployedInstanceModel,
  deploymentConnection,
  DeploymentConnectionModel,
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
  isDeployedInstanceModel,
  isDeploymentElementModel,
  isDeploymentNodeModel,
  isDeploymentRelationModel,
  isEdgeModel,
  isElementModel,
  isIncoming,
  isLikeC4ViewModel,
  isNestedConnection,
  isNestedElementOfDeployedInstanceModel,
  isNodeModel,
  isOutgoing,
  isRelationModel,
  LikeC4DeploymentModel,
  LikeC4Model,
  LikeC4ViewModel,
  mergeConnections,
  modelConnection,
  NodeModel,
  RelationshipModel,
  sortConnectionsByBoundaryHierarchy,
  sortDeepestFirst,
} from '@likec4/core/model'

export type {
  DeploymentElementModel,
  DeploymentRelationEndpoint,
} from '@likec4/core/model'

export type * from '@likec4/core/types'

export {
  calcSequenceLayout,
  type SequenceViewLayout,
} from '@likec4/layouts/sequence'
