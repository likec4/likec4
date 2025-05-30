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
  ? LikeC4Model<$Computed<A>>
  : D['__'] extends 'layouted' ? LikeC4Model<$Diagram<A>>
  : LikeC4Model<A>

export type LikeC4ModelFromDump<D> = D extends LikeC4ModelDump ? LikeC4ModelWithViewType<D, AuxFromDump<D>>
  : never

/**
 * Model type with all aux types and view type
 */
export interface $M<A extends AnyAux, V extends ProcessedView<any>> extends
  Aux<
    A['ProjectId'],
    A['ElementId'],
    A['DeploymentId'],
    A['ViewId'],
    A['Spec']
  >
{
  ViewType: V
}

export type $Computed<A> =
  // dprint-ignore
  A extends $M<infer T, any>
    ? $M<T, ComputedView<T>>
    : A extends AnyAux
      ? $M<A, ComputedView<A>>
      : never

export type $Diagram<A> =
  // dprint-ignore
  A extends $M<infer T, any>
    ? $M<T, DiagramView<T>>
    : A extends AnyAux
      ? $M<A, DiagramView<A>>
      : never

export type $RefineComputed<A, V extends 'element' | 'deployment' | 'dynamic'> =
  // dprint-ignore
  A extends $M<infer T, any>
    ? $M<T, Extract<ComputedView<T>, { __: V }>>
    : A extends AnyAux
      ? $M<A, Extract<ComputedView<A>, { __: V }>>
      : never

export type $UnwrapM<A> =
  // dprint-ignore
  A extends $M<infer T, any>
    ? T
    : A extends AnyAux
      ? A
      : never

export type $View<A> =
  // dprint-ignore
  A extends $M<any, infer V>
    ? V
    : A extends AnyAux
      ? ProcessedView<A>
      : never
