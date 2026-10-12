import type { IfNever, IsLiteral, IsNever } from 'type-fest'
import type { Coalesce, Link, OrString } from './_common'
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
export type SpecAux<
  ElementKind extends string,
  DeploymentKind extends string,
  RelationKind extends string,
  Tag extends string,
  MetadataKey extends string,
> = {
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
export type Aux<
  Stage extends ModelStage,
  Element extends string,
  Deployment extends string,
  View extends string,
  Project extends string,
  Spec extends AnySpec,
> = {
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

export type AuxComputed<
  Element extends string,
  Deployment extends string,
  View extends string,
  Project extends string,
  Spec extends AnySpec,
> = Aux<
  'computed',
  Element,
  Deployment,
  View,
  Project,
  Spec
>
export type AuxLayouted<
  Element extends string,
  Deployment extends string,
  View extends string,
  Project extends string,
  Spec extends AnySpec,
> = Aux<
  'layouted',
  Element,
  Deployment,
  View,
  Project,
  Spec
>

export type AnyOnStage<Stage extends ModelStage> = Aux<Stage, any, any, any, any, AnySpec>

export type AnyParsed = AnyOnStage<'parsed'>
export type AnyComputed = AnyOnStage<'computed'>
export type AnyLayouted = AnyOnStage<'layouted'>

export type Any = Aux<any, any, any, any, any, AnySpec>
export type { Any as AnyAux }

export type Never = Aux<never, never, never, never, never, SpecAux<never, never, never, never, never>>

/**
 * Fallback when {@link Aux} can't be inferred.
 * By default assumes non parsed model
 */
export type Unknown = UnknownComputed | UnknownLayouted

export type UnknownParsed = Aux<
  'parsed',
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

export type UnknownComputed = AuxComputed<
  string,
  string,
  string,
  string,
  SpecAux<string, string, string, string, string>
>

export type UnknownLayouted = AuxLayouted<
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
export type ProjectId<A> = A extends { ProjectId: infer P extends string } ? Coalesce<P> : never

export type setProject<A, P extends string> =
  // dprint-ignore
  A extends Aux<infer S, infer E, infer D, infer V, any, infer Spec>
      ? Aux<S, E, D, V, P, Spec>
      : never

/**
 * Element FQN from Aux as branded type
 */
export type Fqn<A> = A extends Pick<Any, 'ElementId'> ? scalar.Fqn<Coalesce<A['ElementId']>> : never

/**
 * Element FQN from Aux as a literal union
 */
export type ElementId<A> = A extends Pick<Any, 'ElementId'> ? Coalesce<A['ElementId']> : never

/**
 * Deployment FQN from Aux as branded type
 */
export type DeploymentFqn<A> = A extends Pick<Any, 'DeploymentId'> ? scalar.DeploymentFqn<Coalesce<A['DeploymentId']>>
  : never

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentFqn}
 */
export type DeploymentId<A> = A extends Pick<Any, 'DeploymentId'> ? Coalesce<A['DeploymentId']> : never

/**
 * View identifier from Aux as a literal union
 */
export type ViewId<A> = A extends Pick<Any, 'ViewId'> ? Coalesce<A['ViewId']> : never

export type RelationId = scalar.RelationId
export type NodeId = scalar.NodeId
export type EdgeId = scalar.EdgeId

/**
 * ElementKind from Aux as a literal union
 */
export type ElementKind<A> = A extends Pick<Any, 'ElementKind'> ? Coalesce<A['ElementKind']> : never

/**
 * DeploymentKind from Aux as a literal union
 */
export type DeploymentKind<A> = A extends Pick<Any, 'DeploymentKind'> ? Coalesce<A['DeploymentKind']> : never

/**
 * RelationKind from Aux as a literal union
 */
export type RelationKind<A> = A extends Pick<Any, 'RelationKind'> ? Coalesce<A['RelationKind']> : never

/**
 * Tags from Aux as a literal union
 */
export type Tag<A> = A extends Pick<Any, 'Tag'> ? Coalesce<A['Tag']> : never

/**
 * Array of tags from Aux
 */
export type Tags<A> = readonly Tag<A>[]

/**
 * Metadata key from Aux
 */
export type MetadataKey<A> = A extends Pick<Any, 'MetadataKey'> ? Coalesce<A['MetadataKey']> : never

/**
 * Metadata object from Aux
 */
export type Metadata<A extends Any> =
  // dprint-ignore
  IsNever<A['MetadataKey']> extends true
    ? never
    : IsLiteral<A['MetadataKey']> extends true
      ? {
        [key in A['MetadataKey']]?: string | string[]
      }
      : Record<string, string | string[]>

/**
 * All known kinds from Aux as a literal union.
 */
export type AllKinds<A> = ElementKind<A> | DeploymentKind<A> | RelationKind<A>

/**
 * Specification from Aux
 */
export type Spec<A> = A extends Aux<any, any, any, any, any, infer S extends AnySpec> ? S
  : never

export type StrictProjectId<A> = A extends Pick<Any, 'ProjectId'> ? scalar.ProjectId<Coalesce<A['ProjectId']>>
  : never

export type {
  DeploymentFqn as StrictDeploymentFqn,
  Fqn as StrictFqn,
}

export type StrictViewId<A> = A extends Pick<Any, 'ViewId'> ? scalar.ViewId<Coalesce<A['ViewId']>> : never

export type StrictTag<A> = A extends Pick<Any, 'Tag'>
  // dprint-ignore
  ? scalar.Tag<Coalesce<A['Tag']>>
  : never

// dprint-ignore
export type StrictElementKind<A> = A extends Pick<Any, 'ElementKind'> ? scalar.ElementKind<Coalesce<A['ElementKind']>> : never
export type StrictDeploymentKind<A> = A extends Pick<Any, 'DeploymentKind'>
  ? scalar.DeploymentKind<Coalesce<A['DeploymentKind']>>
  : never
export type StrictRelationKind<A> = A extends Pick<Any, 'RelationKind'>
  ? scalar.RelationshipKind<Coalesce<A['RelationKind']>>
  : never

export type WithDescriptionAndTech = {
  // short summary (displayed in the diagram)
  readonly summary?: scalar.MarkdownOrString | null
  // long description (displayed in the details panel, or in the diagram if summary is not set)
  readonly description?: scalar.MarkdownOrString | null
  readonly technology?: string | null
}

/**
 * Returns summary if it is not null, otherwise returns description
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferSummary(a: WithDescriptionAndTech): scalar.MarkdownOrString | null | undefined {
  return a.summary ?? a.description
}

/**
 * Returns description if it is not null, otherwise returns summary
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferDescription(a: WithDescriptionAndTech): scalar.MarkdownOrString | null | undefined {
  return a.description ?? a.summary
}

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

export type WithNotation = {
  readonly notation?: string | null
}

/**
 * Allows any string value, but still auto-completes to the possible values in IDE
 */
export type LooseLiteral<V extends string> = Coalesce<V> | OrString

export type LooseElementId<A> = A extends Pick<Any, 'ElementId'> ? LooseLiteral<A['ElementId']> : string
export type LooseDeploymentId<A> = A extends Pick<Any, 'DeploymentId'> ? LooseLiteral<A['DeploymentId']> : string
export type LooseViewId<A> = A extends Pick<Any, 'ViewId'> ? LooseLiteral<A['ViewId']> : string
export type LooseTag<A> = A extends Pick<Any, 'Tag'> ? LooseLiteral<A['Tag']> : string
export type LooseTags<A> = A extends Pick<Any, 'Tag'> ? readonly (LooseLiteral<A['Tag']>)[] : string[]

export type LooseElementKind<A> = A extends Pick<Any, 'ElementKind'> ? LooseLiteral<A['ElementKind']> : string
export type LooseDeploymentKind<A> = A extends Pick<Any, 'DeploymentKind'> ? LooseLiteral<A['DeploymentKind']> : string
export type LooseRelationKind<A> = A extends Pick<Any, 'RelationKind'> ? LooseLiteral<A['RelationKind']> : string
