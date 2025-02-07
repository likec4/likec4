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
  LikeC4DeploymentModel,
  LikeC4Model,
  LikeC4ViewModel,
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
