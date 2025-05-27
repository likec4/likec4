import type { EmptyObject, IsNever, LiteralUnion, UnionToTuple } from 'type-fest'
import type * as Scalars from './scalars'
import type { Icon } from './scalars'
import type {
  BorderStyle,
  ColorLiteral,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColor,
} from './styles'

export interface ElementSpecification {
  technology?: string
  notation?: string
  style: {
    shape?: ElementShape
    icon?: Icon
    color?: ThemeColor
    border?: BorderStyle
    opacity?: number
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
  }
}

export interface TagSpecification {
  color: ColorLiteral
}

export interface RelationshipSpecification {
  technology?: string
  notation?: string
  style: {
    color?: ThemeColor
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
  }
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
  metadataKeys?: UnionToTuple<A['MetadataKey']>
}

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
 */
export interface Aux<
  Project,
  Element extends string = string,
  Deployment extends string = string,
  View extends string = string,
  Spec extends AnySpecTypes = AnySpecTypes,
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
 * Fallback when {@link Aux} can't be inferred
 */
export interface UnknownAux extends Aux<never, string, string, string, AnySpecTypes> {}

type ArrayOf<T> = IsNever<T> extends false ? readonly T[] : readonly []
type MetadataObject<T> = T extends infer K extends string ? Record<K, string> : EmptyObject

export namespace Aux {
  export type ProjectId<A extends AnyAux> = A['ProjectId']

  export type Fqn<A extends AnyAux> = A['ElementId']
  // export type ElementId<A> = A extends Aux<any, infer E extends string, any, any, any> ? E : never
  export type ElementId<A extends AnyAux> = A['ElementId']

  export type DeploymentId<A extends AnyAux> = A['DeploymentId']
  export type DeploymentFqn<A extends AnyAux> = A['DeploymentId']

  export type ViewId<A extends AnyAux> = A['ViewId']
  export type RelationId<A extends AnyAux> = string

  export type NodeId<A extends AnyAux> = A['ElementId'] | A['DeploymentId']
  export type EdgeId<A extends AnyAux> = string

  export type ElementKind<A extends AnyAux> = A['ElementKind']
  export type DeploymentKind<A extends AnyAux> = A['DeploymentKind']
  export type RelationKind<A extends AnyAux> = A['RelationKind']

  export type Tag<A extends AnyAux> = A['Tag']
  export type Tags<A extends AnyAux> = ArrayOf<A['Tag']>

  export type MetadataKey<A extends AnyAux> = A['MetadataKey']
  export type Metadata<A extends AnyAux> = MetadataObject<A['MetadataKey']>

  export type Spec<A extends AnyAux> = A['Spec']

  export namespace Strict {
    export type ProjectId<A extends AnyAux> = Scalars.ProjectId<A['ProjectId']>

    export type Fqn<A extends AnyAux> = Scalars.Fqn<A['ElementId']>
    export type DeploymentFqn<A extends AnyAux> = Scalars.DeploymentFqn<A['DeploymentId']>
    export type ViewId<A extends AnyAux> = Scalars.ViewId<A['ViewId']>

    export type NodeId<A extends AnyAux> = Scalars.Fqn<A['ElementId']> | Scalars.DeploymentFqn<A['DeploymentId']>
    export type EdgeId<A extends AnyAux> = Scalars.RelationId

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
   * Allows creating a union type by combining primitive types and literal types without sacrificing auto-completion in IDEs for the literal type part of the union.
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
