export { ElementModel } from './ElementModel'
export { type AnyLikeC4Model, LikeC4Model } from './LikeC4Model'
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
  type DeploymentRelationEndpoint,
  DeploymentRelationModel,
  RelationshipsAccum,
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

export type {
  Any,
  AnyAux,
  Aux,
  aux,
  AuxFromDump,
  AuxFromLikeC4ModelData,
  SpecAux,
} from '../types'

export { RichText, type RichTextEmpty, type RichTextOrEmpty } from '../types'
