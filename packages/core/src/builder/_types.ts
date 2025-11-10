import type { IfNever, IsLiteral, IsNever, PartialDeep, Tagged, TupleToUnion } from 'type-fest'
import type {
  AnyAux,
  Aux,
  BorderStyle,
  ElementShape,
  ElementSpecification as ElementKindSpecification,
  Expression,
  KeysOf,
  LikeC4ProjectStylesConfig,
  NonEmptyArray,
  RelationshipArrowType,
  RelationshipLineType,
  RelationshipSpecification as RelationshipKindSpecification,
  ShapeSize,
  SpacingSize,
  SpecAux,
  TagSpecification,
  TextSize,
  ThemeColor as Color,
} from '../types'
import type { Builder } from './Builder'
import type { DeploymentRulesBuilderOp } from './Builder.view-deployment'

type ElementSpecification = Omit<ElementKindSpecification, 'tags'> & {
  tags?: string[]
}

export type BuilderSpecification = {
  elements: string[] | {
    [kind: string]: Partial<ElementSpecification>
  }
  relationships?: string[] | {
    [kind: string]: Partial<RelationshipKindSpecification>
  }
  deployments?: string[] | {
    [kind: string]: Partial<ElementSpecification>
  }
  tags?: string[] | {
    [kind: string]: Partial<TagSpecification>
  }
  metadataKeys?: string[]
}

/**
 * We need with `id: string` to be able to derive the project id
 *
 * @see {@link LikeC4Project}
 */
export type BuilderProjectSpecification = {
  id: string
  title?: string
  styles?: PartialDeep<LikeC4ProjectStylesConfig>
}

export type Metadata<MetadataKey extends string> = IsNever<MetadataKey> extends true ? never :
  IsLiteral<MetadataKey> extends true ? {
      [key in MetadataKey]?: string | NonEmptyArray<string>
    } :
  Record<string, string | NonEmptyArray<string>>

export type NewElementProps<Tag, Metadata> = {
  title?: string
  summary?: string
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
  summary?: string
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
  summary?: string
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
    : IsLiteral<Id> extends true ? Id
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

type KeysOrTuple<T> = T extends readonly string[] ? TupleToUnion<T> : KeysOf<T>

export namespace Types {
  export type FromSpecification<Spec> = Spec extends BuilderSpecification ? Types<
      KeysOrTuple<Spec['elements']>,
      never,
      never,
      KeysOrTuple<Spec['relationships']>,
      KeysOrTuple<Spec['tags']>,
      TupleToUnion<Spec['metadataKeys']>,
      KeysOrTuple<Spec['deployments']>,
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

  export type ToAux<T> = T extends AnyTypes ? Aux<
      'parsed',
      T['Fqn'],
      T['DeploymentFqn'],
      T['ViewId'],
      'from-builder',
      SpecAux<
        T['ElementKind'],
        T['DeploymentKind'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey']
      >
    >
    : AnyAux

  export type ToExpression<T> = T extends AnyTypes ? Expression<ToAux<T>> : never

  export type From<B> = B extends Builder<infer T> ? B['Types'] extends AnyTypes ? T : AnyTypes : never

  export type DeploymentRules<B> = DeploymentRulesBuilderOp<From<B>>
}
