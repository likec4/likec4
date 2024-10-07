import defu from 'defu'
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
import type { IfNever, IsStringLiteral, LiteralUnion, Writable } from 'type-fest'
import { invariant, nonNullable } from '../errors'
import {
  type AutoLayoutDirection,
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
  type Relation,
  type RelationID,
  type RelationshipKind,
  type Tag,
  type ViewID,
  type ViewRule,
  type ViewRuleStyle
} from '../types'
import { isNonEmptyArray, isSameHierarchy, nameFromFqn, parentFqn } from '../utils'
import type { AnyTypesHook, Specification, TypesFromSpecification, TypesHook, Warn, WithModelMethod } from './_types'
import { $expr } from './view-ops'

// interface WithNewElement<Types extends AnyTypesHook> {
//   <const Id extends string>(id: Id, titleOrProps?: string | Types['ElementProps']): LikeC4ModelBuilder<
//     TypesHook<
//       Types['ElementKind'],
//       Types['RelationshipKind'],
//       Types['Tag'],
//       Types['MetadataKey'],
//       Id | Types['Fqn'],
//       Types['ViewId']
//     >
//   >
//   <const Id extends string, TypesFromBuilder extends AnyTypesHook>(
//     id: Id,
//     builder: (
//       builder: ElementBuilder<
//         Id,
//         TypesHook<
//           Types['ElementKind'],
//           Types['RelationshipKind'],
//           Types['Tag'],
//           Types['MetadataKey'],
//           Id | Types['Fqn'],
//           Types['ViewId']
//         >
//       >
//     ) => ElementBuilder<Id, TypesFromBuilder>
//   ): LikeC4ModelBuilder<TypesFromBuilder>
// }

type ElementBuilder<
  Id extends string,
  Types extends AnyTypesHook
> =
  & {
    // readonly id: Id
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
    [Kind in Types['ElementKind']]: ElementBuilder.AddNestedElement<Id, Types>
  }

namespace ElementBuilder {
  export interface AddNestedElement<
    Parent extends string,
    Type extends AnyTypesHook
  > {
    <const Id extends string, TypesFromBuilder extends AnyTypesHook>(
      id: Id,
      builder: (
        builder: ElementBuilder<
          `${Parent}.${Id}`,
          TypesHook.AddFqn<Type, `${Parent}.${Id}`>
        > // TypesHook<
        //   Types['ElementKind'],
        //   Types['RelationshipKind'],
        //   Types['Tag'],
        //   Types['MetadataKey'],
        //   `${Parent}.${Id}` | Types['Fqn'],
        //   Types['ViewId']
        // >
      ) => ElementBuilder<`${Parent}.${Id}`, TypesFromBuilder>
    ): ElementBuilder<Parent, TypesFromBuilder>
    <const Id extends string>(id: Id, titleOrProps?: string | Type['ElementProps']): ElementBuilder<
      Parent,
      TypesHook.AddFqn<Type, `${Parent}.${Id}`>
    >
  }
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

interface AddNewView<Type extends AnyTypesHook> {
  <const Id extends string>(
    id: Warn<Id, Type['ViewId']>,
    predicates:
      | Type['ViewPredicate']
      | [Type['ViewPredicate'], ...Type['ViewPredicate'][]]
      | ((v: ViewBuilder<Type>) => ViewBuilder<Type>)
  ): LikeC4ModelBuilder<
    TypesHook<
      Type['ElementKind'],
      Type['RelationshipKind'],
      Type['Tag'],
      Type['MetadataKey'],
      Type['Fqn'],
      Id | Type['ViewId']
    >
  >
}

interface AddNewViewOf<Type extends AnyTypesHook> {
  <const Id extends string>(
    id: Warn<Id, Type['ViewId']>,
    viewOf: Type['Fqn'],
    predicates:
      | Type['ViewPredicate']
      | [Type['ViewPredicate'], ...Type['ViewPredicate'][]]
      | ((v: ViewBuilder<Type>) => ViewBuilder<Type>)
  ): LikeC4ModelBuilder<
    TypesHook<
      Type['ElementKind'],
      Type['RelationshipKind'],
      Type['Tag'],
      Type['MetadataKey'],
      Type['Fqn'],
      Id | Type['ViewId']
    >
  >
}

interface InvalidBuilder<Error extends string> {
  error: Error
}

interface AddElement<Type extends AnyTypesHook> {
  <
    const Id extends string,
    TypesFromBuilder extends AnyTypesHook
  >(
    id: Warn<Id, Type['Fqn']>,
    builder: (builder: ElementBuilder<Id, TypesHook.AddFqn<Type, Id>>) => ElementBuilder<Id, TypesFromBuilder>
  ): LikeC4ModelBuilder<TypesFromBuilder>

  <const Id extends string>(
    id: Warn<Id, Type['Fqn']>,
    titleOrProps?: string | Type['ElementProps']
  ): LikeC4ModelBuilder<TypesHook.AddFqn<Type, Id>>
}

export type WithModelMethods<Type extends AnyTypesHook> =
  & WithModelMethod<Type>
  & {
    [Kind in Type['ElementKind']]: AddElement<Type>
    // // Variant 1
    // <const Id extends string>(
    //   id: Warn<Id, Types['Fqn']>,
    //   titleOrProps?: string | Types['ElementProps']
    // ): LikeC4ModelBuilder<TypesHook.AddFqn<Types, Id>>
    // // Variant 1
  }
  & {
    modelFunctions(): ModelFunctions<Type>
  }

export type EmptyLikeC4ModelBuilder<Types extends AnyTypesHook> = WithModelMethods<Types> & {
  clone(): EmptyLikeC4ModelBuilder<Types>
}

export type ValidLikeC4ModelBuilder<T extends AnyTypesHook> = IfNever<
  T['ElementKind'],
  InvalidBuilder<'No Element kinds'>,
  EmptyLikeC4ModelBuilder<T>
>

interface AddRelationship<T extends AnyTypesHook> {
  <Id extends T['Fqn']>(
    source: Id,
    target: Id,
    titleOrProps?: string | T['RelationProps']
  ): LikeC4ModelBuilder<T>
}

export type LikeC4ModelBuilder<Type extends AnyTypesHook> =
  & WithModelMethods<Type>
  & {
    readonly Types: Type
    relationship: AddRelationship<Type>
    // _𐙤_: (
    //   source: Types['Fqn'],
    //   target: Types['Fqn'],
    //   props?: string | Types['RelationProps']
    // ) => LikeC4ModelBuilder<Types>
    rel: AddRelationship<Type>
    view: AddNewView<Type>
    viewOf: AddNewViewOf<Type>
    clone(): LikeC4ModelBuilder<Type>
    build(): TypesHook.ToParsedLikeC4Model<Type>
  }

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

function newBuilder<const Spec extends Specification>(
  spec: Spec,
  elements = new Map<string, Element>(),
  relations = [] as Relation[],
  views = new Map<string, ElementView>()
): LikeC4ModelBuilder<TypesFromSpecification<Spec>> {
  type Types = TypesHook<ElementKind, RelationshipKind, Tag, string, Fqn, ViewID>

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

  const mkViewBuilder = (view: Writable<ElementView>): ViewBuilder<Types> => {
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
      title(title: string) {
        view.title = title
        return viewBuilder
      },
      description(description: string) {
        view.description = description
        return viewBuilder
      }
    }
    return viewBuilder
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

  const toLikeC4Specification = (): TypesHook.ToParsedLikeC4Model<Types>['specification'] => ({
    tags: (spec.tags ?? []) as Tag<Types['Tag']>[],
    elements: {
      ...spec.elements as any
    },
    relationships: {
      ...spec.relationships
    }
  })

  const modelFunctions = () => {
    return mapValues(spec.elements, (_spec, kind) => (...args: any[]) => (builder: any) => {
      const fn = builder[kind]
      invariant(isFunction(fn), `Builder does not have method ${kind}`)
      return fn.call(builder, args)
    })
  }

  const modelBuilder: LikeC4ModelBuilder<AnyTypesHook> = {
    get Types(): AnyTypesHook {
      throw new Error('Types are not available in runtime')
    },
    model(...ops: Array<(input: any) => any>) {
      if (ops.length === 0) {
        return modelBuilder
      }
      return ops.reduce((acc, op) => op(acc), modelBuilder) as any
    },
    modelFunctions,
    // nestedModelFunctions: modelFunctions,
    // elementKinds: () => keys(spec.elements) as any,
    // model: mapValues(spec.elements, (spec, kind) => {
    //   return (...args: any[]) => {
    //     return (container: any) => {
    //       return container[kind](...args)
    //     }
    //   }
    // }),
    ...mapValues(spec.elements, (spec, kind) => {
      return (id: Fqn, props?: string | AnyTypesHook['ElementProps'] | ((b: unknown) => any)) => {
        const properties = typeof props === 'string' ? { title: props } : isFunction(props) ? {} : (props ?? {})
        addElement(id, properties, kind as ElementKind, spec)
        if (isFunction(props)) {
          props(mkElementBuilder(id, modelBuilder))
        }
        return modelBuilder
      }
    }),
    relationship(source, target, _props?: string | AnyTypesHook['RelationProps']) {
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
    rel: (source, target, _props?: string | AnyTypesHook['RelationProps']) => {
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
        rules(mkViewBuilder(view))
      } else {
        processViewPredicates(view, isArray(rules) ? rules : [rules])
      }

      return modelBuilder
    },
    viewOf: (id, viewOf, rules) => {
      if (views.has(id)) {
        throw new Error(`View with ID ${id} already exists`)
      }
      if (!elements.has(viewOf)) {
        throw new Error(`Element with ID ${viewOf} does not exist`)
      }
      const view = {
        ...emptyView,
        viewOf: viewOf as Fqn,
        id: id as any
      }
      views.set(id, view)
      if (isFunction(rules)) {
        rules(mkViewBuilder(view))
      } else {
        processViewPredicates(view, isArray(rules) ? rules : [rules])
      }

      return modelBuilder
    },
    clone: () =>
      newBuilder(
        structuredClone(spec),
        structuredClone(elements),
        structuredClone(relations),
        structuredClone(views)
      ) as any,
    build: () => ({
      specification: toLikeC4Specification(),
      elements: fromEntries(elements.entries().toArray()) as any,
      relations: mapToObj(relations, r => [r.id, r]),
      views: fromEntries(views.entries().toArray()) as any
    })
  }

  return modelBuilder as any
}

export function LikeC4ModelBuilder<const Spec extends Specification>(
  spec: Spec
): ValidLikeC4ModelBuilder<TypesFromSpecification<Spec>> {
  return newBuilder(
    defu(
      spec,
      {
        elements: {},
        relationships: {}
      } satisfies Specification
    )
  ) as any
}

interface NewElementCurried<Id extends string> {
  <A extends AnyTypesHook>(input: LikeC4ModelBuilder<A>): LikeC4ModelBuilder<TypesHook.AddFqn<A, Id>>

  // withNested<
  //   A extends AnyTypesHook,
  //   B extends AnyTypesHook
  // >(
  //   op1: (
  //     input: ElementBuilder<
  //       Id,
  //       TypesHook<
  //         A['ElementKind'],
  //         A['RelationshipKind'],
  //         A['Tag'],
  //         A['MetadataKey'],
  //         Id | A['Fqn'],
  //         A['ViewId']
  //       >
  //     >
  //   ) => ElementBuilder<Id, B>
  // ): (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<B>

  // withNested<
  //   A extends AnyTypesHook,
  //   B extends AnyTypesHook,
  //   C extends AnyTypesHook,
  // >(
  //   op1: (
  //     input: ElementBuilder<
  //       Id,
  //       TypesHook<
  //         A['ElementKind'],
  //         A['RelationshipKind'],
  //         A['Tag'],
  //         A['MetadataKey'],
  //         Id | A['Fqn'],
  //         A['ViewId']
  //       >
  //     >
  //   ) => ElementBuilder<Id, B>,
  //   op2: (input: ElementBuilder<Id, B>) => ElementBuilder<Id, C>
  // ): (input: LikeC4ModelBuilder<A>) => LikeC4ModelBuilder<C>
}

type ModelFunctions<Types> = Types extends TypesHook<infer E, any, any, any, any, any> ? (
    IsStringLiteral<E> extends true ? ({
        [Kind in E]: <const Id extends string>(id: Id, title?: string | Types['ElementProps']) => NewElementCurried<Id>
      })
      : {}
  )
  : never
// {
// [Kind in Types['ElementKind']]:
//   // applied to the builder
//   <const Id extends string>(
//     id: Id,
//     title?: string | Types['ElementProps']
//   ) => NewElementCurried<Id>
// | (<const Id extends string, A extends AnyTypesHook, Parent extends string>(
//   id: Id,
//   title?: string
// ) => (input: ElementBuilder<Parent, A>) => ElementBuilder<
//   Parent,
//   TypesHook<
//     A['ElementKind'],
//     A['RelationshipKind'],
//     A['Tag'],
//     A['MetadataKey'],
//     `${Parent}.${Id}` | A['Fqn'],
//     A['ViewId']
//   >
// >)
// applied to the element builder
// | (<Parent extends string>(input: ElementBuilder<Parent, A>) => ElementBuilder<Parent,
//   TypesHook<
//     A['ElementKind'],
//     A['RelationshipKind'],
//     A['Tag'],
//     A['MetadataKey'],
//     `${Parent}.${Id}` | A['Fqn'],
//     A['ViewId']
//   >
// >)
// | // applied to the builder
// ()
// }
