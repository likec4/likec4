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
  isNestedConnection,
  mergeConnections,
  sortConnectionsByBoundaryHierarchy,
  sortDeepestFirst,
} from './ops'
