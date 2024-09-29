import {} from '../types'
import {
  fromEntries,
  isArray,
  isFunction,
  isNonNullish,
  isNullish,
  map,
  mapToObj,
  mapValues,
  omitBy,
  pickBy
} from 'remeda'
import type { IfNever, TupleToUnion, Writable } from 'type-fest'
import { invariant, nonNullable } from '../errors'
import {
  type AutoLayoutDirection,
  type BorderStyle,
  type Color,
  DefaultElementShape,
  DefaultThemeColor,
  type Element,
  type ElementKind,
  type ElementKindSpecification,
  type ElementKindSpecificationStyle,
  type ElementShape,
  type ElementView,
  type Expression as C4Expression,
  type Fqn,
  type IconUrl,
  type LikeC4View,
  type NonEmptyArray,
  type ParsedLikeC4Model,
  type Relation,
  type RelationID,
  type RelationshipArrowType,
  type RelationshipKind,
  type RelationshipKindSpecification,
  type RelationshipLineType,
  type Tag,
  type TypedElement,
  type ViewID,
  type ViewRule,
  type ViewRuleStyle
} from '../types'
import { isNonEmptyArray, isSameHierarchy, nameFromFqn, parentFqn } from '../utils'
import { $expr } from './view-helpers'

type Specification = {
  elements: {
    [kind: string]: Partial<ElementKindSpecification>
  }
  relationships?: Record<string, Partial<RelationshipKindSpecification>>
  tags?: [string, ...string[]]
  metadataKeys?: [string, ...string[]]
}

type Metadata<Keys> = Keys extends string ? Record<Keys, string> : never

type NewElementProps<Tag, Metadata> = {
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

type NewRelationProps<Kind, Tag, Metadata> = {
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
> {
  readonly ElementKind: ElementKind
  readonly RelationshipKind: RelationshipKind
  readonly Tag: Tag
  readonly MetadataKey: MetadataKey
  readonly Fqn: Fqn
  readonly ViewId: ViewId

  readonly Element: TypedElement<Fqn, ElementKind, Tag, MetadataKey>
  readonly View: LikeC4View<ViewId, Tag>

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

    export type Where<Types extends AnyTypesHook> = {
      where: WhereOperator<Types>
    }
  }
}

type KeysOf<T> = keyof T extends infer K extends string ? K : never

interface WithNewElement<Types extends AnyTypesHook> {
  <const Id extends string>(id: Id, titleOrProps?: string | Types['ElementProps']): LikeC4ModelBuilder<
    TypesHook<
      Types['ElementKind'],
      Types['RelationshipKind'],
      Types['Tag'],
      Types['MetadataKey'],
      Id | Types['Fqn'],
      Types['ViewId']
    >
  >
  <const Id extends string, TypesFromBuilder extends AnyTypesHook>(
    id: Id,
    builder: (
      builder: ElementBuilder<
        Id,
        TypesHook<
          Types['ElementKind'],
          Types['RelationshipKind'],
          Types['Tag'],
          Types['MetadataKey'],
          Id | Types['Fqn'],
          Types['ViewId']
        >
      >
    ) => ElementBuilder<Id, TypesFromBuilder>
  ): LikeC4ModelBuilder<TypesFromBuilder>
}

type ElementBuilder<
  Id extends string,
  Types extends AnyTypesHook
> =
  & {
    title(title: string): ElementBuilder<Id, Types>
    description(description: string): ElementBuilder<Id, Types>
    techology(techology: string): ElementBuilder<Id, Types>
    style(style: ElementKindSpecificationStyle): ElementBuilder<Id, Types>
    rel(
      target: Types['Fqn'],
      props?: string | Types['RelationProps']
    ): ElementBuilder<Id, Types>
  }
  & {
    [Kind in Types['ElementKind']]: ElementBuilder.WithNestedElement<Id, Types>
  }

namespace ElementBuilder {
  export interface WithNestedElement<
    Parent extends string,
    Types extends AnyTypesHook
  > {
    <const Id extends string>(id: Id, titleOrProps?: string | Types['ElementProps']): ElementBuilder<
      Parent,
      TypesHook<
        Types['ElementKind'],
        Types['RelationshipKind'],
        Types['Tag'],
        Types['MetadataKey'],
        `${Parent}.${Id}` | Types['Fqn'],
        Types['ViewId']
      >
    >
    <const Id extends string, TypesFromBuilder extends AnyTypesHook>(
      id: Id,
      builder: (
        builder: ElementBuilder<
          `${Parent}.${Id}`,
          TypesHook<
            Types['ElementKind'],
            Types['RelationshipKind'],
            Types['Tag'],
            Types['MetadataKey'],
            `${Parent}.${Id}` | Types['Fqn'],
            Types['ViewId']
          >
        >
      ) => ElementBuilder<`${Parent}.${Id}`, TypesFromBuilder>
    ): ElementBuilder<
      Parent,
      TypesFromBuilder
    >
  }
  /* type ElementBuilderWithNestedElement<Id extends string, EB> = EB extends ElementBuilder<infer Parent, infer Types>
    ? ElementBuilder<
      Parent,
      TypesHook<
        Types['ElementKind'],
        Types['RelationshipKind'],
        Types['Tag'],
        Types['MetadataKey'],
        `${Parent}.${Id}` | Types['Fqn'],
        Types['ViewId']
      >
    >
    : never

  export type NestedElementFp<ElementProps> = <
    Id extends string
  >(
    id: Id,
    titleOrProps?: string | ElementProps
  ) => <EB extends ElementBuilder<any, any>>(eb: EB) => ElementBuilderWithNestedElement<Id, EB>
    <
    Parent extends string,
    Types extends AnyTypesHook

  (eb: EB) => ElementBuilder<
    Parent,
    TypesHook<
      Types['ElementKind'],
      Types['RelationshipKind'],
      Types['Tag'],
      Types['MetadataKey'],
      `${Parent}.${Id}` | Types['Fqn'],
      Types['ViewId']
    >
  >
  <const Id extends string, TypesFromBuilder extends AnyTypesHook>(
    id: Id,
    builder: (
      builder: ElementBuilder<
        `${Parent}.${Id}`,
        TypesHook<
          Types['ElementKind'],
          Types['RelationshipKind'],
          Types['Tag'],
          Types['MetadataKey'],
          `${Parent}.${Id}` | Types['Fqn'],
          Types['ViewId']
        >
      >
    ) => ElementBuilder<`${Parent}.${Id}`, TypesFromBuilder>
  ): ElementBuilder<
    Parent,
    TypesFromBuilder
  > */
}

export type ViewBuilder<
  Types extends AnyTypesHook
> = {
  title(title: string): ViewBuilder<Types>
  description(description: string): ViewBuilder<Types>
  include(...exprs: C4Expression[]): ViewBuilder<Types>
  exclude(...exprs: C4Expression[]): ViewBuilder<Types>
  style(rule: ViewRuleStyle): ViewBuilder<Types>
  autoLayout(layout: AutoLayoutDirection): ViewBuilder<Types>
}

type WithNewView<B> = B extends LikeC4ModelBuilder<infer Types> ? <const Id extends string>(
    id: Id,
    predicates:
      | Types['ViewPredicate']
      | [Types['ViewPredicate'], ...Types['ViewPredicate'][]]
      | ((v: ViewBuilder<Types>) => ViewBuilder<Types>)
  ) => LikeC4ModelBuilder<
    TypesHook<
      Types['ElementKind'],
      Types['RelationshipKind'],
      Types['Tag'],
      Types['MetadataKey'],
      Types['Fqn'],
      Id | Types['ViewId']
    >
  >
  : never

type WithNewViewOf<B> = B extends LikeC4ModelBuilder<infer Types> ? <const Id extends string>(
    id: Id,
    viewOf: Types['Fqn'],
    predicates:
      | Types['ViewPredicate']
      | [Types['ViewPredicate'], ...Types['ViewPredicate'][]]
      | ((v: ViewBuilder<Types>) => ViewBuilder<Types>)
  ) => LikeC4ModelBuilder<
    TypesHook<
      Types['ElementKind'],
      Types['RelationshipKind'],
      Types['Tag'],
      Types['MetadataKey'],
      Types['Fqn'],
      Id | Types['ViewId']
    >
  >
  : never

interface InvalidBuilder<Error extends string> {
  error: Error
}

type WithModelMethods<Types extends AnyTypesHook> = {
  [Kind in Types['ElementKind']]: WithNewElement<Types>
}

type EmptyLikeC4ModelBuilder<Types extends AnyTypesHook> = Types['ElementKind'] extends never
  ? InvalidBuilder<'No Element kinds'>
  : WithModelMethods<Types>

export type LikeC4ModelBuilder<Types extends AnyTypesHook> =
  & WithModelMethods<Types>
  & {
    readonly Types: Types
    relationship: (
      source: Types['Fqn'],
      target: Types['Fqn'],
      props?: string | Types['RelationProps']
    ) => LikeC4ModelBuilder<Types>
    _𐙤: (
      source: Types['Fqn'],
      target: Types['Fqn'],
      props?: string | Types['RelationProps']
    ) => LikeC4ModelBuilder<Types>
    rel: (
      source: Types['Fqn'],
      target: Types['Fqn'],
      props?: string | Types['RelationProps']
    ) => LikeC4ModelBuilder<Types>
    view: WithNewView<LikeC4ModelBuilder<Types>>
    viewOf: WithNewViewOf<LikeC4ModelBuilder<Types>>
    clone: () => LikeC4ModelBuilder<Types>
    build: () => ParsedLikeC4Model<
      Types['ElementKind'],
      Types['RelationshipKind'],
      Types['Tag'],
      Types['Fqn'],
      Types['ViewId']
    >
  }

type TypesFromSpecification<Spec> = Spec extends Specification ? TypesHook<
    KeysOf<Spec['elements']>,
    KeysOf<Spec['relationships']>,
    TupleToUnion<Spec['tags']>,
    TupleToUnion<Spec['metadataKeys']>,
    never,
    never
  >
  : never

const emptyView = {
  __: 'element' as const,
  id: 'index' as ViewID,
  title: null,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: [] as ViewRule[]
}

function mkLikeC4ModelBuilder<const Spec extends Specification>(
  spec: Spec,
  elements = new Map<string, Element>(),
  relations = [] as Relation[],
  views = new Map<string, LikeC4View>()
): LikeC4ModelBuilder<TypesFromSpecification<Spec>> {
  type Types = TypesHook<ElementKind<'some'>, RelationshipKind, Tag, string, Fqn, ViewID>

  function ensureElement(id: string): Writable<Element> {
    return nonNullable(elements.get(id))
  }

  function addElement(
    id: Fqn,
    {
      links: _links,
      icon: _icon,
      style,
      ...props
    }: Types['ElementProps'],
    kind: ElementKind,
    { style: specStyle, ...spec }: Partial<ElementKindSpecification>
  ) {
    if (elements.has(id)) {
      throw new Error(`Element with ID ${id} already exists`)
    }
    const parent = parentFqn(id)
    invariant(
      !parent || elements.has(parent),
      `Parent element ${parent} is not defined yet`
    )
    const links = isNonEmptyArray(_links) ? map(_links, l => (typeof l === 'string' ? { url: l } : l)) : null

    const icon = _icon ?? specStyle?.icon

    elements.set(id, {
      description: null,
      technology: null,
      tags: null,
      color: specStyle?.color ?? DefaultThemeColor as Color,
      shape: specStyle?.shape ?? DefaultElementShape as ElementShape,
      style: pickBy({
        border: specStyle?.border,
        opacity: specStyle?.opacity,
        ...style
      }, isNonNullish),
      links,
      ...icon && { icon: icon as IconUrl },
      ...spec,
      ...props,
      kind,
      title: props.title ?? nameFromFqn(id),
      id
    })
  }

  const mkElementBuilder = (parentId: Fqn, builder: LikeC4ModelBuilder<Types>): ElementBuilder<Fqn, Types> => {
    const element = ensureElement(parentId)
    const elBuilder: ElementBuilder<Fqn, Types> = {
      title(title) {
        element.title = title
        return elBuilder
      },
      techology(techology) {
        element.technology = techology
        return elBuilder
      },
      description(description) {
        element.description = description
        return elBuilder
      },
      style({
        color,
        icon,
        shape,
        ...style
      }) {
        Object.assign(element, color && { color }, icon && { icon }, shape && { shape }, {
          style: {
            ...element.style,
            ...omitBy(style, isNullish)
          }
        })
        return elBuilder
      },
      rel(target, props) {
        builder.relationship(parentId, target, props)
        return elBuilder
      },
      ...mapValues(spec.elements, (spec, kind) => {
        return (_id: Fqn, props?: string | Types['ElementProps'] | ((b: any) => any)) => {
          const id = `${parentId}.${_id}` as Fqn
          const properties = typeof props === 'string' ? { title: props } : isFunction(props) ? {} : (props ?? {})
          addElement(id, properties, kind as ElementKind, spec)
          if (isFunction(props)) {
            props(mkElementBuilder(id, builder))
          }
          return elBuilder
        }
      })
    }
    return elBuilder
  }

  const mkElementViewBuilder = (view: Writable<ElementView>): ViewBuilder<Types> => {
    const viewBuilder: ViewBuilder<Types> = {
      autoLayout(autoLayout) {
        view.rules.push({
          autoLayout
        })
        return viewBuilder
      },
      exclude(expr) {
        view.rules.push({
          exclude: [expr]
        })
        return viewBuilder
      },
      include(expr) {
        view.rules.push({
          include: [expr]
        })
        return viewBuilder
      },
      style(rule) {
        view.rules.push(rule)
        return viewBuilder
      },
      title: function(title: string) {
        view.title = title
        return viewBuilder
      },
      description: function(description: string) {
        view.description = description
        return viewBuilder
      }
    }
    return viewBuilder
    // const element = ensureElement(parentId)
    // const elBuilder: ElementBuilder<Fqn, Types> = {
    //   title(title) {
    //     element.title = title
    //     return elBuilder
    //   },
    //   techology(techology) {
    //     element.technology = techology
    //     return elBuilder
    //   },
    //   description(description) {
    //     element.description = description
    //     return elBuilder
    //   },
    //   style({
    //     color,
    //     icon,
    //     shape,
    //     ...style
    //   }) {
    //     Object.assign(element, color && { color }, icon && { icon }, shape && { shape }, {
    //       style: {
    //         ...element.style,
    //         ...omitBy(style, isNullish)
    //       }
    //     })
    //     return elBuilder
    //   },
    //   rel(target, props) {
    //     builder.relationship(parentId, target, props)
    //     return elBuilder
    //   },
    //   ...mapValues(spec.elements, (spec, kind) => {
    //     return (_id: Fqn, props?: string | Types['ElementProps'] | ((b: any) => any)) => {
    //       const id = `${parentId}.${_id}` as Fqn
    //       const properties = typeof props === 'string' ? { title: props } : isFunction(props) ? {} : (props ?? {})
    //       addElement(id, properties, kind as ElementKind, spec)
    //       if (isFunction(props)) {
    //         props(mkElementBuilder(id, builder))
    //       }
    //       return elBuilder
    //     }
    //   })
    // }
    // return elBuilder
  }

  const processViewPredicates = (view: ElementView, rules: Types['ViewPredicate'][]) => {
    for (const rule of rules) {
      if ((rule as string).startsWith('include ')) {
        view.rules.push({
          include: [
            $expr<Types>((rule as string).substring('include '.length) as any) as C4Expression
          ]
        })
        continue
      }
      if ((rule as string).startsWith('exclude ')) {
        view.rules.push({
          exclude: [
            $expr<Types>((rule as string).substring('exclude '.length) as any) as C4Expression
          ]
        })
        continue
      }
      throw new Error(`Invalid rule: ${rule}`)
    }
  }

  const modelBuilder: LikeC4ModelBuilder<Types> = {
    get Types(): Types {
      throw new Error('Types are not available in runtime')
    },
    // model: mapValues(spec.elements, (spec, kind) => {
    //   return (...args: any[]) => {
    //     return (container: any) => {
    //       return container[kind](...args)
    //     }
    //   }
    // }),
    ...mapValues(spec.elements, (spec, kind) => {
      return (id: Fqn, props?: string | Types['ElementProps'] | ((b: any) => any)) => {
        const properties = typeof props === 'string' ? { title: props } : isFunction(props) ? {} : (props ?? {})
        addElement(id, properties, kind as ElementKind, spec)
        if (isFunction(props)) {
          props(mkElementBuilder(id, modelBuilder))
        }
        return modelBuilder
      }
    }),
    relationship: (source, target, _props?: string | Types['RelationProps']) => {
      const sourceEl = ensureElement(source)
      const targetEl = ensureElement(target)
      invariant(
        !isSameHierarchy(sourceEl, targetEl),
        'Cannot create relationship between elements in the same hierarchy'
      )
      const {
        title = '',
        links: _links = [],
        ...props
      } = typeof _props === 'string' ? { title: _props } : pickBy({ ..._props }, isNonNullish)
      const links = _links.map(l => (typeof l === 'string' ? { url: l } : l))
      relations.push({
        id: `rel${relations.length + 1}` as RelationID,
        source,
        target,
        title,
        ...(isNonEmptyArray(links) && { links }),
        ...props
      })
      return modelBuilder
    },
    rel: (source, target, _props?: string | Types['RelationProps']) => {
      return modelBuilder.relationship(source, target, _props)
    },
    view: (id, rules) => {
      if (views.has(id)) {
        throw new Error(`View with ID ${id} already exists`)
      }
      const view = {
        ...emptyView,
        id: id as any
      }
      views.set(id, view)
      if (isFunction(rules)) {
        rules(mkElementViewBuilder(view))
      } else {
        processViewPredicates(view, isArray(rules) ? rules : [rules])
      }

      return modelBuilder
    },
    viewOf: (id, viewOf, rules) => {
      if (views.has(id)) {
        throw new Error(`View with ID ${id} already exists`)
      }
      const view = {
        ...emptyView,
        viewOf,
        id: id as any
      }
      views.set(id, view)
      if (isFunction(rules)) {
        rules(mkElementViewBuilder(view))
      } else {
        processViewPredicates(view, isArray(rules) ? rules : [rules])
      }

      return modelBuilder
    },
    clone: () =>
      mkLikeC4ModelBuilder(
        spec,
        structuredClone(elements),
        structuredClone(relations),
        structuredClone(views)
      ) as any,
    build: () => ({
      specification: {
        tags: (spec.tags ?? []) as Tag[],
        elements: spec.elements as any,
        relationships: {}
      },
      elements: fromEntries(elements.entries().toArray()) as any,
      relations: mapToObj(relations, r => [r.id, r]),
      views: {}
    })
  }

  return modelBuilder as any
}

export function LikeC4ModelBuilder<const Spec extends Specification>(
  spec: Spec
): EmptyLikeC4ModelBuilder<TypesFromSpecification<Spec>> {
  return mkLikeC4ModelBuilder(spec) as any
}
