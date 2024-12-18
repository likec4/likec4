import defu from 'defu'
import { fromEntries, hasAtLeast, isFunction, isNonNullish, isNullish, map, mapToObj, mapValues, pickBy } from 'remeda'
import type { Writable } from 'type-fest'
import { computeViews } from '../compute-view'
import { invariant } from '../errors'
import { LikeC4Model } from '../model/LikeC4Model'
import {
  type Color,
  DefaultElementShape,
  DefaultThemeColor,
  DeploymentElement,
  type DeploymentRelation,
  type DeploymentView,
  type Element,
  type ElementShape,
  type ElementView,
  type Fqn,
  type IconUrl,
  isScopedElementView,
  type LikeC4View,
  type Link,
  type ModelGlobals,
  type ModelRelation,
  type NonEmptyArray,
  type RelationId,
  type Tag,
} from '../types'
import type { ParsedLikeC4Model } from '../types/model'
import { isSameHierarchy, nameFromFqn, parentFqn } from '../utils/fqn'
import type { AnyTypes, BuilderSpecification, Types } from './_types'
import type { AddDeploymentNode } from './Builder.deployment'
import type {
  AddDeploymentNodeHelpers,
  DeloymentModelBuildFunction,
  DeloymentModelHelpers,
  DeploymentModelBuilder,
} from './Builder.deploymentModel'
import type { AddElement } from './Builder.element'
import type { AddElementHelpers, ModelBuilder, ModelBuilderFunction, ModelHelpers } from './Builder.model'
import { $autoLayout, $exclude, $include, $rules, $style } from './Builder.view-common'
import type { DeploymentRulesBuilderOp } from './Builder.view-deployment'
import type { ElementViewRulesBuilder } from './Builder.view-element'
import { mkViewBuilder, type ViewsBuilder, type ViewsBuilderFunction, type ViewsHelpers } from './Builder.views'
import type { BuilderMethods } from './Builder.with'

export interface Builder<T extends AnyTypes> extends BuilderMethods<T> {
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
    views: ViewsHelpers
    deployment: DeloymentModelHelpers<T>
  }

  model<Out extends AnyTypes>(
    callback: ModelBuilderFunction<T, Out>,
  ): Builder<Out>

  deployment<Out extends AnyTypes>(
    callback: DeloymentModelBuildFunction<T, Out>,
  ): Builder<Out>

  views<Out extends AnyTypes>(
    callback: ViewsBuilderFunction<T, Out>,
  ): Builder<Out>

  /**
   * Returns model as result of parsing only
   * Views are not computed or layouted
   * {@link toLikeC4Model} should be used to get model with computed views
   */
  build(): Types.ToParsedLikeC4Model<T>

  /**
   * Returns model with computed views
   */
  toLikeC4Model(): Types.ToLikeC4Model<T>
}

interface Internals<T extends AnyTypes> extends ViewsBuilder<T>, ModelBuilder<T>, DeploymentModelBuilder<T> {
}

type Op<T> = (b: T) => T

function builder<Spec extends BuilderSpecification, T extends AnyTypes>(
  spec: Spec,
  _elements = new Map<string, Element>(),
  _relations = [] as ModelRelation[],
  _views = new Map<string, LikeC4View>(),
  _globals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {},
  } as ModelGlobals,
  _deployments = new Map<string, DeploymentElement>(),
  _deploymentRelations = [] as DeploymentRelation[],
): Builder<T> {
  const toLikeC4Specification = (): Types.ToParsedLikeC4Model<T>['specification'] => ({
    elements: {
      ...structuredClone(spec.elements) as any,
    },
    deployments: {
      ...structuredClone(spec.deployments) as any,
    },
    relationships: {
      ...structuredClone(spec.relationships) as any,
    },
    tags: (spec.tags ?? []) as Tag<T['Tag']>[],
  })

  const mapLinks = (links?: Array<string | { title?: string; url: string }>): NonEmptyArray<Link> | null => {
    if (!links || !hasAtLeast(links, 1)) {
      return null
    }
    return map(links, l => (typeof l === 'string' ? { url: l } : l))
  }

  const createGenericView = <B extends Op<any> | undefined>(
    id: string,
    _props: T['NewViewProps'] | string | B | null,
    builder: B,
  ): [Omit<LikeC4View, 'rules'>, B] => {
    if (isFunction(_props)) {
      builder = _props as B
      _props = {}
    }
    _props ??= {}
    const {
      links: _links = [],
      title = null,
      description = null,
      tags = null,
      ...props
    } = typeof _props === 'string' ? { title: _props } : { ..._props }

    const links = mapLinks(_links)
    return [{
      id: id as any,
      title,
      description,
      tags,
      links,
      customColorDefinitions: {},
      ...props,
    }, builder]
  }

  const self: Builder<T> & Internals<T> = {
    get Types(): T {
      throw new Error('Types are not available in runtime')
    },
    clone: () => {
      return builder(
        structuredClone(spec),
        structuredClone(_elements),
        structuredClone(_relations),
        structuredClone(_views),
        structuredClone(_globals),
        structuredClone(_deployments),
        structuredClone(_deploymentRelations),
      )
    },

    __addElement: (element) => {
      const parent = parentFqn(element.id)
      if (parent) {
        invariant(
          _elements.get(parent),
          `Parent element with id "${parent}" not found for element with id "${element.id}"`,
        )
      }
      if (_elements.has(element.id)) {
        throw new Error(`Element with id "${element.id}" already exists`)
      }
      _elements.set(element.id, element)
      return self
    },
    __addRelation(relation) {
      const sourceEl = _elements.get(relation.source)
      invariant(sourceEl, `Element with id "${relation.source}" not found`)
      const targetEl = _elements.get(relation.target)
      invariant(targetEl, `Element with id "${relation.target}" not found`)
      invariant(
        !isSameHierarchy(sourceEl, targetEl),
        'Cannot create relationship between elements in the same hierarchy',
      )
      _relations.push({
        id: `rel${_relations.length + 1}` as RelationId,
        ...relation,
      })
      return self
    },
    /**
     * Fully qualified name for nested elements
     */
    __fqn(id) {
      invariant(id.trim() !== '', 'Id must be non-empty')
      return id as Fqn
    },
    __addSourcelessRelation() {
      throw new Error('Can be called only in nested model')
    },
    __addView: (view) => {
      if (_views.has(view.id)) {
        throw new Error(`View with id "${view.id}" already exists`)
      }
      if (isScopedElementView(view)) {
        invariant(
          _elements.get(view.viewOf),
          `Invalid scoped view ${view.id}, wlement with id "${view.viewOf}" not found`,
        )
      }
      _views.set(view.id, view)
      return self
    },

    __addDeployment: (node: DeploymentElement) => {
      if (_deployments.has(node.id)) {
        throw new Error(`Deployment with id "${node.id}" already exists`)
      }
      const parent = parentFqn(node.id)
      if (parent) {
        invariant(
          _deployments.get(parent),
          `Parent element with id "${parent}" not found for node with id "${node.id}"`,
        )
      }
      if (DeploymentElement.isInstance(node)) {
        invariant(parent, `Instance ${node.id} of ${node.element} must be deployed under a parent node`)
        invariant(
          _elements.get(node.element),
          `Instance "${node.id}" references non-existing element "${node.element}"`,
        )
      }
      _deployments.set(node.id, node)
      return self
    },
    __addDeploymentRelation: (relation) => {
      invariant(
        !isSameHierarchy(relation.source.id, relation.target.id),
        'Cannot create relationship between elements in the same hierarchy',
      )

      invariant(
        _deployments.has(relation.source.id),
        `Relation "${relation.source.id} -> ${relation.target.id}" references non-existing source`,
      )
      invariant(
        _deployments.has(relation.target.id),
        `Relation "${relation.source.id} -> ${relation.target.id}" references non-existing target`,
      )

      _deploymentRelations.push({
        id: `deploy_rel${_deploymentRelations.length + 1}` as RelationId,
        ...relation,
      })
      return self
    },
    build: () => ({
      specification: toLikeC4Specification(),
      elements: fromEntries(
        structuredClone(
          Array.from(_elements.entries()),
        ),
      ),
      relations: mapToObj(_relations, r => [r.id, structuredClone(r)]),
      globals: structuredClone(_globals),
      deployments: {
        elements: fromEntries(
          structuredClone(
            Array.from(_deployments.entries()),
          ),
        ),
        relations: mapToObj(_deploymentRelations, r => [r.id, structuredClone(r)]),
      },
      views: fromEntries(
        structuredClone(
          Array.from(_views.entries()),
        ),
      ),
    } as any),
    toLikeC4Model: () => {
      const parsed = self.build()
      return LikeC4Model.compute(parsed)
    },
    helpers: () => ({
      model: {
        model: (...ops: ((b: ModelBuilder<T>) => ModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            return ops.reduce((b, op) => op(b), b as any as ModelBuilder<T>) as any
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
              { title: null, links: null },
            )
            const links = mapLinks(_links)
            b.__addRelation({
              source: source as any,
              target: target as any,
              title,
              ...(links && { links }),
              ...props,
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
              { title: null, links: null },
            )
            const links = mapLinks(_links)
            b.__addSourcelessRelation({
              target,
              title,
              ...(links && { links }),
              ...props,
            })
            return b
          }
        },
        ...mapValues(
          spec.elements,
          ({ style: specStyle, ...spec }, kind) =>
          <Id extends string>(
            id: Id,
            _props?: T['NewElementProps'] | string,
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

              const _id = b.__fqn(id)

              b.__addElement({
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
                  ...style,
                }, isNonNullish),
                links,
                ...icon && { icon: icon as IconUrl },
                ...spec,
                ...props,
              })
              return b
            }) as AddElement<Id>

            add.with = (...ops: Array<(input: ModelBuilder<any>) => ModelBuilder<any>>) => (b: ModelBuilder<any>) => {
              add(b)
              const { __fqn, __addSourcelessRelation } = b
              try {
                b.__fqn = (child) => `${__fqn(id)}.${child}` as Fqn,
                  b.__addSourcelessRelation = (relation) => {
                    return b.__addRelation({
                      ...relation,
                      source: __fqn(id),
                    })
                  }
                ops.reduce((b, op) => op(b), b as any as ModelBuilder<T>) as any
              } finally {
                b.__fqn = __fqn
                b.__addSourcelessRelation = __addSourcelessRelation
              }
              return b
            }

            return add
          },
        ) as AddElementHelpers<T>,
      },
      views: {
        views: (...ops: ((b: ViewsBuilder<T>) => ViewsBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            return ops.reduce((b, op) => op(b), b as any as ViewsBuilder<T>) as any
          }
        },
        view: (
          id: string,
          _props?: T['NewViewProps'] | string | ElementViewRulesBuilder<any>,
          _builder?: ElementViewRulesBuilder<any>,
        ) => {
          const [generic, builder] = createGenericView(id, _props, _builder)
          const view: Writable<ElementView> = {
            ...generic,
            __: 'element',
            rules: [],
          }

          const add = (b: ViewsBuilder<any>): ViewsBuilder<any> => {
            b.__addView(view)
            if (builder) {
              builder(mkViewBuilder(view))
            }
            return b
          }
          add.with = (...ops: ElementViewRulesBuilder<any>[]) => (b: ViewsBuilder<any>) => {
            add(b)
            const elementViewBuilder = mkViewBuilder(view)
            for (const op of ops) {
              op(elementViewBuilder)
            }
            return b
          }

          return add
        },
        viewOf: (
          id,
          viewOf: string,
          _props?: T['NewViewProps'] | string | ElementViewRulesBuilder<any>,
          _builder?: ElementViewRulesBuilder<any>,
        ) => {
          const [generic, builder] = createGenericView(id, _props, _builder)
          const view: Writable<ElementView> = {
            ...generic,
            viewOf: viewOf as Fqn,
            __: 'element',
            rules: [],
          }

          const add = (b: ViewsBuilder<any>): ViewsBuilder<any> => {
            b.__addView(view)
            if (builder) {
              builder(mkViewBuilder(view))
            }
            return b
          }

          add.with = (...ops: ElementViewRulesBuilder<any>[]) => (b: ViewsBuilder<any>) => {
            add(b)
            const elementViewBuilder = mkViewBuilder(view)
            for (const op of ops) {
              op(elementViewBuilder)
            }
            return b
          }

          return add
        },

        deploymentView: (
          id: string,
          _props?: T['NewViewProps'] | string | DeploymentRulesBuilderOp<any>,
          _builder?: DeploymentRulesBuilderOp<any>,
        ) => {
          const [generic, builder] = createGenericView(id, _props, _builder)
          const view: Writable<DeploymentView> = {
            ...generic,
            __: 'deployment',
            rules: [],
          }

          const add = (b: ViewsBuilder<any>): ViewsBuilder<any> => {
            b.__addView(view)
            if (builder) {
              builder(mkViewBuilder(view))
            }
            return b
          }

          add.with = (...ops: DeploymentRulesBuilderOp<any>[]) => (b: ViewsBuilder<any>) => {
            add(b)
            const elementViewBuilder = mkViewBuilder(view)
            for (const op of ops) {
              op(elementViewBuilder)
            }
            return b
          }

          return add
        },
        $autoLayout,
        $exclude,
        $include,
        $rules,
        $style,
      },
      deployment: {
        deployment: (...ops: ((b: DeploymentModelBuilder<T>) => DeploymentModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            return ops.reduce((b, op) => op(b), b as any as DeploymentModelBuilder<T>) as any
          }
        },
        instanceOf: (
          id: string,
          target?: string | T['NewDeploymentNodeProps'],
          _props?: string | T['NewDeploymentNodeProps'],
        ) => {
          return <T extends AnyTypes>(
            b: DeploymentModelBuilder<T>,
          ): DeploymentModelBuilder<Types.AddDeploymentFqn<T, any>> => {
            if (isNullish(target)) {
              target = id
              id = nameFromFqn(id)
            } else if (typeof target === 'string') {
              _props ??= {}
            } else {
              _props = target
              target = id
              id = nameFromFqn(id)
            }
            const {
              links,
              title,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }
            const _id = b.__fqn(id)
            invariant(_elements.has(target), `Target element with id "${target}" not found`)
            b.__addDeployment({
              id: _id,
              element: target as any,
              ...title && { title },
              ...links && { links: mapLinks(links) },
              ...props,
            })
            return b as any
          }
        },
        rel: (source: string, target: string, _props?: T['NewRelationshipProps'] | string) => {
          return <T extends AnyTypes>(b: DeploymentModelBuilder<T>) => {
            const {
              title,
              links,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }

            b.__addDeploymentRelation({
              source: {
                id: source as any,
              },
              target: {
                id: target as any,
              },
              ...title && { title },
              ...links && { links: mapLinks(links) },
              ...props,
            })
            return b
          }
        },
        ...mapValues(
          spec.deployments ?? {},
          ({ style: specStyle, ...spec }, kind) =>
          <Id extends string>(
            id: Id,
            _props?: T['NewDeploymentNodeProps'] | string,
          ): AddDeploymentNode<Id> => {
            const add = (<T extends AnyTypes>(b: DeploymentModelBuilder<T>) => {
              const {
                links,
                icon: _icon,
                style,
                title,
                ...props
              } = typeof _props === 'string' ? { title: _props } : { ..._props }

              const icon = _icon ?? specStyle?.icon

              const _id = b.__fqn(id)

              b.__addDeployment({
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
                  ...style,
                }, isNonNullish),
                ...links && { links: mapLinks(links) },
                ...icon && { icon: icon as IconUrl },
                ...spec,
                ...props,
              })
              return b
            }) as AddDeploymentNode<Id>

            add.with =
              (...ops: Array<(input: DeploymentModelBuilder<any>) => DeploymentModelBuilder<any>>) =>
              (b: DeploymentModelBuilder<any>) => {
                add(b)
                const { __fqn } = b
                try {
                  b.__fqn = (child) => `${__fqn(id)}.${child}` as Fqn,
                    ops.reduce((b, op) => op(b), b as any as DeploymentModelBuilder<T>) as any
                } finally {
                  b.__fqn = __fqn
                }
                return b
              }
            return add
          },
        ) as AddDeploymentNodeHelpers<T>,
      },
    } as {
      model: ModelHelpers<T>
      views: ViewsHelpers
      deployment: DeloymentModelHelpers<T>
    }),
    with: (...ops: ((b: Builder<T>) => Builder<T>)[]) => {
      return ops.reduce((b, op) => op(b), self as Builder<T>).clone()
    },
    model: <Out extends AnyTypes>(cb: ModelBuilderFunction<T, Out>) => {
      const helpers = self.helpers().model
      const _ = helpers.model as any
      return cb({ ...helpers, _ }, _)(self as Internals<T>) as any
    },
    deployment: <Out extends AnyTypes>(cb: DeloymentModelBuildFunction<T, Out>) => {
      const helpers = self.helpers().deployment
      const _ = helpers.deployment as any
      return cb({ ...helpers, _ }, _)(self as Internals<T>) as any
    },
    views: <Out extends AnyTypes>(cb: ViewsBuilderFunction<T, Out>) => {
      const helpers = self.helpers().views
      return cb({
        ...helpers,
        _: helpers.views as any,
      } as any, helpers.views as any)(self as Internals<T>) as any
    },
  }

  return self
}

export namespace Builder {
  export type Any = Builder<AnyTypes>

  export function forSpecification<const Spec extends BuilderSpecification>(
    spec: Spec,
  ): {
    builder: Builder<Types.FromSpecification<Spec>>
    model: ModelHelpers<Types.FromSpecification<Spec>>
    deployment: DeloymentModelHelpers<Types.FromSpecification<Spec>>
    views: ViewsHelpers
  } {
    const b = builder<Spec, Types.FromSpecification<Spec>>(spec)
    return {
      ...b.helpers(),
      builder: b,
    }
  }

  export function specification<const Spec extends BuilderSpecification>(
    spec: Spec,
  ): Builder<Types.FromSpecification<Spec>> {
    return builder<Spec, Types.FromSpecification<Spec>>(spec)
  }
}
