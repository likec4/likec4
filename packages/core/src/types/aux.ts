import type { IfAny, IsAny } from 'type-fest'
import type { Link } from './_common'
import type * as scalar from './scalar'
import type { ViewStage } from './view-common'
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
  Stage extends ViewStage,
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
  Spec: Spec

  ElementKind: Spec['ElementKind']
  DeploymentKind: Spec['DeploymentKind']
  RelationKind: Spec['RelationKind']
  Tag: Spec['Tag']
  MetadataKey: Spec['MetadataKey']
}

export type Any = Aux<any, any, any, any, any, AnySpec>
export type AnyAux = Aux<any, any, any, any, any, AnySpec>

export type Never = Aux<never, never, never, never, never, SpecAux<never, never, never, never, never>>

/**
 * Fallback when {@link Aux} can't be inferred
 * By default assumes layouted view
 */
export type Unknown = Aux<'layouted', string, string, string, string, SpecAux<string, string, string, string, string>>

// export type Stage<A> = A extends Aux<infer S extends ViewStage, any, any, any, any, any> ? S : never
export type Stage<A> =
  // dprint-ignore
  A extends AnyAux
    ? IfAny<A['Stage'], ViewStage, A['Stage']>
    : never

export type setStage<A, S extends ViewStage> =
  // dprint-ignore
  A extends AnyAux
    ? Aux<S, A['ElementId'], A['DeploymentId'], A['ViewId'], A['ProjectId'], A['Spec']>
    : never

export type read<A, F extends keyof AnyAux, OnAny = string> =
  // dprint-ignore
  A extends AnyAux
    ? (IsAny<A[F]> extends false ? A[F] : OnAny)
    : never

export type ValueOrString<T> = IsAny<T> extends false ? T : string

/**
 * Project identifier from Aux
 */
export type ProjectId<A> = A extends AnyAux ? ValueOrString<A['ProjectId']> : never
/**
 * Element FQN from Aux as a literal union
 * @alias {@link ElementId}
 */
export type Fqn<A> = A extends AnyAux ? ValueOrString<A['ElementId']> : never

/**
 * Element FQN from Aux as a literal union
 * @alias {@link Fqn}
 */
export type ElementId<A> = Fqn<A>

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentId}
 */
export type DeploymentFqn<A> = A extends AnyAux ? ValueOrString<A['DeploymentId']> : never

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentFqn}
 */
export type DeploymentId<A> = DeploymentFqn<A>

/**
 * View identifier from Aux as a literal union
 */
export type ViewId<A> = A extends AnyAux ? ValueOrString<A['ViewId']> : never

/**
 * Relation identifier from Aux as a literal union
 */
export type RelationId = scalar.RelationId

/**
 * Node identifier from Aux as a literal union
 */
export type NodeId = scalar.NodeId

/**
 * Edge identifier from Aux as a literal union
 */
export type EdgeId = scalar.EdgeId

/**
 * ElementKind from Aux as a literal union
 */
export type ElementKind<A> = A extends AnyAux ? ValueOrString<A['ElementKind']> : never

/**
 * DeploymentKind from Aux as a literal union
 */
export type DeploymentKind<A> = A extends AnyAux ? ValueOrString<A['DeploymentKind']> : never

/**
 * RelationKind from Aux as a literal union
 */
export type RelationKind<A> = A extends AnyAux ? ValueOrString<A['RelationKind']> : never

/**
 * Tag from Aux as a literal union
 */
export type Tag<A> = read<A, 'Tag'>

/**
 * Array of tags from Aux
 */
export type Tags<A> = readonly Tag<A>[]

/**
 * Metadata key from Aux
 */
export type MetadataKey<A> = A extends AnyAux ? ValueOrString<A['MetadataKey']> : never

/**
 * Metadata object from Aux
 */
export type Metadata<A> =
  // dprint-ignore
  A extends AnyAux
    ? {
        [key in ValueOrString<A['MetadataKey']>]?: string
    }
    : never

/**
 * Specification from Aux
 */
export type Spec<A> = A extends AnyAux ? A['Spec'] : never

export type setSpec<A, S extends AnySpec> =
  // dprint-ignore
  A extends AnyAux
    ? Aux<A['Stage'], A['ElementId'], A['DeploymentId'], A['ViewId'], A['ProjectId'], S>
    : never

export type StrictProjectId<A> = ProjectId<A> extends infer P extends string ? scalar.ProjectId<P> : never

export type StrictFqn<A> = Fqn<A> extends infer F extends string ? scalar.Fqn<F> : never
export type { StrictFqn as StrictElementId }

export type StrictDeploymentFqn<A> = DeploymentFqn<A> extends infer F extends string ? scalar.DeploymentFqn<F> : never
export type { StrictDeploymentFqn as StrictDeploymentId }

export type StrictViewId<A> = ViewId<A> extends infer V extends string ? scalar.ViewId<V> : never

export type StrictTag<A> = Tag<A> extends infer T extends string ? scalar.Tag<T> : never

// dprint-ignore
export type StrictElementKind<A> = ElementKind<A> extends infer E extends string ? scalar.ElementKind<E> : never
export type StrictDeploymentKind<A> = DeploymentKind<A> extends infer D extends string ? scalar.DeploymentKind<D>
  : never
export type StrictRelationKind<A> = RelationKind<A> extends infer R extends string ? scalar.RelationshipKind<R> : never

type StringPrimitive = string & Record<never, never>

/**
 * Suggests values of type `V` in IDE
 */
export type complete<V> = V | StringPrimitive

export type LiteralElementId<A> = ElementId<A> | StringPrimitive
export type LiteralFqn<A> = Fqn<A> | StringPrimitive
export type LiteralDeploymentId<A> = DeploymentId<A> | StringPrimitive
export type LiteralDeploymentFqn<A> = DeploymentFqn<A> | StringPrimitive
export type LiteralViewId<A> = ViewId<A> | StringPrimitive
export type LiteralTag<A> = Tag<A> | StringPrimitive

export type LiteralElementKind<A> = ElementKind<A> | StringPrimitive
export type LiteralDeploymentKind<A> = DeploymentKind<A> | StringPrimitive
export type LiteralRelationKind<A> = RelationKind<A> | StringPrimitive

export type WithTags<A> = {
  readonly tags: Tags<A>
}

export type WithOptionalTags<A> = {
  readonly tags?: Tags<A> | null
}

export type WithLinks = {
  readonly links: readonly Link[]
}

export type WithOptionalLinks = {
  readonly links?: readonly Link[] | null
}

export type WithMetadata<A> = {
  readonly metadata?: Metadata<A>
}
