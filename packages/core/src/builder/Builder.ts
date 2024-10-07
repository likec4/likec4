import defu from 'defu'
import { fromEntries, hasAtLeast, isFunction, isNonNullish, map, mapToObj, mapValues, pickBy } from 'remeda'
import type { Writable } from 'type-fest'
import { invariant } from '../errors'
import {
  type Color,
  DefaultElementShape,
  DefaultThemeColor,
  type Element,
  type ElementShape,
  type ElementView,
  type Fqn,
  type IconUrl,
  isScopedElementView,
  type LikeC4View,
  type Link,
  type NonEmptyArray,
  type Relation,
  type RelationID,
  type Tag
} from '../types'
import type { ParsedLikeC4Model } from '../types/model'
import { isSameHierarchy, nameFromFqn, parentFqn } from '../utils/fqn'
import type { AnyTypes, BuilderSpecification, Types } from './_types'
import type { AddElement, AddElementHelpers } from './Builder.element'
import { type ModelBuilder, type ModelHelpers } from './Builder.model'
import {
  $autoLayout,
  $exclude,
  $expr,
  $include,
  $rules,
  $style,
  type ViewBuilder,
  type ViewHelpers,
  type ViewRuleBuilderOp
} from './Builder.view'
import { type ViewsBuilder } from './Builder.views'

export interface Builder<T extends AnyTypes> {
  /**
   * Only available in compile time
   */
  readonly Types: T

  clone(): Builder<T>

  /**
   * Builders for each element kind
   */
  helpers(): {
    model: ModelHelpers<T>
    views: ViewHelpers<T['NewViewProps']>
  }

  __model(): ModelBuilder<T>
  __views(): ViewsBuilder<T>

  build(): ParsedLikeC4Model<
    T['ElementKind'],
    T['RelationshipKind'],
    T['Tag'],
    T['Fqn'],
    T['ViewId']
  >

  with<
    A extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>
  ): Builder<A>

  with<
    A extends AnyTypes,
    B extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>
  ): Builder<B>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>
  ): Builder<C>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>
  ): Builder<D>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>
  ): Builder<E>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>
  ): Builder<F>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>
  ): Builder<G>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>
  ): Builder<H>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes,
    I extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>
  ): Builder<I>

  with<
    A extends AnyTypes,
    B extends AnyTypes,
    C extends AnyTypes,
    D extends AnyTypes,
    E extends AnyTypes,
    F extends AnyTypes,
    G extends AnyTypes,
    H extends AnyTypes,
    I extends AnyTypes,
    J extends AnyTypes
  >(
    op1: (input: Builder<T>) => Builder<A>,
    op2: (input: Builder<A>) => Builder<B>,
    op3: (input: Builder<B>) => Builder<C>,
    op4: (input: Builder<C>) => Builder<D>,
    op5: (input: Builder<D>) => Builder<E>,
    op6: (input: Builder<E>) => Builder<F>,
    op7: (input: Builder<F>) => Builder<G>,
    op8: (input: Builder<G>) => Builder<H>,
    op9: (input: Builder<H>) => Builder<I>,
    op10: (input: Builder<I>) => Builder<J>
  ): Builder<J>
}

function builder<Spec extends BuilderSpecification, T extends AnyTypes>(
  spec: Spec,
  _elements = new Map<string, Element>(),
  _relations = [] as Relation[],
  _views = new Map<string, LikeC4View>()
): Builder<T> {
  const toLikeC4Specification = (): Types.ToParsedLikeC4Model<T>['specification'] => ({
    tags: (spec.tags ?? []) as Tag<T['Tag']>[],
    elements: {
      ...spec.elements as any
    },
    relationships: {
      ...spec.relationships
    }
  })

  const mapLinks = (links?: Array<string | { title?: string; url: string }>): NonEmptyArray<Link> | null => {
    if (!links || !hasAtLeast(links, 1)) {
      return null
    }
    return map(links, l => (typeof l === 'string' ? { url: l } : l))
  }

  const mkViewBuilder = (view: Writable<ElementView>): ViewBuilder<T> => {
    const viewBuilder: ViewBuilder<T> = {
      autoLayout(autoLayout) {
        view.rules.push({
          direction: autoLayout
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
      }
      // title(title: string) {
      //   view.title = title
      //   return viewBuilder
      // },
      // description(description: string) {
      //   view.description = description
      //   return viewBuilder
      // }
    }
    return viewBuilder
  }

  const self: Builder<T> = {
    get Types(): T {
      throw new Error('Types are not available in runtime')
    },
    clone: () =>
      builder(
        structuredClone(spec),
        structuredClone(_elements),
        structuredClone(_relations),
        structuredClone(_views)
      ),
    __model: () => ({
      addElement: (element) => {
        const parent = parentFqn(element.id)
        if (parent) {
          invariant(
            _elements.get(parent),
            `Parent element with id "${parent}" not found for element with id "${element.id}"`
          )
        }
        if (_elements.has(element.id)) {
          throw new Error(`Element with id "${element.id}" already exists`)
        }
        _elements.set(element.id, element)
        return self
      },
      addRelation(relation) {
        const sourceEl = _elements.get(relation.source)
        invariant(sourceEl, `Element with id "${relation.source}" not found`)
        const targetEl = _elements.get(relation.target)
        invariant(targetEl, `Element with id "${relation.target}" not found`)
        invariant(
          !isSameHierarchy(sourceEl, targetEl),
          'Cannot create relationship between elements in the same hierarchy'
        )
        _relations.push({
          id: `rel${_relations.length + 1}` as RelationID,
          ...relation
        })
        return self
      },
      /**
       * Fully qualified name for nested elements
       */
      fqn(id) {
        return id as Fqn
      },
      addSourcelessRelation() {
        throw new Error('Can be called only in nested model')
      }
    }),
    __views: () => ({
      addView: (view) => {
        if (isScopedElementView(view)) {
          invariant(_elements.get(view.viewOf), `Invalid view ${view.id}, wlement with id "${view.viewOf}" not found`)
        }
        _views.set(view.id, view)
        return self
      }
    }),
    build: () => ({
      specification: toLikeC4Specification(),
      elements: fromEntries(Array.from(_elements.entries())) as any,
      relations: mapToObj(_relations, r => [r.id, r]),
      views: fromEntries(Array.from(_views.entries())) as any
    }),
    helpers: () => ({
      model: {
        model: (...ops: ((b: ModelBuilder<T>) => ModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            const v = b.__model()
            for (const op of ops) {
              op(v)
            }
            return b
          }
        },
        rel: (source: string, target: string, _props?: T['NewRelationshipProps'] | string) => {
          return <T extends AnyTypes>(b: ModelBuilder<T>) => {
            const {
              title = '',
              links: _links = [],
              ...props
            } = defu(
              typeof _props === 'string' ? { title: _props } : { ..._props },
              { title: null, links: null }
            )
            // const {
            //   title = '',
            //   links: _links = [],
            //   ...props
            // } = typeof _props === 'string' ? { title: _props } : pickBy({ ..._props }, isNonNullish)
            const links = mapLinks(_links)
            b.addRelation({
              source: source as any,
              target: target as any,
              title,
              ...(links && { links }),
              ...props
            })
            return b
          }
        },
        relTo: (target, _props?) => {
          return <T extends AnyTypes>(b: ModelBuilder<T>) => {
            const {
              title = '',
              links: _links = [],
              ...props
            } = defu(
              typeof _props === 'string' ? { title: _props } : { ..._props },
              { title: null, links: null }
            )
            const links = mapLinks(_links)
            b.addSourcelessRelation({
              target,
              title,
              ...(links && { links }),
              ...props
            })
            return b
          }
        },
        ...mapValues(
          spec.elements,
          ({ style: specStyle, ...spec }, kind) =>
          <Id extends string>(
            id: Id,
            _props?: T['NewElementProps'] | string
          ): AddElement<Id> => {
            const add = (<T extends AnyTypes>(b: ModelBuilder<T>) => {
              const {
                links: _links,
                icon: _icon,
                style,
                title,
                ...props
              } = typeof _props === 'string' ? { title: _props } : { ..._props }

              const links = mapLinks(_links)

              const icon = _icon ?? specStyle?.icon

              const _id = b.fqn(id)

              b.addElement({
                id: _id,
                kind: kind as any,
                title: title ?? nameFromFqn(_id),
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
                ...props
              })
              return b
            }) as AddElement<Id>

            add.with = (...ops: Array<(input: ModelBuilder<any>) => ModelBuilder<any>>) => (b: ModelBuilder<any>) => {
              add(b)
              const v: ModelBuilder<any> = {
                ...b,
                fqn: (child) => `${b.fqn(id)}.${child}` as Fqn,
                addSourcelessRelation: (relation) => {
                  return b.addRelation({
                    ...relation,
                    source: b.fqn(id)
                  })
                }
              }
              for (const op of ops) {
                op(v)
              }
              return b
            }
            return add
          }
        ) as AddElementHelpers<T>
      },
      views: {
        views: (...ops: ((b: ViewsBuilder<T>) => ViewsBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            const v = b.__views()
            for (const op of ops) {
              op(v)
            }
            return b
          }
        },
        view: (id, _props, builder?: ViewRuleBuilderOp<T>) => {
          if (isFunction(_props)) {
            builder = _props
            _props = {}
          }
          return <T extends AnyTypes>(b: ViewsBuilder<T>): ViewsBuilder<T> => {
            const {
              links: _links = [],
              title = null,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }

            const links = mapLinks(_links)

            const view: Writable<ElementView> = {
              id: id as any,
              __: 'element',
              title,
              description: null,
              tags: null,
              rules: [],
              links,
              customColorDefinitions: {},
              ...props
            }
            b.addView(view)

            if (builder) {
              builder(mkViewBuilder(view))
            }

            return b
          }
        },
        viewOf: (
          id,
          viewOf,
          _props?: T['NewViewProps'] | string | ViewRuleBuilderOp<T>,
          builder?: ViewRuleBuilderOp<T>
        ) => {
          if (isFunction(_props)) {
            builder = _props
            _props = {}
          }
          return <T extends AnyTypes>(b: ViewsBuilder<T>): ViewsBuilder<T> => {
            const {
              links: _links = [],
              title = null,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }

            const links = mapLinks(_links)

            const view: Writable<ElementView> = {
              id: id as any,
              __: 'element',
              viewOf,
              title,
              description: null,
              tags: null,
              rules: [],
              links,
              customColorDefinitions: {},
              ...props
            }
            b.addView(view)

            if (builder) {
              builder(mkViewBuilder(view))
            }

            return b
          }
        },
        $autoLayout,
        $exclude,
        $expr,
        $include,
        $rules,
        $style
      }
    }),
    with: (...ops: ((b: Builder<T>) => Builder<T>)[]) => {
      return ops.reduce((b, op) => op(b), self).clone()
    }
  }

  return self
}

export namespace Builder {
  export function forSpecification<const Spec extends BuilderSpecification>(
    spec: Spec
  ): {
    builder: Builder<Types.FromSpecification<Spec>>
    model: ModelHelpers<Types.FromSpecification<Spec>>
    views: ViewHelpers<Types.FromSpecification<Spec>['NewViewProps']>
  } {
    const b = builder<Spec, Types.FromSpecification<Spec>>(spec)
    return {
      ...b.helpers(),
      builder: b
    }
  }
}
