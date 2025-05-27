import { isString } from 'remeda'
import type { AnyAux, Aux } from '../types2'

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: string | { id: Id }): Id {
  return isString(element) ? element as Id : element.id
}

export {
  type AnyAux,
  type Aux,
} from '../types2'

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
