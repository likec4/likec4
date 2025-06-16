import type { IfNever, IsLiteral, IsNever } from 'type-fest'
import type { Coalesce, Link } from './_common'
import type { ModelStage } from './const'
import type * as scalar from './scalar'
/**
 * Specification types (kinds, tags, metadata keys)
 *
 * @param ElementKind - Literal union of element kinds
 * @param DeploymentKind - Literal union of deployment kinds
 * @param RelationKind - Literal union of relationship kinds
 * @param Tag - Literal union of tags
 * @param MetadataKey - Literal union of metadata keys
 */
export interface SpecAux<
  ElementKind extends string,
  DeploymentKind extends string,
  RelationKind extends string,
  Tag extends string,
  MetadataKey extends string,
> {
  ElementKind: ElementKind
  DeploymentKind: DeploymentKind
  RelationKind: RelationKind
  Tag: Tag
  MetadataKey: MetadataKey
}
export type AnySpec = SpecAux<any, any, any, any, any>

/**
 * Auxilary interface to keep inferred types
 *
 * @typeParam Stage - View stage
 * @typeParam Element - Literal union of FQNs of model elements
 * @typeParam Deployment - Literal union of FQNs of deployment elements
 * @typeParam View - Literal union of view identifiers
 * @typeParam Project - Project identifier type
 * @typeParam Spec - Specification types (kinds, tags, metadata keys)
 */
export interface Aux<
  Stage extends ModelStage,
  Element extends string,
  Deployment extends string,
  View extends string,
  Project extends string,
  Spec extends SpecAux<string, string, string, string, string>,
> {
  Stage: Stage
  ProjectId: Project
  ElementId: Element
  DeploymentId: Deployment

  ViewId: View

  ElementKind: Spec['ElementKind']
  DeploymentKind: Spec['DeploymentKind']
  RelationKind: Spec['RelationKind']
  Tag: Spec['Tag']
  MetadataKey: Spec['MetadataKey']
}

// export type AnyOnStage<Stage extends ModelStage> = Aux<Stage, any, any, any, any, SpecAux<any, any, any, any, any>>

// export type AnyParsed = AnyOnStage<'parsed'>
// export type AnyComputed = AnyOnStage<'computed'>
// export type AnyLayouted = AnyOnStage<'layouted'>

export type Any = Aux<any, any, any, any, any, SpecAux<any, any, any, any, any>>
export type { Any as AnyAux }

export type Never = Aux<never, never, never, never, never, SpecAux<never, never, never, never, never>>

/**
 * Fallback when {@link Aux} can't be inferred.
 * By default assumes non parsed model
 */
export type Unknown = Aux<
  'layouted' | 'computed',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

export type UnknownParsed = Aux<
  'parsed',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

export type UnknownComputed = Aux<
  'computed',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>
export type UnknownLayouted = Aux<
  'layouted',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

/**
 * Reads stage from Aux
 */
export type Stage<A> =
  // dprint-ignore
  A extends Aux<infer S, any, any, any, any, any>
    ? IfNever<S, never, Coalesce<S, ModelStage>>
    : never

/**
 * Picks type based on stage from Aux
 */
export type PickByStage<A extends Any, OnParsed, OnComputed, OnLayouted = OnComputed> = {
  parsed: OnParsed
  computed: OnComputed
  layouted: OnLayouted
}[A['Stage']]

export type setStage<A, S extends ModelStage> =
  // dprint-ignore
  A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
      ? Aux<S, E, D, V, P, Spec>
      : never

export type toParsed<A> = A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
  ? Aux<'parsed', E, D, V, P, Spec>
  : never

export type toComputed<A> = A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
  ? Aux<'computed', E, D, V, P, Spec>
  : never

export type toLayouted<A> = A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
  ? Aux<'layouted', E, D, V, P, Spec>
  : never

/**
 * Project identifier from Aux
 */
export type ProjectId<A> = A extends infer T extends Any ? Coalesce<T['ProjectId']> : never

/**
 * Element FQN from Aux as branded type
 */
export type Fqn<A> = A extends infer T extends Any ? scalar.Fqn<ElementId<T>> : never

/**
 * Element FQN from Aux as a literal union
 */
export type ElementId<A> = A extends infer T extends Any ? Coalesce<T['ElementId']> : never

/**
 * Deployment FQN from Aux as branded type
 */
export type DeploymentFqn<A> = A extends infer T extends Any ? scalar.DeploymentFqn<DeploymentId<T>> : never

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentFqn}
 */
export type DeploymentId<A> = A extends infer T extends Any ? Coalesce<T['DeploymentId']> : never

/**
 * View identifier from Aux as a literal union
 */
export type ViewId<A> = A extends infer T extends Any ? Coalesce<T['ViewId']> : never

export type RelationId = scalar.RelationId
export type NodeId = scalar.NodeId
export type EdgeId = scalar.EdgeId

/**
 * ElementKind from Aux as a literal union
 */
export type ElementKind<A> = A extends infer T extends Any ? Coalesce<T['ElementKind']> : never

/**
 * DeploymentKind from Aux as a literal union
 */
export type DeploymentKind<A> = A extends infer T extends Any ? Coalesce<T['DeploymentKind']> : never

/**
 * RelationKind from Aux as a literal union
 */
export type RelationKind<A> = A extends infer T extends Any ? Coalesce<T['RelationKind']> : never

/**
 * Tags from Aux as a literal union
 */
export type Tag<A> = A extends infer T extends Any ? Coalesce<T['Tag']> : never

/**
 * Array of tags from Aux
 */
export type Tags<A extends Any> = readonly Tag<A>[]

/**
 * Metadata key from Aux
 */
export type MetadataKey<A> = A extends infer T extends Any ? Coalesce<T['MetadataKey']> : never

/**
 * Metadata object from Aux
 */
export type Metadata<A extends Any> =
  // dprint-ignore
  IsNever<A['MetadataKey']> extends true
    ? never
    : IsLiteral<A['MetadataKey']> extends true
      ? {
        [key in A['MetadataKey']]?: string
      }
      : Record<string, string>

/**
 * All known kinds from Aux as a literal union.
 */
export type AllKinds<A> = ElementKind<A> | DeploymentKind<A> | RelationKind<A>

/**
 * Specification from Aux
 */
export type Spec<A> = A extends Aux<any, any, any, any, any, infer S> ? S : never

export type StrictProjectId<A> = A extends infer T extends Any ? scalar.ProjectId<ProjectId<T>> : never

export type {
  DeploymentFqn as StrictDeploymentFqn,
  Fqn as StrictFqn,
}

export type StrictViewId<A> = A extends infer T extends Any ? scalar.ViewId<ViewId<T>> : never

export type StrictTag<A> = A extends infer T extends Any ? scalar.Tag<Tag<T>> : never

// dprint-ignore
export type StrictElementKind<A> = A extends infer T extends Any ? scalar.ElementKind<ElementKind<T>> : never
export type StrictDeploymentKind<A> = A extends infer T extends Any ? scalar.DeploymentKind<DeploymentKind<T>>
  : never
export type StrictRelationKind<A> = A extends infer T extends Any ? scalar.RelationshipKind<RelationKind<T>> : never

export type WithTags<A extends Any> = {
  readonly tags: Tags<A>
}

export type WithOptionalTags<A extends Any> = {
  readonly tags?: Tags<A> | null
}

export type WithLinks = {
  readonly links: readonly Link[]
}

export type WithOptionalLinks = {
  readonly links?: readonly Link[] | null
}

export type WithMetadata<A extends Any> = {
  readonly metadata?: Metadata<A>
}

/**
 * @see {@link LiteralUnion} from type-fest (https://github.com/sindresorhus/type-fest/blob/main/source/literal-union.d.ts)
 */
export type OrString = string & Record<never, never>

export type LooseElementId<A extends Any> = Coalesce<A['ElementId']> | OrString
export type LooseDeploymentId<A extends Any> = Coalesce<A['DeploymentId']> | OrString
export type LooseViewId<A extends Any> = Coalesce<A['ViewId']> | OrString
export type LooseTag<A extends Any> = Coalesce<A['Tag']> | OrString
export type LooseTags<A extends Any> = readonly (Coalesce<A['Tag']> | OrString)[]

export type LooseElementKind<A extends Any> = Coalesce<A['ElementKind']> | OrString
export type LooseDeploymentKind<A extends Any> = Coalesce<A['DeploymentKind']> | OrString
export type LooseRelationKind<A extends Any> = Coalesce<A['RelationKind']> | OrString
