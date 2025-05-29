import type { EmptyObject, IsNever, IsStringLiteral, LiteralUnion, UnionToTuple } from 'type-fest'
import type * as Scalars from './scalars'
import type { Icon } from './scalars'
import type {
  BorderStyle,
  Color,
  ColorLiteral,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColor,
} from './styles'

/**
 * Element and deployment kind specification
 */
export interface ElementSpecification {
  technology?: string
  notation?: string
  style: {
    shape?: ElementShape
    icon?: Icon
    color?: Color
    border?: BorderStyle
    opacity?: number
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
    multiple?: boolean
  }
}

export interface TagSpecification {
  color: ColorLiteral | ThemeColor
}

export interface RelationshipSpecification {
  technology?: string
  notation?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
}

export interface Specification<A extends AnyAux> {
  tags?: {
    [key in A['Tag']]: TagSpecification
  }
  elements: {
    [key in A['ElementKind']]: ElementSpecification
  }
  deployments: {
    [key in A['DeploymentKind']]: ElementSpecification
  }
  relationships: {
    [key in A['RelationKind']]: RelationshipSpecification
  }
  // dprint-ignore
  metadataKeys?: IsNever<A['MetadataKey']> extends true
    ? never
    : IsStringLiteral<A['MetadataKey']> extends true
      ? UnionToTuple<A['MetadataKey']>
      : string[]
}

/**
 * Specification types (kinds, tags, metadata keys)
 *
 * @param ElementKind - Literal union of element kinds
 * @param DeploymentKind - Literal union of deployment kinds
 * @param RelationKind - Literal union of relationship kinds
 * @param Tag - Literal union of tags
 * @param MetadataKey - Literal union of metadata keys
 */
export interface SpecTypes<
  ElementKind,
  DeploymentKind,
  RelationKind,
  Tag,
  MetadataKey,
> {
  ElementKind: ElementKind
  DeploymentKind: DeploymentKind
  RelationKind: RelationKind
  Tag: Tag
  MetadataKey: MetadataKey
}
export type AnySpecTypes = SpecTypes<string, string, string, string, string>

/**
 * Auxilary interface to keep inferred types
 *
 * @typeParam Project - Project identifier type
 * @typeParam Element - Literal union of FQNs of model elements
 * @typeParam Deployment - Literal union of FQNs of deployment elements
 * @typeParam View - Literal union of view identifiers
 * @typeParam Spec - Specification types (kinds, tags, metadata keys)
 */
export interface Aux<
  Project,
  Element,
  Deployment,
  View,
  Spec extends SpecTypes<any, any, any, any, any>,
> {
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

export type AnyAux = Aux<string, string, string, string, AnySpecTypes>

/**
 * @param ElementKind - Literal union of element kinds
 * @param DeploymentKind - Literal union of deployment kinds
 * @param RelationKind - Literal union of relationship kinds
 * @param Tag - Literal union of tags
 * @param MetadataKey - Literal union of metadata keys
 */
export type AnyAuxWithSpec<
  ElementKind = string,
  DeploymentKind = string,
  RelationKind = string,
  Tag = string,
  MetadataKey = string,
> = Aux<
  string,
  string,
  string,
  string,
  SpecTypes<ElementKind, DeploymentKind, RelationKind, Tag, MetadataKey>
>

/**
 * Fallback when {@link Aux} can't be inferred
 */
// export interface UnknownAux extends Aux<string, string, string, string, AnySpecTypes> {}
export type UnknownAux = AnyAux

// type ArrayOf<T> = IsNever<T> extends false ? readonly T[] : readonly []
type ArrayOf<T> = readonly T[]
type MetadataObject<T> = T extends infer K extends string ? Record<K, string> : EmptyObject

export namespace Aux {
  /**
   * Project identifier from Aux
   */
  export type ProjectId<A extends AnyAux> = A['ProjectId']

  /**
   * Element FQN from Aux as a literal union
   * @alias {@link Aux.ElementId}
   */
  export type Fqn<A extends AnyAux> = A['ElementId']

  /**
   * Element FQN from Aux as a literal union
   * @alias {@link Aux.Fqn}
   */
  export type ElementId<A extends AnyAux> = A['ElementId']

  /**
   * Deployment FQN from Aux as a literal union
   * @alias {@link Aux.DeploymentId}
   */
  export type DeploymentFqn<A extends AnyAux> = A['DeploymentId']

  /**
   * Deployment FQN from Aux as a literal union
   * @alias {@link Aux.DeploymentFqn}
   */
  export type DeploymentId<A extends AnyAux> = A['DeploymentId']

  /**
   * View identifier from Aux as a literal union
   */
  export type ViewId<A extends AnyAux> = A['ViewId']

  /**
   * Relation identifier from Aux as a literal union
   */
  export type RelationId<A extends AnyAux> = string

  /**
   * Node identifier from Aux as a literal union
   */
  export type NodeId<A extends AnyAux> = A['ElementId'] | A['DeploymentId']

  /**
   * Edge identifier from Aux as a literal union
   */
  export type EdgeId<A extends AnyAux> = string

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
  export type Tags<A extends AnyAux> = ArrayOf<A['Tag']>

  /**
   * Metadata key from Aux
   */
  export type MetadataKey<A extends AnyAux> = A['MetadataKey']

  /**
   * Metadata object from Aux
   */
  export type Metadata<A extends AnyAux> = MetadataObject<A['MetadataKey']>

  /**
   * Specification from Aux
   */
  export type Spec<A extends AnyAux> = A['Spec']

  /**
   * Strict types from Aux
   * These are branded types that are used to ensure type safety
   *
   * @param A - Aux type
   */
  export namespace Strict {
    export type ProjectId<A extends AnyAux> = Scalars.ProjectId<A['ProjectId']>

    export type Fqn<A extends AnyAux> = Scalars.Fqn<A['ElementId']>
    export type ElementId<A extends AnyAux> = Scalars.Fqn<A['ElementId']>
    export type DeploymentFqn<A extends AnyAux> = Scalars.DeploymentFqn<A['DeploymentId']>
    export type DeploymentId<A extends AnyAux> = Scalars.DeploymentFqn<A['DeploymentId']>
    export type ViewId<A extends AnyAux> = Scalars.ViewId<A['ViewId']>

    // export type NodeId<A extends AnyAux> = Scalars.Fqn<A['ElementId']> | Scalars.DeploymentFqn<A['DeploymentId']>
    export type NodeId<A extends AnyAux> = Scalars.NodeId<A['ElementId'] | A['DeploymentId']>
    export type EdgeId<A extends AnyAux> = Scalars.EdgeId

    export type RelationId<A extends AnyAux> = Scalars.RelationId

    export type Tag<A extends AnyAux> = IsNever<A['Tag']> extends true ? never : Scalars.Tag<A['Tag']>
    export type MetadataKey<A extends AnyAux> = A['MetadataKey']

    // dprint-ignore
    export type ElementKind<A extends AnyAux> = IsNever<A['ElementKind']> extends true ? never : Scalars.ElementKind<A['ElementKind']>
    export type DeploymentKind<A extends AnyAux> = IsNever<A['DeploymentKind']> extends true ? never
      : Scalars.DeploymentKind<A['DeploymentKind']>
    export type RelationKind<A extends AnyAux> = IsNever<A['RelationKind']> extends true ? never
      : Scalars.RelationKind<A['RelationKind']>

    /**
     * Utility type to get the tags from the spec
     */
    // dprint-ignore
    export type Tags<A extends AnyAux> = ArrayOf<Scalars.Tag<A['Tag']>>
    export type Metadata<A extends AnyAux> = MetadataObject<A['MetadataKey']>
  }

  /**
   * Allows creating a union type by combining primitive types and literal types
   * without sacrificing auto-completion in IDEs for the literal type part of the union.
   */
  export namespace Primitive {
    export type ElementId<A extends AnyAux> = LiteralUnion<A['ElementId'], string>
    export type Fqn<A extends AnyAux> = LiteralUnion<A['ElementId'], string>
    export type DeploymentId<A extends AnyAux> = LiteralUnion<A['DeploymentId'], string>
    export type DeploymentFqn<A extends AnyAux> = LiteralUnion<A['DeploymentId'], string>
    export type ViewId<A extends AnyAux> = LiteralUnion<A['ViewId'], string>
    export type RelationId<A extends AnyAux> = string

    export type Tag<A extends AnyAux> = LiteralUnion<A['Tag'], string>
    export type MetadataKey<A extends AnyAux> = LiteralUnion<A['MetadataKey'], string>
    export type ElementKind<A extends AnyAux> = LiteralUnion<A['ElementKind'], string>
    export type DeploymentKind<A extends AnyAux> = LiteralUnion<A['DeploymentKind'], string>
    export type RelationKind<A extends AnyAux> = LiteralUnion<A['RelationKind'], string>
  }
}
