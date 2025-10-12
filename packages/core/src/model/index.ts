export { ElementModel } from './ElementModel'
export { LikeC4Model } from './LikeC4Model'
export type { AnyLikeC4Model } from './LikeC4Model'
export { RelationshipModel } from './RelationModel'
export type { AnyRelationshipModel } from './RelationModel'

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
  DeploymentNodeModel,
  DeploymentRelationModel,
  RelationshipsAccum,
} from './DeploymentElementModel'
export type {
  DeploymentElementModel,
  DeploymentRelationEndpoint,
} from './DeploymentElementModel'
export { LikeC4DeploymentModel } from './DeploymentModel'

export { EdgeModel } from './view/EdgeModel'
export { LikeC4ViewModel } from './view/LikeC4ViewModel'
export { LikeC4ViewsFolder } from './view/LikeC4ViewsFolder'
export { NodeModel } from './view/NodeModel'

export type {
  DeploymentOrFqn,
  EdgeOrId,
  ElementOrFqn,
  IncomingFilter,
  NodeOrId,
  OutgoingFilter,
  WithMetadata,
  WithTags,
} from './types'

export * from './guards'

export {
  applyManualLayout,
  extractViewTitleFromPath,
  getViewFolderPath,
  normalizeViewPath,
  VIEW_FOLDERS_SEPARATOR,
} from './utils'
