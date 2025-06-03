import type { IsAny, IsNever } from 'type-fest'
import type { Link } from './_common'
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

type Coalesce<V extends string, OrIfAny = string> = IsAny<V> extends true ? OrIfAny : V

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

  Spec: Spec
  ElementKind: Spec['ElementKind']
  DeploymentKind: Spec['DeploymentKind']
  RelationKind: Spec['RelationKind']
  Tag: Spec['Tag']
  MetadataKey: Spec['MetadataKey']
}

export type AnyOnStage<Stage extends ModelStage> = Aux<Stage, any, any, any, any, SpecAux<any, any, any, any, any>>

export type AnyParsed = AnyOnStage<'parsed'>
export type AnyProcessed = AnyOnStage<'computed'> | AnyOnStage<'layouted'>
export type AnyComputed = AnyOnStage<'computed'>
export type AnyLayouted = AnyOnStage<'layouted'>

export type AnyAux = Aux<any, any, any, any, any, SpecAux<any, any, any, any, any>>
export type { AnyAux as Any }

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

/**
 * Reads stage from Aux
 */
export type Stage<A> = A extends infer T extends AnyAux ? Coalesce<T['Stage'], ModelStage> : never

/**
 * Picks type based on stage from Aux
 */
export type PickByStage<A extends AnyAux, OnParsed, OnComputed, OnLayouted = OnComputed> = {
  parsed: OnParsed
  computed: OnComputed
  layouted: OnLayouted
}[A['Stage']]

export type setStage<A, S extends ModelStage> =
  // dprint-ignore
  A extends Aux<any, infer E, infer D, infer V, infer P, infer Spec>
      ? Aux<S, E, D, V, P, Spec>
      : A

export type narrowStage<A, S extends ModelStage> =
  // dprint-ignore
  A extends Aux<S, infer E, infer D, infer V, infer P, infer Spec>
      ? Aux<S, E, D, V, P, Spec>
      : A

export type toComputed<A> = A extends infer T extends AnyAux ? setStage<T, 'computed'> : never
export type asComputed<A> = A extends infer T extends AnyAux ? narrowStage<T, 'computed'> : never

export type toLayouted<A> = A extends infer T extends AnyAux ? setStage<T, 'layouted'> : never
export type asLayouted<A> = A extends infer T extends AnyAux ? narrowStage<T, 'layouted'> : never

/**
 * Project identifier from Aux
 */
export type ProjectId<A> = A extends infer T extends AnyAux ? Coalesce<T['ProjectId']> : never
/**
 * Element FQN from Aux as branded type
 * @alias {@link ElementId}
 */
export type Fqn<A> = A extends infer T extends AnyAux ? scalar.Fqn<ElementId<T>> : never

/**
 * Element FQN from Aux as a literal union
 * @alias {@link Fqn}
 */
export type ElementId<A> = A extends infer T extends AnyAux ? Coalesce<T['ElementId']> : never

/**
 * Deployment FQN from Aux as branded type
 * @alias {@link DeploymentId}
 */
export type DeploymentFqn<A> = A extends infer T extends AnyAux ? scalar.DeploymentFqn<DeploymentId<T>> : never

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentFqn}
 */
export type DeploymentId<A> = A extends infer T extends AnyAux ? Coalesce<T['DeploymentId']> : never

/**
 * View identifier from Aux as a literal union
 */
export type ViewId<A> = A extends infer T extends AnyAux ? Coalesce<T['ViewId']> : never

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
export type ElementKind<A> = A extends infer T extends AnyAux ? Coalesce<T['ElementKind']> : never

/**
 * DeploymentKind from Aux as a literal union
 */
export type DeploymentKind<A> = A extends infer T extends AnyAux ? Coalesce<T['DeploymentKind']> : never

/**
 * RelationKind from Aux as a literal union
 */
export type RelationKind<A> = A extends infer T extends AnyAux ? Coalesce<T['RelationKind']> : never

/**
 * Tag from Aux as a literal union
 */
export type Tag<A> = A extends infer T extends AnyAux ? Coalesce<T['Tag']> : never

/**
 * Array of tags from Aux
 */
export type Tags<A extends AnyAux> = readonly Tag<A>[]

/**
 * Metadata key from Aux
 */
export type MetadataKey<A> = A extends infer T extends AnyAux ? Coalesce<T['MetadataKey']> : never

/**
 * Metadata object from Aux
 */
export type Metadata<A extends AnyAux> =
  // dprint-ignore
  IsNever<A['MetadataKey']> extends true
    ? never
    : {
      [key in Coalesce<A['MetadataKey']>]?: string
    }

/**
 * Specification from Aux
 */
export type Spec<A> = A extends infer T extends AnyAux ? T['Spec'] : never

// export type setSpec<A, S extends AnySpec> =
//   // dprint-ignore
//   A extends AnyAux
//     ? Aux<A['Stage'], A['ElementId'], A['DeploymentId'], A['ViewId'], A['ProjectId'], S>
//     : never

export type StrictProjectId<A> = A extends infer T extends AnyAux ? scalar.ProjectId<ProjectId<T>> : never

export type {
  DeploymentFqn as StrictDeploymentFqn,
  Fqn as StrictFqn,
}

export type StrictViewId<A> = A extends infer T extends AnyAux ? scalar.ViewId<ViewId<T>> : never

export type StrictTag<A> = A extends infer T extends AnyAux ? scalar.Tag<Tag<T>> : never

// dprint-ignore
export type StrictElementKind<A> = A extends infer T extends AnyAux ? scalar.ElementKind<ElementKind<T>> : never
export type StrictDeploymentKind<A> = A extends infer T extends AnyAux ? scalar.DeploymentKind<DeploymentKind<T>>
  : never
export type StrictRelationKind<A> = A extends infer T extends AnyAux ? scalar.RelationshipKind<RelationKind<T>> : never

type StringPrimitive = string & Record<never, never>

/**
 * Suggests values of type `V` in IDE
 */
export type complete<V> = V | StringPrimitive

export type LiteralElementId<A extends AnyAux> = ElementId<A> | StringPrimitive
export type LiteralFqn<A extends AnyAux> = Fqn<A> | StringPrimitive
export type LiteralDeploymentId<A extends AnyAux> = DeploymentId<A> | StringPrimitive
export type LiteralDeploymentFqn<A extends AnyAux> = DeploymentFqn<A> | StringPrimitive
export type LiteralViewId<A extends AnyAux> = ViewId<A> | StringPrimitive
export type LiteralTag<A extends AnyAux> = Tag<A> | StringPrimitive

export type LiteralElementKind<A extends AnyAux> = ElementKind<A> | StringPrimitive
export type LiteralDeploymentKind<A extends AnyAux> = DeploymentKind<A> | StringPrimitive
export type LiteralRelationKind<A extends AnyAux> = RelationKind<A> | StringPrimitive

export type WithTags<A extends AnyAux> = {
  readonly tags: Tags<A>
}

export type WithOptionalTags<A extends AnyAux> = {
  readonly tags?: Tags<A> | null
}

export type WithLinks = {
  readonly links: readonly Link[]
}

export type WithOptionalLinks = {
  readonly links?: readonly Link[] | null
}

export type WithMetadata<A extends AnyAux> = {
  readonly metadata?: Metadata<A>
}
