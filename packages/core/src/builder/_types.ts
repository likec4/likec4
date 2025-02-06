import type { IfNever, IsLiteral, IsStringLiteral, Tagged, TupleToUnion } from 'type-fest'
import type { LikeC4Model } from '../model/LikeC4Model'
import type {
  BorderStyle,
  Color,
  DeploymentNodeKindSpecification,
  ElementKindSpecification,
  ElementShape,
  KeysOf,
  NonEmptyArray,
  ParsedLikeC4Model,
  RelationshipArrowType,
  RelationshipKindSpecification,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
} from '../types'
import type { ExpressionV2 } from '../types/expression-v2'
import type { Builder } from './Builder'
import type { DeploymentRulesBuilderOp } from './Builder.view-deployment'

export type BuilderSpecification = {
  elements: {
    [kind: string]: Partial<ElementKindSpecification>
  }
  relationships?: {
    [kind: string]: Partial<RelationshipKindSpecification>
  }
  deployments?: {
    [kind: string]: Partial<DeploymentNodeKindSpecification>
  }
  tags?: [string, ...string[]]
  metadataKeys?: [string, ...string[]]
}

export type Metadata<MetadataKey extends string> = IfNever<MetadataKey, never, Record<MetadataKey, string>>

export type NewElementProps<Tag, Metadata> = {
  title?: string
  description?: string
  technology?: string
  tags?: IfNever<Tag, never, [Tag, ...Tag[]]>
  metadata?: Metadata
  icon?: string
  shape?: ElementShape
  color?: Color
  links?: Array<string | { title?: string; url: string }>
  style?: {
    border?: BorderStyle
    // 0-100
    opacity?: number
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
  }
}

export type NewDeploymentNodeProps<Tag, Metadata> = {
  title?: string
  description?: string
  technology?: string
  tags?: IfNever<Tag, never, [Tag, ...Tag[]]>
  metadata?: Metadata
  icon?: string
  shape?: ElementShape
  color?: Color
  links?: NonEmptyArray<string | { title?: string; url: string }>
  style?: {
    border?: BorderStyle
    // 0-100
    opacity?: number
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
  }
}

export type NewViewProps<Tag> = {
  title?: string
  description?: string
  tags?: IfNever<Tag, never, [Tag, ...Tag[]]>
  links?: Array<string | { title?: string; url: string }>
}

export type NewRelationProps<Kind, Tag, Metadata> = {
  kind?: Kind
  title?: string
  description?: string
  technology?: string
  tags?: IfNever<Tag, never, [Tag, ...Tag[]]>
  metadata?: Metadata
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  line?: RelationshipLineType
  color?: Color
  links?: NonEmptyArray<string | { title?: string; url: string }>
}

export type Invalid<Message extends string> = Tagged<Message, 'Error'>
export type Warn<Id, Existing> = IsLiteral<Existing> extends true ? Id extends Existing ? Invalid<'Already exists'> : Id
  : Id

export type ValidId<Id> =
  // Id extends `${string}.${string}` ? Invalid<'Id must not contain dot'>
  Id extends `${number}${string}` ? Invalid<'Id must not start with number'>
    : IsStringLiteral<Id> extends true ? Id
    : Invalid<'Id must be a literal'>

/**
 * Auxilary type to keep track of the types in builder
 */
export interface Types<
  ElementKind extends string,
  Fqn extends string,
  ViewId extends string,
  RelationshipKind extends string,
  Tag extends string,
  MetadataKey extends string,
  DeploymentKind extends string,
  DeploymentFqn extends string,
> {
  ElementKind: ElementKind
  Fqn: Fqn
  ViewId: ViewId
  RelationshipKind: RelationshipKind
  Tag: Tag
  MetadataKey: MetadataKey
  DeploymentKind: DeploymentKind
  DeploymentFqn: DeploymentFqn

  Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  // Metadata: Metadata<MetadataKey>

  NewElementProps: NewElementProps<Tag, Metadata<MetadataKey>>
  NewRelationshipProps: NewRelationProps<RelationshipKind, Tag, Metadata<MetadataKey>>
  NewViewProps: NewViewProps<Tag>

  NewDeploymentNodeProps: NewDeploymentNodeProps<Tag, Metadata<MetadataKey>>
}

/**
 * When building nested objects
 */
export interface TypesNested<
  Parent extends string,
  ElementKind extends string,
  Fqn extends string,
  ViewId extends string,
  RelationshipKind extends string,
  Tag extends string,
  MetadataKey extends string,
  DeploymentKind extends string,
  DeploymentFqn extends string,
> extends
  Types<
    ElementKind,
    Fqn,
    ViewId,
    RelationshipKind,
    Tag,
    MetadataKey,
    DeploymentKind,
    DeploymentFqn
  >
{
  Parent: Parent
}

export type AnyTypes = Types<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>

export type AnyTypesNested = TypesNested<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>

export namespace Types {
  export type FromSpecification<Spec> = Spec extends BuilderSpecification ? Types<
      KeysOf<Spec['elements']>,
      never,
      never,
      KeysOf<Spec['relationships']>,
      TupleToUnion<Spec['tags']>,
      TupleToUnion<Spec['metadataKeys']>,
      KeysOf<Spec['deployments']>,
      never
    >
    : never

  export type AddFqn<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any, any, any>
    ? TypesNested<
      P,
      T['ElementKind'],
      `${P}.${Id}` | T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      T['DeploymentFqn']
    >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        Id | T['Fqn'],
        T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey'],
        T['DeploymentKind'],
        T['DeploymentFqn']
      >
    : never

  export type AddDeploymentFqn<T, Id extends string> = T extends
    TypesNested<infer P, any, any, any, any, any, any, any, any> ? TypesNested<
      P,
      T['ElementKind'],
      T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      `${P}.${Id}` | T['DeploymentFqn']
    >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        T['Fqn'],
        T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey'],
        T['DeploymentKind'],
        Id | T['DeploymentFqn']
      >
    : never

  export type AddView<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any, any, any>
    ? TypesNested<
      P,
      T['ElementKind'],
      T['Fqn'],
      Id | T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey'],
      T['DeploymentKind'],
      T['DeploymentFqn']
    >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        T['Fqn'],
        Id | T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey'],
        T['DeploymentKind'],
        T['DeploymentFqn']
      >
    : never

  export type ToParsedLikeC4Model<T> = T extends AnyTypes ? ParsedLikeC4Model<
      T['ElementKind'],
      T['RelationshipKind'],
      T['Tag'],
      T['Fqn'],
      T['ViewId'],
      T['DeploymentFqn']
    >
    : never

  export type ToLikeC4Model<T extends AnyTypes> = LikeC4Model.Computed<
    T['Fqn'],
    T['DeploymentFqn'],
    T['ViewId']
  >

  export type ToExpression<T> = T extends AnyTypes ? ExpressionV2<T['DeploymentFqn'], T['Fqn']> : never

  export type From<B> = B extends Builder<infer T> ? B['Types'] extends AnyTypes ? T : AnyTypes : never

  export type DeploymentRules<B> = DeploymentRulesBuilderOp<From<B>>
}
