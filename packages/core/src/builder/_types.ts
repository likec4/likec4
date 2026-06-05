import type { IfNever, IsLiteral, IsNever, PartialDeep, Tagged, TupleToUnion } from 'type-fest'
import type {
  AnyAux,
  Aux,
  BorderStyle,
  ElementShape,
  ElementSpecification as ElementKindSpecification,
  Expression,
  IconPosition,
  KeysOf,
  LikeC4ProjectStylesConfig,
  MarkdownOrString,
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

/**
 * Duplicate-handling mode for a {@link Builder}.
 *
 * - `strict` (default): re-declaring an FQN that already exists throws.
 * - `editable`: re-declaring an existing FQN with the **same kind** replaces the
 *   existing entry (so `.with(...)` can both edit and descend). Different-kind
 *   redeclaration still throws.
 *
 * Typically set when seeding a builder from a loaded model — see
 * {@link Builder.fromParsed} and `LikeC4.toBuilder`.
 */
export type BuilderMode = 'strict' | 'editable'

type ElementSpecification = Omit<ElementKindSpecification, 'tags'> & {
  tags?: string[]
}

export type BuilderSpecification = {
  elements?: string[] | {
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
  summary?: MarkdownOrString | string
  description?: MarkdownOrString | string
  technology?: string
  tags?: [Tag, ...Tag[]]
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
    iconColor?: Color
    iconSize?: ShapeSize
    iconPosition?: IconPosition
    multiple?: boolean
  }
}

export type NewDeploymentNodeProps<Tag, Metadata> = {
  title?: string
  summary?: MarkdownOrString | string
  description?: MarkdownOrString | string
  technology?: string
  tags?: [Tag, ...Tag[]]
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
    iconColor?: Color
    iconSize?: ShapeSize
    iconPosition?: IconPosition
    multiple?: boolean
  }
}

export type NewViewProps<Tag> = {
  title?: string
  description?: MarkdownOrString | string
  tags?: [Tag, ...Tag[]]
  links?: Array<string | { title?: string; url: string }>
}

export type NewRelationProps<Kind, Tag, Metadata> = {
  kind?: Kind
  title?: string
  description?: MarkdownOrString | string
  technology?: string
  notes?: MarkdownOrString | string
  tags?: [Tag, ...Tag[]]
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

  /**
   * Merges two {@link Types} by unioning every slot (element kinds, FQNs,
   * relationship kinds, tags, metadata keys, deployment kinds and FQNs).
   *
   * Used by `Builder.specification(...)` to combine the existing builder's
   * types with a newly-declared specification. A plain `A & B` intersection
   * would *narrow* the unions (e.g. `'a' | 'b' & 'c' | 'd'` = `never`), which
   * is the opposite of what we want when adding new kinds.
   */
  export type Merge<A, B> = A extends Types<
    infer AK extends string,
    infer AF extends string,
    infer AV extends string,
    infer AR extends string,
    infer AT extends string,
    infer AM extends string,
    infer ADK extends string,
    infer ADF extends string
  > ? B extends Types<
      infer BK extends string,
      infer BF extends string,
      infer BV extends string,
      infer BR extends string,
      infer BT extends string,
      infer BM extends string,
      infer BDK extends string,
      infer BDF extends string
    > ? Types<AK | BK, AF | BF, AV | BV, AR | BR, AT | BT, AM | BM, ADK | BDK, ADF | BDF>
    : A
    : B

  /**
   * Inverse of {@link ToAux} — derives builder {@link Types} from an {@link Aux}.
   *
   * Useful when a `Builder` needs to be reconstructed from a runtime value whose
   * Aux is already known statically (e.g. the result of `builder.build()`).
   */
  export type FromAux<A> = A extends Aux<
    any,
    infer Element extends string,
    infer Deployment extends string,
    infer View extends string,
    any,
    SpecAux<
      infer ElementKind extends string,
      infer DeploymentKind extends string,
      infer RelationshipKind extends string,
      infer Tag extends string,
      infer MetadataKey extends string
    >
  > ? Types<
      ElementKind,
      Element,
      View,
      RelationshipKind,
      Tag,
      MetadataKey,
      DeploymentKind,
      Deployment
    >
    : AnyTypes

  export type ToExpression<T> = T extends AnyTypes ? Expression<ToAux<T>> : never

  export type From<B> = B extends Builder<infer T> ? B['Types'] extends AnyTypes ? T : AnyTypes : never

  export type DeploymentRules<B> = DeploymentRulesBuilderOp<From<B>>
}
