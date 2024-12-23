export { Connection } from './Connection'
export { DeploymentConnectionModel } from './deployment/DeploymentConnectionModel'
export { ConnectionModel } from './model/ConnectionModel'
export {
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
  sortConnectionsByBoundaryHierarchy,
  sortDeepestFirst,
} from './ops'

export * as deployment from './deployment/find'
export * as model from './model/find'
