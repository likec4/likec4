import type { NonEmptyArray } from './_common'
import type { AnyAux } from './aux'
import type * as aux from './aux'
import type { ModelGlobals } from './global'
import type { DeploymentElement, DeploymentRelationship } from './model-deployment'
import type { Element, Relationship } from './model-logical'
import type { Specification } from './model-spec'
import type * as scalar from './scalar'
import type { ComputedView, DiagramView, LikeC4View, ProcessedView } from './view'

// type MakeEntry<Key, Value> = Key extends infer K extends string ? { [key in K]: Value } : {}

// type TupleToObject<T, Value, L = LastOfUnion<T>> =
// IsNever<T> extends false
// 	? [...UnionToTuple<Exclude<T, L>>, L]
// 	: [];

// type UnionToRecord<Keys, Value, L = LastOfUnion<Keys>> = IsNever<Keys> extends false
//   ? MakeEntry<L, Value> | UnionToRecord<Exclude<Keys, L>, Value>
//   : {}

// type Entries<KeysObject extends object, Value> = {
//   [K in keyof KeysObject]: KeysObject[K] extends infer S extends string ? {
//       [key in S]: Value
//     } :
//     never
// }[keyof KeysObject]

// // type StrictRecord<Keys, Value> = IsNever<Keys> extends true ? Record<any, Value> : Simplify<Entries<Keys, Value>>

// // type Entries<Keys, Value> = IsNever<Keys> extends false ? { [K in Keys as `${K & string}`]: Value }
// //   : { [key: string]: Value }

// type KeysOf<T> = IsStringLiteral<T> extends true ? `${T & string}` : string

// type StrictRecord<Keys, Value> = Simplify<UnionToRecord<Keys, Value>>
// type StrictRecord<Keys, Value> = Record<`${Keys & string}`, Value>
// & {
//   [key in KeysOf<Keys>]: Value
// }
// & {
//   [key: string]: Value
// }
// type StrictRecord<Keys, Value> = Simplify<UnionToIntersection<Entries<TupleToObject<UnionToTuple<Keys>>, Value>>>

/**
 * Represents a LikeC4 model with customizable type parameters,
 * parsed from DSL or result from Builder
 *
 * !IMPORTANT: This is a low-level type, use `LikeC4Model` instead.
 * !NOTE: Views are not computed yet.
 *
 * @typeParam ElementKinds - Types of elements in the model (defaults to string)
 * @typeParam RelationKinds - Types of relationships (defaults to string)
 * @typeParam Tags - Types of tags that can be applied (defaults to string)
 * @typeParam Fqns - Fully Qualified Names for elements (defaults to string)
 * @typeParam Views - Types of views in the model (defaults to string)
 * @typeParam DeploymentFqns - Fully Qualified Names for deployment nodes (defaults to string)
 */
export interface ParsedLikeC4ModelData<A extends AnyAux = AnyAux> {
  // To prevent accidental use of this type
  __?: never
  projectId: aux.ProjectId<A>
  specification: Specification<A>
  elements: Record<aux.ElementId<A>, Element<A>>
  deployments: {
    elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
    relations: Record<scalar.RelationId, DeploymentRelationship<A>>
  }
  relations: Record<scalar.RelationId, Relationship<A>>
  globals: ModelGlobals
  views: Record<aux.ViewId<A>, LikeC4View<A>>
  imports: Record<scalar.ProjectId<any>, NonEmptyArray<Element<A>>>
}

export interface LikeC4ModelData<A extends AnyAux, V = ProcessedView<A>>
  extends Omit<ParsedLikeC4ModelData<A>, 'views' | '__'>
{
  __: 'computed' | 'layouted'
  views: Record<aux.ViewId<A>, V>
}

export interface ComputedLikeC4ModelData<A extends AnyAux = AnyAux> extends LikeC4ModelData<A, ComputedView<A>> {
  __: 'computed'
}

export interface LayoutedLikeC4ModelData<A extends AnyAux = AnyAux> extends LikeC4ModelData<A, DiagramView<A>> {
  __: 'layouted'
}
