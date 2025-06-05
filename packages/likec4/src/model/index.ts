import { LikeC4Model } from '@likec4/core/model'
import type { Aux, LayoutedLikeC4ModelData, SpecAux } from '@likec4/core/types'

export type UnknownLayouted = Aux<
  'layouted',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

/**
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: any): LikeC4Model<UnknownLayouted> {
  return LikeC4Model.create(model as LayoutedLikeC4ModelData<UnknownLayouted>)
}

export {
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
} from '@likec4/core/model'

export type * from '@likec4/core/types'
