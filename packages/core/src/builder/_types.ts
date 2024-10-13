import type { IfNever, IsLiteral, Tagged, TupleToUnion } from 'type-fest'
import type {
  BorderStyle,
  Color,
  ElementKindSpecification,
  ElementShape,
  ParsedLikeC4Model,
  RelationshipArrowType,
  RelationshipKindSpecification,
  RelationshipLineType
} from '../types'

type KeysOf<T> = keyof T extends infer K extends string ? K : never

export type BuilderSpecification = {
  elements: {
    [kind: string]: Partial<ElementKindSpecification>
  }
  relationships?: Record<string, Partial<RelationshipKindSpecification>>
  tags?: [string, ...string[]]
  metadataKeys?: [string, ...string[]]
}

type Metadata<MetadataKey extends string> = IfNever<MetadataKey, never, Record<MetadataKey, string>>

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
  links?: Array<string | { title?: string; url: string }>
}

export type Invalid<Message extends string> = Tagged<Message, 'Error'>
export type Warn<Id, Existing> = IsLiteral<Existing> extends true ? Id extends Existing ? Invalid<'Already exists'> : Id
  : Id

/**
 * Auxilary type to keep track of the types in builder
 */
export interface Types<
  ElementKind extends string,
  Fqn extends string,
  ViewId extends string,
  RelationshipKind extends string,
  Tag extends string,
  MetadataKey extends string
> {
  ElementKind: ElementKind
  Fqn: Fqn
  ViewId: ViewId
  RelationshipKind: RelationshipKind
  Tag: Tag
  MetadataKey: MetadataKey

  Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  // Metadata: Metadata<MetadataKey>

  NewElementProps: NewElementProps<Tag, Metadata<MetadataKey>>
  NewRelationshipProps: NewRelationProps<RelationshipKind, Tag, Metadata<MetadataKey>>
  NewViewProps: NewViewProps<Tag>
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
  MetadataKey extends string
> extends
  Types<
    ElementKind,
    Fqn,
    ViewId,
    RelationshipKind,
    Tag,
    MetadataKey
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
  any
>

export type AnyTypesNested = TypesNested<
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
      TupleToUnion<Spec['metadataKeys']>
    >
    : never

  export type AddFqn<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any> ? TypesNested<
      P,
      T['ElementKind'],
      `${P}.${Id}` | T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        Id | T['Fqn'],
        T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey']
      >
    : never

  export type AddView<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any>
    ? TypesNested<
      P,
      T['ElementKind'],
      T['Fqn'],
      Id | T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        T['Fqn'],
        Id | T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey']
      >
    : never

  export type ToParsedLikeC4Model<T> = T extends AnyTypes ? ParsedLikeC4Model<
      T['ElementKind'],
      T['RelationshipKind'],
      T['Tag'],
      T['Fqn'],
      T['ViewId']
    >
    : never
}
