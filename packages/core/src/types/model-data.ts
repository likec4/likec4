import type { IsAny } from 'type-fest'
import type * as aux from './_aux'
import type { Any } from './_aux'
import type { NonEmptyArray } from './_common'
import type { _stage } from './const'
import type { ModelGlobals } from './global'
import type { DeploymentElement, DeploymentRelationship } from './model-deployment'
import type { Element, Relationship } from './model-logical'
import type { Specification } from './model-spec'
import type * as scalar from './scalar'
import type { ComputedView, LayoutedView, ParsedView } from './view'

interface BaseLikeC4ModelData<A extends aux.Any> {
  projectId: aux.ProjectId<A>
  project: aux.Project<A>
  specification: Specification<A>
  elements: Record<aux.ElementId<A>, Element<A>>
  deployments: {
    elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
    relations: Record<scalar.RelationId, DeploymentRelationship<A>>
  }
  relations: Record<scalar.RelationId, Relationship<A>>
  globals: ModelGlobals
  imports: Record<string, NonEmptyArray<Element<A>>>
}

export type AuxFromLikeC4ModelData<D> =
  // dprint-ignore
  D extends BaseLikeC4ModelData<infer A extends Any>
    ? IsAny<A> extends true
      ? never
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
export interface ParsedLikeC4ModelData<A extends Any = aux.UnknownParsed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'parsed'
  // globals: ModelGlobals<A
  views: Record<aux.ViewId<A>, ParsedView<A>>
}

export interface ComputedLikeC4ModelData<A extends Any = aux.UnknownComputed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'computed'
  // specification: Specification<A>
  // globals: ModelGlobals<A>
  views: Record<aux.ViewId<A>, ComputedView<A>>
}

export interface LayoutedLikeC4ModelData<A extends Any = aux.UnknownLayouted> extends BaseLikeC4ModelData<A> {
  [_stage]: 'layouted'
  // globals: ModelGlobals<A>
  views: Record<aux.ViewId<A>, LayoutedView<A>>
}

export type LikeC4ModelData<A extends Any> =
  | ParsedLikeC4ModelData<A>
  | ComputedLikeC4ModelData<A>
  | LayoutedLikeC4ModelData<A>
// ExclusiveUnion<{
//   Parsed: ParsedLikeC4ModelData<A>
//   Computed: ComputedLikeC4ModelData<A>
//   Layouted: LayoutedLikeC4ModelData<A>
// }>
