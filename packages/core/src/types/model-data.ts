import type { IsAny } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import type { _stage, ExtractOnStage, ModelStage } from './const'
import type { ModelGlobals } from './global'
import type { DeploymentElement, DeploymentRelationship } from './model-deployment'
import type { Element, Relationship } from './model-logical'
import type { Specification } from './model-spec'
import type * as scalar from './scalar'
import type { AnyView } from './view'

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

interface BaseLikeC4ModelData<A extends AnyAux, Stage extends ModelStage> {
  [_stage]: Stage
  projectId: aux.ProjectId<A>
  specification: Specification<A>
  elements: Record<aux.ElementId<A>, Element<A>>
  deployments: {
    elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
    relations: Record<scalar.RelationId, DeploymentRelationship<A>>
  }
  relations: Record<scalar.RelationId, Relationship<A>>
  globals: ModelGlobals
  imports: Record<scalar.ProjectId<any>, NonEmptyArray<Element<A>>>
  views: Record<aux.ViewId<A>, ExtractOnStage<AnyView<A>, Stage>>
}

export type AuxFromLikeC4ModelData<D> =
  // dprint-ignore
  D extends BaseLikeC4ModelData<infer A extends AnyAux, any>
    ? IsAny<A> extends true
      ? Unknown
      : A
    : never

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
export interface ParsedLikeC4ModelData<A extends AnyAux = Unknown> extends BaseLikeC4ModelData<A, 'parsed'> {
}

// export interface LikeC4ModelData<A extends AnyAux, V = ProcessedView<A>> {
//   __: 'computed' | 'layouted'
//   views: Record<aux.ViewId<A>, V>
// }

export interface ComputedLikeC4ModelData<A extends AnyAux = Unknown> extends BaseLikeC4ModelData<A, 'computed'> {
}

export interface LayoutedLikeC4ModelData<A extends AnyAux = Unknown> extends BaseLikeC4ModelData<A, 'layouted'> {
}

export type LikeC4ModelData<A extends AnyAux> =
  | ParsedLikeC4ModelData<A>
  | ComputedLikeC4ModelData<A>
  | LayoutedLikeC4ModelData<A>
