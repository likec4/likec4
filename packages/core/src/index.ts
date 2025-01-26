import DefaultMap from 'mnemonist/default-map'
import LinkedList from 'mnemonist/linked-list'
import Queue from 'mnemonist/queue'
import Stack from 'mnemonist/stack'

export { DefaultMap, LinkedList, Queue, Stack }

export {
  computeColorValues,
  defaultTheme,
  ElementColors,
  RelationshipColors,
} from './colors'

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

export { default as dagre } from '@dagrejs/dagre'
