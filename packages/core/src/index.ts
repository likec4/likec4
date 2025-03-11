export {
  computeColorValues,
  defaultTheme,
  ElementColors,
  RelationshipColors,
} from './theme'

export {
  invariant,
  nonexhaustive,
  nonNullable,
} from './errors'

export {
  type AnyAux,
  type Aux,
  Connection,
  ConnectionModel,
  DeployedInstanceModel,
  DeploymentConnectionModel,
  type DeploymentElementModel,
  DeploymentNodeModel,
  DeploymentRelationModel,
  EdgeModel,
  ElementModel,
  LikeC4DeploymentModel,
  LikeC4Model,
  LikeC4ViewModel,
  NodeModel,
  RelationshipModel,
} from './model'
export * from './types'

export * from './utils'

export * as Expr from './types/expression'

export {
  computeRelationshipsView,
  computeView,
  computeViews,
  unsafeComputeView,
} from './compute-view'
export type { ComputeViewResult } from './compute-view'
