export { ElementModel } from './ElementModel'
export { LikeC4Model } from './LikeC4Model'
export { RelationshipModel } from './RelationModel'

export {
  Connection,
  ConnectionModel,
  deployment as deploymentConnection,
  DeploymentConnectionModel,
  differenceConnections,
  findAscendingConnections,
  findDeepestNestedConnection,
  findDescendantConnections,
  hasSameSource,
  hasSameSourceTarget,
  hasSameTarget,
  isAnyInOut,
  isIncoming,
  isNestedConnection,
  isOutgoing,
  mergeConnections,
  model as modelConnection,
  sortConnectionsByBoundaryHierarchy,
  sortDeepestFirst,
} from './connection'

export {
  DeployedInstanceModel,
  type DeploymentElementModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
} from './DeploymentElementModel'
export { LikeC4DeploymentModel } from './DeploymentModel'

export { EdgeModel } from './view/EdgeModel'
export { LikeC4ViewModel } from './view/LikeC4ViewModel'
export { NodeModel } from './view/NodeModel'

export type {
  AnyAux,
  Aux,
} from './types'

export {
  isDeployedInstance,
  isDeploymentNode,
} from './guards'
