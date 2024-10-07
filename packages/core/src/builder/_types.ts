import type {
  EmptyObject,
  IfNever,
  IfUnknown,
  IsLiteral,
  IsNever,
  IsStringLiteral,
  IsUnknown,
  Join,
  Simplify,
  Tagged,
  TupleToUnion,
  UnionToTuple
} from 'type-fest'
import type {
  BorderStyle,
  Color,
  CustomElementExpr,
  CustomRelationExpr,
  ElementKindSpecification,
  ElementShape,
  LikeC4View,
  NonEmptyArray,
  ParsedLikeC4Model,
  RelationshipArrowType,
  RelationshipKindSpecification,
  RelationshipLineType,
  TypedElement
} from '../types'
import type { LikeC4ModelBuilder } from './LikeC4ModelBuilder'

type KeysOf<T> = keyof T extends infer K extends string ? K : never

export type Specification = {
  elements: {
    [kind: string]: Partial<ElementKindSpecification>
  }
  relationships?: Record<string, Partial<RelationshipKindSpecification>>
  tags?: [string, ...string[]]
  metadataKeys?: [string, ...string[]]
}

type Metadata<Keys> = Keys extends string ? Record<Keys, string> : never

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

/**
 * Auxilary type to keep track of the types in builder
 * "Hides" types from pu
 */
export interface TypesHook<
  ElementKind extends string,
  RelationshipKind extends string,
  Tag extends string,
  MetadataKey extends string,
  Fqn extends string,
  ViewId extends string
> // MissingFqn extends string | never = never
{
  ElementKind: ElementKind
  RelationshipKind: RelationshipKind
  Tag: Tag
  MetadataKey: MetadataKey
  Fqn: Fqn
  ViewId: ViewId

  // MissingFqn: MissingFqn

  Element: TypedElement<Fqn, ElementKind, Tag, MetadataKey>
  View: LikeC4View<ViewId, Tag>

  Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  Metadata: Metadata<MetadataKey>

  ElementProps: NewElementProps<Tag, Metadata<MetadataKey>>

  RelationProps: NewRelationProps<RelationshipKind, Tag, Metadata<MetadataKey>>

  Expression: TypesHook.Expression<TypesHook.ElementExpr<Fqn>>

  ViewPredicate: TypesHook.ViewPredicate<TypesHook.Expression<TypesHook.ElementExpr<Fqn>>>

  DynamicViewStep: `${Fqn} ${'->' | '<-'} ${Fqn}`
}

export type AnyTypesHook = TypesHook<any, any, any, any, any, any>

export namespace TypesHook {
  export type ElementExpr<Fqn extends string> = '*' | Fqn | `${Fqn}.*` | `${Fqn}._`

  export type Expression<ElementExpr extends string> =
    | ElementExpr
    | `-> ${ElementExpr} ->`
    | `-> ${ElementExpr}`
    | `${ElementExpr} ->`
    | `${ElementExpr} ${'->' | '<->'} ${ElementExpr}`

  export type ViewPredicate<Expr extends string> = `${'exclude' | 'include'} ${Expr}`

  export namespace ViewPredicate {
    export type WhereTag<Tag extends string> = `tag ${'is' | 'is not'} #${Tag}`
    export type WhereKind<Kind extends string> = `kind ${'is' | 'is not'} ${Kind}`

    export type WhereEq<Types extends AnyTypesHook> =
      | WhereTag<Types['Tag']>
      | WhereKind<Types['ElementKind']>

    export type WhereOperator<Types extends AnyTypesHook> = WhereEq<Types> | {
      and: NonEmptyArray<WhereOperator<Types>>
      or?: never
      not?: never
    } | {
      or: NonEmptyArray<WhereOperator<Types>>
      and?: never
      not?: never
    } | {
      not: WhereOperator<Types>
      and?: never
      or?: never
    }

    export type Custom<Types extends AnyTypesHook> = {
      where?: WhereOperator<Types>
      with?: Simplify<Omit<CustomElementExpr['custom'] & CustomRelationExpr['customRelation'], 'expr' | 'relation'>>
    }
  }

  export type AddFqn<Types, Id extends string> = Types extends
    TypesHook<infer E, infer R, infer T, infer M, infer Fqn, infer V> ? TypesHook<
      E,
      R,
      T,
      M,
      Id | Fqn,
      V
    >
    : never

  export type ToParsedLikeC4Model<Types> = Types extends TypesHook<infer E, infer R, infer T, any, infer F, infer V>
    ? ParsedLikeC4Model<E, R, T, F, V>
    // ? IsNever<Missing> extends true ? ParsedLikeC4Model<E, R, T, F, V> : MissingFqn<Missing>
    : never
}

export type TypesFromSpecification<Spec> = Spec extends Specification ? TypesHook<
    KeysOf<Spec['elements']>,
    KeysOf<Spec['relationships']>,
    TupleToUnion<Spec['tags']>,
    TupleToUnion<Spec['metadataKeys']>,
    never,
    never
  >
  : never

export type Invalid<Message extends string> = Tagged<Message, 'Error'>
// export type MissingFqn<Message extends string> = Tagged<Message & EmptyObject, 'MissingFqn'>
export type Warn<Id, Existing> = IsLiteral<Existing> extends true ? Id extends Existing ? Invalid<'Already exists'> : Id
  : Id

// /**
//  * Auxilary type to keep track of the types in builder
//  * "Hides" types from pu
//  */
// export interface NestedTypes<
//   Parent extends string,
//   Fqn extends string,
//   ViewId extends string,
//   Specs extends Types.Specs<any, any, any, any>
// > extends Types<Fqn, ViewId, Specs> {
//   Parent: Parent
// }

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
  RelationshipKind: StringLiteral<RelationshipKind>
  Tag: StringLiteral<Tag>
  MetadataKey: StringLiteral<MetadataKey>

  Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  Metadata: Metadata<MetadataKey>
  // RelationshipKind: Specs['RelationshipKind']
  // RelationshipKind: Specs['RelationshipKind']
  // Tag: Specs['Tag']
  // MetadataKey: Specs['MetadataKey']

  // MissingFqn: MissingFqn

  // Element: TypedElement<Fqn, ElementKind, Tag, MetadataKey>
  // View: LikeC4View<ViewId, Tag>

  // Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  // Metadata: Metadata<MetadataKey>

  ElementProps: NewElementProps<Tag, never>

  RelationshipExpr: Types.RelationshipExpr<Fqn>
  // RelationProps: NewRelationProps<RelationshipKind, Tag, Metadata<MetadataKey>>

  // Expression: Types.Expression<TypesHook.ElementExpr<Fqn>>

  // ViewPredicate: Types.ViewPredicate<TypesHook.Expression<TypesHook.ElementExpr<Fqn>>>

  // DynamicViewStep: `${Fqn} ${'->' | '<-'} ${Fqn}`
}

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

type StringLiteral<T> = IsUnknown<T> extends true ? unknown
  : T extends infer S extends string ? IsStringLiteral<S> extends true ? S : string
  : never

export type WithParent<Id extends string, Parent = unknown> = Parent extends string
  ? IsStringLiteral<Parent> extends true ? `${Parent}.${Id}` : string
  : Id

export namespace Types {
  export type FromSpecification<Spec> = Spec extends Specification ? Types<
      KeysOf<Spec['elements']>,
      never,
      never,
      KeysOf<Spec['relationships']>,
      TupleToUnion<Spec['tags']>,
      TupleToUnion<Spec['metadataKeys']>
    >
    : never

  // export interface Specs<
  //   ElementKind = unknown,
  //   RelationshipKind = unknown,
  //   Tag = unknown,
  //   MetadataKey = unknown
  // > {
  //   ElementKind: StringLiteral<ElementKind>
  //   RelationshipKind: StringLiteral<RelationshipKind>
  //   Tag: StringLiteral<Tag>
  //   MetadataKey: StringLiteral<MetadataKey>

  //   Tags: IfNever<Tag, never, [Tag, ...Tag[]]>
  //   Metadata: Metadata<MetadataKey>
  // }

  // export type NewFqn<T, Id extends string> = T extends TypesNested<infer P, any, any, any, any, any, any> ? `${P}.${Id}` : Id

  export type ToNested<T extends AnyTypes, Id extends string> = T extends
    TypesNested<infer P, any, infer F, any, any, any, any> ? TypesNested<
      `${P}.${Id}`,
      T['ElementKind'],
      `${P}.${Id}` | F,
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >
    : TypesNested<
      Id,
      T['ElementKind'],
      Id | T['Fqn'],
      T['ViewId'],
      T['RelationshipKind'],
      T['Tag'],
      T['MetadataKey']
    >

  export type FromNested<T extends AnyTypes, N> = N extends TypesNested<any, any, infer F, any, any, any, any>
    ? T extends TypesNested<infer P, any, any, any, any, any, any> ? TypesNested<
        P,
        T['ElementKind'],
        F,
        T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey']
      >
    : T extends AnyTypes ? Types<
        T['ElementKind'],
        F,
        T['ViewId'],
        T['RelationshipKind'],
        T['Tag'],
        T['MetadataKey']
      >
    : never
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

  // type RelationshipTo<A extends string, B extends string> = A extends B | `${B}.${string}` ? never :
  type RelationshipTo<A extends string, B extends string> = A extends B ? never : `${A} -> ${B}`
  // type RelationshipTo<A extends string, B extends string> = B extends `${A}.${string}` ? never :
  //   A extends `${B}.${string}` ? never :
  //  `${A} -> ${B}`
  // type RelationshipTo<A extends string, To> = To extends infer B extends string ? `${A} -> ${B}` | `${B} -> ${A}` : never
  // type RelationshipTo<A extends string, B extends string> = B extends A ? never : `${A} -> ${B}`
  // B extends `${A}.${string}` ? never : `${A} -> ${B}`

  export type RelationshipExpr<Fqn> = [Fqn, Fqn] extends [infer A extends string, infer B extends string]
    ? RelationshipTo<A, B>
    : never
  // export type RelationshipExpr<Fqn> = [Fqn, Fqn] extends [infer A extends string, infer B extends string]
  //   ? A extends `${B}.${string}` ? never
  //   : B extends `${A}.${string}` ? never
  //   : `${A} -> ${B}`
  //   : never

  // export type CopyFqnsFrom<A extends AnyTypes, B extends AnyTypes> = A extends NestedTypes<infer P, infer Fqn, any, any>
  //   ? NestedTypes<P, IfNever<Fqn, B['Fqn'], Fqn | B['Fqn']>, A['ViewId'], A['Specs']>
  //   : A extends Types<infer Fqn, any, any> ? Types<IfNever<Fqn, B['Fqn'], Fqn | B['Fqn']>, A['ViewId'], A['Specs']>
  //   : Types<B['Fqn'] | A['Fqn'], B['ViewId'], B['Specs']>

  export type ElementExpr<Fqn extends string> = '*' | Fqn | `${Fqn}.*` | `${Fqn}._`

  export type Expression<ElementExpr extends string> =
    | ElementExpr
    | `-> ${ElementExpr} ->`
    | `-> ${ElementExpr}`
    | `${ElementExpr} ->`
    | `${ElementExpr} ${'->' | '<->'} ${ElementExpr}`

  export type ViewPredicate<Expr extends string> = `${'exclude' | 'include'} ${Expr}`

  export namespace ViewPredicate {
    export type WhereTag<Tag extends string> = `tag ${'is' | 'is not'} #${Tag}`
    export type WhereKind<Kind extends string> = `kind ${'is' | 'is not'} ${Kind}`

    export type WhereEq<Types extends AnyTypesHook> =
      | WhereTag<Types['Tag']>
      | WhereKind<Types['ElementKind']>

    export type WhereOperator<Types extends AnyTypesHook> = WhereEq<Types> | {
      and: NonEmptyArray<WhereOperator<Types>>
      or?: never
      not?: never
    } | {
      or: NonEmptyArray<WhereOperator<Types>>
      and?: never
      not?: never
    } | {
      not: WhereOperator<Types>
      and?: never
      or?: never
    }

    export type Custom<Types extends AnyTypesHook> = {
      where?: WhereOperator<Types>
      with?: Simplify<Omit<CustomElementExpr['custom'] & CustomRelationExpr['customRelation'], 'expr' | 'relation'>>
    }
  }

  export type ToParsedLikeC4Model<T extends AnyTypes> = T extends
    Types<infer E, infer R, infer T, any, infer F, infer V> ? ParsedLikeC4Model<E, R, T, F, V>
    : never
}

// type Eb<T> = T extends ElementBuilder<infer Id, infer Types> ? {
//     Id: Id
//     Types: Types
//   }
//   : never
// type NestedPipe<Parent extends string, A extends AnyTypesHook, B extends AnyTypesHook> = (
//   input: LikeC4ModelBuilder<A>
// ) => LikeC4ModelBuilder<B>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<any, B>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<any, B>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, C>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, D>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, E>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook,
//   F extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>,
//   op5: (input: ElementBuilder<Parent, E>) => ElementBuilder<Parent, F>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, F>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook,
//   F extends AnyTypesHook,
//   G extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>,
//   op5: (input: ElementBuilder<Parent, E>) => ElementBuilder<Parent, F>,
//   op6: (input: ElementBuilder<Parent, F>) => ElementBuilder<Parent, G>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, G>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook,
//   F extends AnyTypesHook,
//   G extends AnyTypesHook,
//   H extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>,
//   op5: (input: ElementBuilder<Parent, E>) => ElementBuilder<Parent, F>,
//   op6: (input: ElementBuilder<Parent, F>) => ElementBuilder<Parent, G>,
//   op7: (input: ElementBuilder<Parent, G>) => ElementBuilder<Parent, H>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, H>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook,
//   F extends AnyTypesHook,
//   G extends AnyTypesHook,
//   H extends AnyTypesHook,
//   I extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent,  C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>,
//   op5: (input: ElementBuilder<Parent, E>) => ElementBuilder<Parent, F>,
//   op6: (input: ElementBuilder<Parent, F>) => ElementBuilder<Parent, G>,
//   op7: (input: ElementBuilder<Parent, G>) => ElementBuilder<Parent, H>,
//   op8: (input: ElementBuilder<Parent, H>) => ElementBuilder<Parent, I>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, I>
// export function nested<
//   Parent extends string,
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook,
//   F extends AnyTypesHook,
//   G extends AnyTypesHook,
//   H extends AnyTypesHook,
//   I extends AnyTypesHook,
//   J extends AnyTypesHook
// >(
//   op1: (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, B>,
//   op2: (input: ElementBuilder<Parent, B>) => ElementBuilder<Parent, C>,
//   op3: (input: ElementBuilder<Parent, C>) => ElementBuilder<Parent, D>,
//   op4: (input: ElementBuilder<Parent, D>) => ElementBuilder<Parent, E>,
//   op5: (input: ElementBuilder<Parent, E>) => ElementBuilder<Parent, F>,
//   op6: (input: ElementBuilder<Parent, F>) => ElementBuilder<Parent, G>,
//   op7: (input: ElementBuilder<Parent, G>) => ElementBuilder<Parent, H>,
//   op8: (input: ElementBuilder<Parent, H>) => ElementBuilder<Parent, I>,
//   op9: (input: ElementBuilder<Parent, I>) => ElementBuilder<Parent, J>
// ): (input: ElementBuilder<Parent, A>) => ElementBuilder<Parent, J>
// export function nested(...ops: ReadonlyArray<(input: any) => unknown>): any {
//   if (ops.length === 1) {
//     return ops[0]
//   }
//   return (input: any) => ops.reduce((b, op) => op(b), input)
// }
// export function model<A extends AnyTypesHook, B extends AnyTypesHook, C extends AnyTypesHook>(
//   value: WithModelMethods<A>,
//   op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
//   op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>
// ): LikeC4ModelBuilder<C>
// export function model<A extends AnyTypesHook, B extends AnyTypesHook, C extends AnyTypesHook, D extends AnyTypesHook>(
//   value: WithModelMethods<A>,
//   op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
//   op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
//   op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>
// ): LikeC4ModelBuilder<D>
// export function model<
//   A extends AnyTypesHook,
//   B extends AnyTypesHook,
//   C extends AnyTypesHook,
//   D extends AnyTypesHook,
//   E extends AnyTypesHook
// >(
//   value: WithModelMethods<A>,
//   op1: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
//   op2: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
//   op3: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
//   op4: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>
// ): LikeC4ModelBuilder<E>
export interface WithModelMethod<Types extends AnyTypesHook> {
  model<
    A extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>
  ): LikeC4ModelBuilder<A>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>
  ): LikeC4ModelBuilder<B>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>
  ): LikeC4ModelBuilder<C>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>
  ): LikeC4ModelBuilder<D>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>
  ): LikeC4ModelBuilder<E>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook,
    F extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
    op6: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>
  ): LikeC4ModelBuilder<F>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook,
    F extends AnyTypesHook,
    G extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
    op6: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
    op7: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>
  ): LikeC4ModelBuilder<G>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook,
    F extends AnyTypesHook,
    G extends AnyTypesHook,
    H extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
    op6: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
    op7: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
    op8: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>
  ): LikeC4ModelBuilder<H>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook,
    F extends AnyTypesHook,
    G extends AnyTypesHook,
    H extends AnyTypesHook,
    I extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
    op6: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
    op7: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
    op8: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>,
    op9: (input: LikeC4ModelBuilder<H>) => LikeC4ModelBuilder<I>
  ): LikeC4ModelBuilder<I>

  model<
    A extends AnyTypesHook,
    B extends AnyTypesHook,
    C extends AnyTypesHook,
    D extends AnyTypesHook,
    E extends AnyTypesHook,
    F extends AnyTypesHook,
    G extends AnyTypesHook,
    H extends AnyTypesHook,
    I extends AnyTypesHook,
    J extends AnyTypesHook
  >(
    op1: (input: LikeC4ModelBuilder<Types>) => LikeC4ModelBuilder<A>,
    op2: (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>,
    op3: (input: LikeC4ModelBuilder<B>) => LikeC4ModelBuilder<C>,
    op4: (input: LikeC4ModelBuilder<C>) => LikeC4ModelBuilder<D>,
    op5: (input: LikeC4ModelBuilder<D>) => LikeC4ModelBuilder<E>,
    op6: (input: LikeC4ModelBuilder<E>) => LikeC4ModelBuilder<F>,
    op7: (input: LikeC4ModelBuilder<F>) => LikeC4ModelBuilder<G>,
    op8: (input: LikeC4ModelBuilder<G>) => LikeC4ModelBuilder<H>,
    op9: (input: LikeC4ModelBuilder<H>) => LikeC4ModelBuilder<I>,
    op10: (input: LikeC4ModelBuilder<I>) => LikeC4ModelBuilder<J>
  ): LikeC4ModelBuilder<J>
}
