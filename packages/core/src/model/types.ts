import { isString } from 'remeda'
import type { AnyAux, Aux, AuxFromDump, ComputedView, DiagramView, LikeC4ModelDump, ProcessedView } from '../types'
import type { LikeC4Model } from './LikeC4Model'

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: string | { id: Id }): Id {
  return isString(element) ? element as Id : element.id
}

export type ElementOrFqn<A extends AnyAux> = Aux.Fqn<A> | {
  id: Aux.Strict.Fqn<A>
}

export type DeploymentOrFqn<A extends AnyAux> = Aux.DeploymentFqn<A> | {
  id: Aux.Strict.DeploymentFqn<A>
}

export type NodeOrId<A extends AnyAux> = Aux.NodeId<A> | {
  id: Aux.Strict.NodeId<A>
}

export type EdgeOrId<A extends AnyAux> = Aux.EdgeId<A> | {
  id: Aux.Strict.EdgeId<A>
}

type LikeC4ModelWithViewType<D extends LikeC4ModelDump, A extends AnyAux> = D['__'] extends 'computed'
  ? LikeC4Model<A, ComputedView<A>>
  : D['__'] extends 'layouted' ? LikeC4Model<A, DiagramView<A>>
  : LikeC4Model<A, ProcessedView<A>>

export type LikeC4ModelFromDump<D> = D extends LikeC4ModelDump ? LikeC4ModelWithViewType<D, AuxFromDump<D>>
  : never
