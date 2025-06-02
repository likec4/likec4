import { isString } from 'remeda'
import type {
  scalar,
} from '../types'

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: string | { id: Id }): Id {
  return isString(element) ? element as Id : element.id
}

export type ElementOrFqn<A> = A | { id: scalar.Fqn<A> }

export type DeploymentOrFqn<A> = A | { id: scalar.DeploymentFqn<A> }

export type NodeOrId = string | { id: scalar.NodeId }

export type EdgeOrId = string | { id: scalar.EdgeId }

// type LikeC4ModelWithViewType<D extends LikeC4ModelDump, A extends AnyAux> = D['__'] extends 'computed'
//   ? LikeC4Model<$Computed<A>>
//   : D['__'] extends 'layouted' ? LikeC4Model<$Diagram<A>>
//   : LikeC4Model<A>

// export type LikeC4ModelFromDump<D> = D extends LikeC4ModelDump ? LikeC4ModelWithViewType<D, AuxFromDump<D>>
//   : never

// /**
//  * Model type with all aux types and view type
//  */
// export interface $M<A extends AnyAux, V> extends
//   Aux<
//     A['ProjectId'],
//     A['ElementId'],
//     A['DeploymentId'],
//     A['ViewId'],
//     A['Spec']
//   >
// {
//   ViewType: V
// }

// export type $Computed<A> =
//   // dprint-ignore
//   A extends $M<infer T, any>
//     ? $Computed<T>
//     : A extends AnyAux
//       ? $M<A, ComputedView<A>>
//       : never

// export type $Diagram<A> =
//   // dprint-ignore
//   A extends $M<infer T, any>
//     ? $Diagram<T>
//     : A extends AnyAux
//       ? $M<A, DiagramView<A>>
//       : never

// export type $RefineComputed<A, V extends 'element' | 'deployment' | 'dynamic'> =
//   // dprint-ignore
//   A extends $M<infer T, any>
//     ? $M<T, Extract<ComputedView<T>, { __: V }>>
//     : A extends AnyAux
//       ? $M<A, Extract<ComputedView<A>, { __: V }>>
//       : never

// export type $UnwrapM<A extends AnyAux> =
//   // dprint-ignore
//   A extends $M<infer T, any>
//     ? $UnwrapM<T>
//     : A

// export type $View<A extends AnyAux> =
//   // dprint-ignore
//   A extends $M<infer T, infer V>
//     ? V extends ProcessedView<T>
//       ? V
//       : ProcessedView<T>
//     : ProcessedView<A>

// export type auxview<A> =
// // dprint-ignore
//   A extends AnyAux
//     ? Extract<AnyLikeC4View
//     : never

//   // dprint-ignore
//   A extends $M<infer T, infer V>
//     ? V extends ProcessedView<T>
//       ? V
//       : ProcessedView<T>
//     : ProcessedView<A>
