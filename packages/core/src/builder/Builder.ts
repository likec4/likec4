import defu from 'defu'
import { fromEntries, hasAtLeast, isFunction, isNonNullish, map, mapToObj, mapValues, pickBy } from 'remeda'
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
  type Tag
} from '../types'
import type { ParsedLikeC4Model } from '../types/model'
import { isSameHierarchy, nameFromFqn, parentFqn } from '../utils/fqn'
import type { AnyTypes, BuilderSpecification, Types } from './_types'
import type { AddDeploymentNode } from './Builder.deployment'
import type {
  AddDeploymentNodeHelpers,
  DeloymentModelBuildFunction,
  DeloymentModelHelpers,
  DeploymentModelBuilder
} from './Builder.deploymentModel'
import type { AddElement } from './Builder.element'
import type { AddElementHelpers, ModelBuilder, ModelBuilderFunction, ModelHelpers } from './Builder.model'
import {
  $autoLayout,
  $exclude,
  $include,
  $rules,
  $style,
  type DeploymentViewRuleBuilderOp,
  mkViewBuilder,
  type ViewHelpers,
  type ViewRuleBuilderOp,
  type ViewsBuilderFunction
} from './Builder.view'
import { type ViewsBuilder } from './Builder.views'
import type { BuilderMethods } from './BuilderInterace'

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
    views: ViewHelpers<T>
    deployment: DeloymentModelHelpers<T>
  }

  model<Out extends AnyTypes>(
    callback: ModelBuilderFunction<T, Out>
  ): Builder<Out>

  deployment<Out extends AnyTypes>(
    callback: DeloymentModelBuildFunction<T, Out>
  ): Builder<Out>

  views<Out extends AnyTypes>(
    callback: ViewsBuilderFunction<T, Out>
  ): Builder<Out>

  /**
   * Returns model as result of parsing only
   * Model is not computed or layouted
   */
  build(): ParsedLikeC4Model<
    T['ElementKind'],
    T['RelationshipKind'],
    T['Tag'],
    T['Fqn'],
    T['ViewId'],
    T['DeploymentFqn']
  >

  /**
   * Returns model with computed views
   */
  buildComputedModel(): LikeC4Model.Computed<
    T['Fqn'],
    T['DeploymentFqn'],
    T['ViewId']
  >
}

interface Internals<T extends AnyTypes> {
  /**
   * Internal usage
   */
  __model(): ModelBuilder<T>
  __views(): ViewsBuilder<T>
  __deployment(): DeploymentModelBuilder<T>
}

function builder<Spec extends BuilderSpecification, T extends AnyTypes>(
  spec: Spec,
  _elements = new Map<string, Element>(),
  _relations = [] as ModelRelation[],
  _views = new Map<string, LikeC4View>(),
  _globals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {}
  } as ModelGlobals,
  _deployments = new Map<string, DeploymentElement>(),
  _deploymentRelations = [] as DeploymentRelation[]
): Builder<T> {
  const toLikeC4Specification = (): Types.ToParsedLikeC4Model<T>['specification'] => ({
    elements: {
      ...spec.elements as any
    },
    deployments: {
      ...spec.deployments as any
    },
    relationships: {
      ...spec.relationships
    },
    tags: (spec.tags ?? []) as Tag<T['Tag']>[]
  })

  const mapLinks = (links?: Array<string | { title?: string; url: string }>): NonEmptyArray<Link> | null => {
    if (!links || !hasAtLeast(links, 1)) {
      return null
    }
    return map(links, l => (typeof l === 'string' ? { url: l } : l))
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
        structuredClone(_deploymentRelations)
      )
    },
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
          id: `rel${_relations.length + 1}` as RelationId,
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
    __deployment: () => ({
      addDeployment: (node: DeploymentElement) => {
        if (_deployments.has(node.id)) {
          throw new Error(`Deployment with id "${node.id}" already exists`)
        }
        const parent = parentFqn(node.id)
        if (parent) {
          invariant(
            _deployments.get(parent),
            `Parent element with id "${parent}" not found for node with id "${node.id}"`
          )
        }
        if (DeploymentElement.isInstance(node)) {
          invariant(parent, 'Instance must have parent')
        }
        _deployments.set(node.id, node)
        return self
      },
      addDeploymentRelation: (relation) => {
        invariant(
          !isSameHierarchy(relation.source.id, relation.target.id),
          'Cannot create relationship between elements in the same hierarchy'
        )
        _deploymentRelations.push({
          id: `deploy_rel${_deploymentRelations.length + 1}` as RelationId,
          ...relation
        })
        return self
      },
      fqn: (id) => id as Fqn
    }),
    build: () => ({
      specification: toLikeC4Specification(),
      elements: fromEntries(Array.from(_elements.entries())) as any,
      relations: mapToObj(_relations, r => [r.id, r]),
      globals: structuredClone(_globals),
      deployments: {
        elements: fromEntries(Array.from(_deployments.entries())) as any,
        relations: mapToObj(_deploymentRelations, r => [r.id, r])
      },
      views: fromEntries(Array.from(_views.entries())) as any
    }),
    buildComputedModel: () => {
      const parsed = self.build()
      const computed = computeViews(parsed)
      return LikeC4Model.create(computed)
    },
    helpers: () => ({
      model: {
        model: (...ops: ((b: ModelBuilder<T>) => ModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            const v = (b as any as Internals<T>).__model()
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
              const nestedBuilder: ModelBuilder<any> = {
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
                op(nestedBuilder)
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
            const v = (b as any as Internals<T>).__views()
            for (const op of ops) {
              op(v)
            }
            return b
          }
        },
        view: (id, _props, builder?: ViewRuleBuilderOp<any>) => {
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
          _props?: T['NewViewProps'] | string | ViewRuleBuilderOp<any>,
          builder?: ViewRuleBuilderOp<any>
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
        deploymentView: (
          id,
          _props?: T['NewViewProps'] | string | DeploymentViewRuleBuilderOp<any>,
          builder?: DeploymentViewRuleBuilderOp<any>
        ) => {
          if (isFunction(_props)) {
            builder = _props as any
            _props = {}
          }
          return <T extends AnyTypes>(b: ViewsBuilder<T>): ViewsBuilder<T> => {
            const {
              links: _links = [],
              title = null,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }

            const links = mapLinks(_links)

            const view: Writable<DeploymentView> = {
              id: id as any,
              __: 'deployment',
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
        $include,
        $rules,
        $style
      },
      deployment: {
        deployment: (...ops: ((b: DeploymentModelBuilder<T>) => DeploymentModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            const v = (b as any as Internals<T>).__deployment()
            for (const op of ops) {
              op(v)
            }
            return b
          }
        },
        instanceOf: (id, to, _props?: string | T['NewDeploymentNodeProps']) => {
          return <T extends AnyTypes>(
            b: DeploymentModelBuilder<T>
          ): DeploymentModelBuilder<Types.AddDeploymentFqn<T, any>> => {
            const {
              links,
              title,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }
            const _id = b.fqn(id)
            invariant(_elements.has(to), `Target element with id "${to}" not found`)
            b.addDeployment({
              id: _id,
              element: to as any,
              ...title && { title },
              ...links && { links: mapLinks(links) },
              ...props
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

            b.addDeploymentRelation({
              source: {
                id: source as any
              },
              target: {
                id: target as any
              },
              ...title && { title },
              ...links && { links: mapLinks(links) },
              ...props
            })
            return b
          }
        },
        ...mapValues(
          spec.deployments ?? {},
          ({ style: specStyle, ...spec }, kind) =>
          <Id extends string>(
            id: Id,
            _props?: T['NewDeploymentNodeProps'] | string
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

              const _id = b.fqn(id)

              b.addDeployment({
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
                ...links && { links: mapLinks(links) },
                ...icon && { icon: icon as IconUrl },
                ...spec,
                ...props
              })
              return b
            }) as AddDeploymentNode<Id>

            add.with =
              (...ops: Array<(input: DeploymentModelBuilder<any>) => DeploymentModelBuilder<any>>) =>
              (b: DeploymentModelBuilder<any>) => {
                add(b)
                const nestedBuilder: DeploymentModelBuilder<any> = {
                  ...b,
                  fqn: (child) => `${b.fqn(id)}.${child}` as Fqn
                }
                for (const op of ops) {
                  op(nestedBuilder)
                }
                return b
              }
            return add
          }
        ) as AddDeploymentNodeHelpers<T>
      }
    }),
    with: (...ops: ((b: Builder<T>) => Builder<T>)[]) => {
      return ops.reduce((b, op) => op(b), self.clone())
    },
    model: <Out extends AnyTypes>(cb: ModelBuilderFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().model
      return cb(helpers, helpers.model as any)(b)
    },
    deployment: <Out extends AnyTypes>(cb: DeloymentModelBuildFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().deployment
      return cb(helpers, helpers.deployment as any)(b)
    },
    views: <Out extends AnyTypes>(cb: ViewsBuilderFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().views
      return cb(helpers, helpers.views as any)(b)
    }
  }

  return self
}

export namespace Builder {
  export type Any = Builder<AnyTypes>

  export function forSpecification<const Spec extends BuilderSpecification>(
    spec: Spec
  ): {
    builder: Builder<Types.FromSpecification<Spec>>
    model: ModelHelpers<Types.FromSpecification<Spec>>
    deployment: DeloymentModelHelpers<Types.FromSpecification<Spec>>
    views: ViewHelpers<Types.FromSpecification<Spec>>
    build: Builder<Types.FromSpecification<Spec>>['with']
  } {
    const b = builder<Spec, Types.FromSpecification<Spec>>(spec)
    return {
      ...b.helpers(),
      builder: b,
      build: b.with
    }
  }

  export function specification<const Spec extends BuilderSpecification>(
    spec: Spec
  ): Builder<Types.FromSpecification<Spec>> {
    return builder<Spec, Types.FromSpecification<Spec>>(spec)
  }
}
