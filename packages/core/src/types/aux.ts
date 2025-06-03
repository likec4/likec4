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
  Stage: Coalesce<Stage, ModelStage>
  ProjectId: Coalesce<Project, string>
  ElementId: Coalesce<Element, string>
  DeploymentId: Coalesce<Deployment, string>

  ViewId: Coalesce<View, string>

  Spec: Spec
  ElementKind: Coalesce<Spec['ElementKind']>
  DeploymentKind: Coalesce<Spec['DeploymentKind']>
  RelationKind: Coalesce<Spec['RelationKind']>
  Tag: Coalesce<Spec['Tag']>
  MetadataKey: Coalesce<Spec['MetadataKey']>

  // Strict: {
  //   ProjectId: scalar.ProjectId<Coalesce<Project>>
  //   Fqn: scalar.Fqn<Coalesce<Element>>
  //   DeploymentFqn: scalar.DeploymentFqn<Coalesce<Deployment>>
  //   ViewId: scalar.ViewId<Coalesce<View>>

  //   ElementKind: scalar.ElementKind<Coalesce<Spec['ElementKind']>>
  //   DeploymentKind: scalar.DeploymentKind<Coalesce<Spec['DeploymentKind']>>
  //   RelationKind: scalar.RelationshipKind<Coalesce<Spec['RelationKind']>>
  //   Tag: scalar.Tag<Coalesce<Spec['Tag']>>
  // }
}

export type Any = Aux<any, any, any, any, any, SpecAux<any, any, any, any, any>>

export type AnyOnStage<Stage extends ModelStage> = Aux<Stage, any, any, any, any, SpecAux<any, any, any, any, any>>

export type AnyParsed = AnyOnStage<'parsed'>
export type AnyProcessed = AnyOnStage<'computed'> | AnyOnStage<'layouted'>
export type AnyComputed = AnyOnStage<'computed'>
export type AnyLayouted = AnyOnStage<'layouted'>

// export type AnyAux = Aux<any, any, any, any, any, AnySpec>
export type AnyAux = Any

export type Never = Aux<never, never, never, never, never, SpecAux<never, never, never, never, never>>

/**
 * Fallback when {@link Aux} can't be inferred.
 * By default assumes layouted view
 */
export type Unknown = AnyOnStage<'layouted'>
//   'layouted' | 'computed',
//   string,
//   string,
//   string,
//   string,
//   SpecAux<string, string, string, string, string>
// >

/**
 * Reads stage from Aux
 */
export type Stage<A extends AnyAux | unknown> = A['Stage']

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

export type toLayouted<A extends AnyAux> = setStage<A, 'layouted'>

export type asLayouted<A extends AnyAux> = A extends AnyLayouted ? setStage<A, 'layouted'> : A

export type toComputed<A extends AnyAux> = setStage<A, 'computed'>

export type asComputed<A extends AnyAux> = ['computed'] extends [A['Stage']] ? setStage<A, 'computed'> : never

// export type read<A, F extends keyof AnyAux, OnAny = string> =
//   // dprint-ignore
//   A extends AnyAux
//     ? (IsAny<A[F]> extends false ? A[F] : OnAny)
//     : never

// type ValueOrString<T> = IsAny<T> extends false ? T : string

/**
 * Project identifier from Aux
 */
export type ProjectId<A extends AnyAux> = A['ProjectId']
/**
 * Element FQN from Aux as branded type
 * @alias {@link ElementId}
 */
export type Fqn<A> = A extends infer T extends AnyAux ? scalar.Fqn<ElementId<T>> : never

/**
 * Element FQN from Aux as a literal union
 * @alias {@link Fqn}
 */
export type ElementId<A> = A extends infer T extends AnyAux ? T['ElementId'] : never

/**
 * Deployment FQN from Aux as branded type
 * @alias {@link DeploymentId}
 */
export type DeploymentFqn<A extends AnyAux> = scalar.DeploymentFqn<DeploymentId<A>>

/**
 * Deployment FQN from Aux as a literal union
 * @alias {@link DeploymentFqn}
 */
export type DeploymentId<A extends AnyAux> = A['DeploymentId']

/**
 * View identifier from Aux as a literal union
 */
export type ViewId<A extends AnyAux> = A['ViewId']

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
export type ElementKind<A extends AnyAux> = A['ElementKind']

/**
 * DeploymentKind from Aux as a literal union
 */
export type DeploymentKind<A extends AnyAux> = A['DeploymentKind']

/**
 * RelationKind from Aux as a literal union
 */
export type RelationKind<A extends AnyAux> = A['RelationKind']

/**
 * Tag from Aux as a literal union
 */
export type Tag<A extends AnyAux> = A['Tag']

/**
 * Array of tags from Aux
 */
export type Tags<A extends AnyAux> = readonly Tag<A>[]

/**
 * Metadata key from Aux
 */
export type MetadataKey<A extends AnyAux> = A['MetadataKey']

/**
 * Metadata object from Aux
 */
export type Metadata<A extends AnyAux> =
  // dprint-ignore
  MetadataKey<A> extends infer K extends string
    ? IsNever<K> extends false
      ? ({
          [key in K]?: string | undefined
        })
      : never
    : never

/**
 * Specification from Aux
 */
export type Spec<A> = A extends AnyAux ? A['Spec'] : never

// export type setSpec<A, S extends AnySpec> =
//   // dprint-ignore
//   A extends AnyAux
//     ? Aux<A['Stage'], A['ElementId'], A['DeploymentId'], A['ViewId'], A['ProjectId'], S>
//     : never

export type StrictProjectId<A extends AnyAux> = A extends AnyAux ? scalar.ProjectId<A['ProjectId']> : never

export type {
  DeploymentFqn as StrictDeploymentFqn,
  Fqn as StrictFqn,
}
// export type StrictFqn<A extends AnyAux> = Fqn<A>

// export type StrictDeploymentFqn<A extends AnyAux> = A extends AnyAux ? scalar.DeploymentFqn<A['DeploymentId']> : never

export type StrictViewId<A extends AnyAux> = scalar.ViewId<ViewId<A>>

export type StrictTag<A extends AnyAux> = scalar.Tag<Tag<A>>

// dprint-ignore
export type StrictElementKind<A extends AnyAux> = scalar.ElementKind<ElementKind<A>>
export type StrictDeploymentKind<A extends AnyAux> = scalar.DeploymentKind<DeploymentKind<A>>
export type StrictRelationKind<A extends AnyAux> = scalar.RelationshipKind<RelationKind<A>>

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
