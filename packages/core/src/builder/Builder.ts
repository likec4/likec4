// oxlint-disable no-unsafe-type-assertion
// oxlint-disable typescript/no-misused-spread
import defu from 'defu'
import {
  entries,
  filter,
  fromEntries,
  fromKeys,
  hasAtLeast,
  isArray,
  isFunction,
  isNullish,
  map,
  mapToObj,
  mapValues,
  pipe,
} from 'remeda'
import type { Writable } from 'type-fest'
import { computeLikeC4Model } from '../compute-view/compute-view'
import { LikeC4Model } from '../model/LikeC4Model'
import { assignTagColors } from '../styles/assignTagColors'
import type {
  Any,
  aux,
  DeployedInstance,
  DeploymentFqn,
  DeploymentNode,
  ElementStyle,
  LikeC4Project,
  MarkdownOrString,
  ParsedElementView,
  ParsedLikeC4ModelData,
  Specification,
  TagSpecification,
} from '../types'
import {
  type DeploymentElement,
  type DeploymentRelation,
  type Element,
  type Fqn,
  type IconUrl,
  type LikeC4View,
  type Link,
  type ModelGlobals,
  type ModelRelation,
  type NonEmptyArray,
  type ParsedDeploymentView as DeploymentView,
  type RelationId,
  _stage,
  _type,
  exact,
  FqnRef,
  isDeployedInstance,
  isElementView,
  isGlobalFqn,
  splitGlobalFqn,
} from '../types'
import { DefaultMap, invariant } from '../utils'
import { isSameHierarchy, nameFromFqn, parentFqn } from '../utils/fqn'
import type { AnyTypes, BuilderProjectSpecification, BuilderSpecification, Types } from './_types'
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
import { type ViewsBuilder, type ViewsBuilderFunction, type ViewsHelpers, mkViewBuilder } from './Builder.views'
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

  /**
   * Adds model elements
   *
   * @example
   *  builder.model(({ el }, _) =>
   *    _(
   *      el('a'),
   *      el('a.b').with(
   *        el('c')
   *      )
   *    )
   *  )
   *
   *  builder.model((_, m) =>
   *    m(
   *      _.el('a'),
   *      _.el('a.b').with(
   *        _.el('c')
   *      )
   *    )
   *  )
   */
  model<Out extends AnyTypes>(
    callback: ModelBuilderFunction<T, Out>,
  ): Builder<Out>

  /**
   * Adds deployment model
   *
   * @example
   *  builder.deployment(({ node, instanceOf }, _) =>
   *    _(
   *      node('node1'),
   *      node('node1.child1').with(
   *        instanceOf('model.element')
   *      )
   *    )
   *  )
   *
   * @example
   *  builder.deployment((_,d) =>
   *    d(
   *      _.node('node1'),
   *      _.node('node1.child1').with(
   *        _.instanceOf('model.element')
   *      )
   *    )
   *  )
   */
  deployment<Out extends AnyTypes>(
    callback: DeloymentModelBuildFunction<T, Out>,
  ): Builder<Out>

  /**
   * Adds views
   *
   * @example
   *  builder.views(({ view, viewOf, deploymentView, $include, $style, $rules }, _) =>
   *    _(
   *      view('view1').with(
   *        $include('a -> b'),
   *      ),
   *      view('view2', {
   *        title: 'View 2',
   *      }).with(
   *        $include('*')
   *      ),
   *      view(
   *        'view3',
   *        {
   *          title: 'View 3',
   *        },
   *        $rules(
   *          $include('*'),
   *          $style(['*', 'alice'], {
   *            color: 'red',
   *          }),
   *        ),
   *      ),
   *      viewOf('viewOfA', 'a').with(
   *        $include('*')
   *      ),
   *      deploymentView('deploymentView1').with(
   *        $include('a -> b')
   *      ),
   *    )
   *  )
   */
  views<Out extends AnyTypes>(
    callback: ViewsBuilderFunction<T, Out>,
  ): Builder<Out>

  /**
   * Returns model as result of parsing only
   * Views are not computed or layouted
   * {@link toLikeC4Model} should be used to get model with computed views
   */
  build<const ProjectId extends string>(
    project: ProjectId,
  ): ParsedLikeC4ModelData<aux.setProject<Types.ToAux<T>, ProjectId>>

  build<const Project extends BuilderProjectSpecification>(
    project: Project,
  ): ParsedLikeC4ModelData<aux.setProject<Types.ToAux<T>, Project['id']>>

  build(): ParsedLikeC4ModelData<Types.ToAux<T>>

  /**
   * Returns Computed LikeC4Model
   */
  toLikeC4Model<const ProjectId extends string>(
    project: ProjectId,
  ): LikeC4Model.Computed<aux.setProject<Types.ToAux<T>, ProjectId>>
  toLikeC4Model<const Project extends BuilderProjectSpecification>(
    project: Project,
  ): LikeC4Model.Computed<aux.setProject<Types.ToAux<T>, Project['id']>>

  toLikeC4Model(): LikeC4Model.Computed<Types.ToAux<T>>
}

interface Internals<T extends AnyTypes> extends ViewsBuilder<T>, ModelBuilder<T>, DeploymentModelBuilder<T> {
}

type Op<T> = (b: T) => T

function ensureObj<T>(value: string[] | Record<string, Partial<T>>): Record<string, Partial<T>> {
  return isArray(value) ? fromKeys(value, _ => ({})) : value
}

function validateSpec({ tags, elements, deployments, relationships, ...specification }: BuilderSpecification) {
  const spectags = {} as Record<string, Partial<TagSpecification>>
  if (tags) {
    Object.assign(
      spectags,
      ensureObj(tags),
    )
  }
  const _elements = ensureObj(elements)

  for (const [kind, spec] of entries(_elements)) {
    if (spec.tags) {
      for (const tag of spec.tags) {
        invariant(tag in spectags, `Invalid specification for element kind "${kind}": tag "${tag}" not found`)
      }
    }
  }
  const _deployments = ensureObj(deployments ?? {})

  for (const [kind, spec] of entries(_deployments)) {
    if (spec.tags) {
      for (const tag of spec.tags) {
        invariant(
          tag in spectags,
          `Invalid specification for deployment kind "${kind}": tag "${tag}" not found`,
        )
      }
    }
  }

  return {
    ...specification,
    tags: spectags,
    elements: _elements,
    deployments: _deployments,
    relationships: ensureObj(relationships ?? {}),
  }
}

function toMarkdownOrString(input: string | MarkdownOrString | null | undefined): MarkdownOrString | null {
  if (isNullish(input)) {
    return null
  }
  if (typeof input === 'string') {
    return { txt: input }
  }
  return input
}

function builder<Spec extends BuilderSpecification, T extends AnyTypes>(
  _spec: Spec,
  _elements = new Map<string, Element<Any>>(),
  _relations = [] as ModelRelation[],
  _views = new Map<string, LikeC4View>(),
  _globals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {},
  } as ModelGlobals,
  _deployments = new Map<string, DeploymentElement>(),
  _deploymentRelations = [] as DeploymentRelation[],
  _imports = new DefaultMap<string, Map<string, Element<Any>>>(() => new Map()),
): Builder<T> {
  const spec = validateSpec(_spec)

  const toLikeC4Specification = (): Specification<Types.ToAux<T>> => {
    return ({
      elements: structuredClone(spec.elements),
      deployments: structuredClone(spec.deployments),
      relationships: structuredClone(spec.relationships),
      tags: assignTagColors(structuredClone(spec.tags)),
      ...(spec.metadataKeys ? { metadataKeys: spec.metadataKeys as any } : {}),
      customColors: {},
    } as Specification<Types.ToAux<T>>)
  }

  const mapLinks = (links?: Array<string | { title?: string; url: string }>): NonEmptyArray<Link> | undefined => {
    if (!links || !hasAtLeast(links, 1)) {
      return undefined
    }
    return map(links, l => (typeof l === 'string' ? { url: l } : l))
  }

  const createGenericView = <B extends Op<any> | undefined>(
    id: string,
    _props: T['NewViewProps'] | string | B | null,
    builder: B,
  ): [Omit<LikeC4View, 'rules' | '_type'>, B] => {
    if (isFunction(_props)) {
      builder = _props as B
      _props = {}
    }
    _props ??= {}
    const {
      links: _links = [],
      title = null,
      description = null,
      tags = [],
      ...props
    } = typeof _props === 'string' ? { title: _props } : { ..._props }

    const links = mapLinks(_links)
    return [
      exact({
        id: id as any,
        title,
        description: toMarkdownOrString(description),
        tags,
        links,
        _stage: 'parsed',
        ...props,
      }),
      builder,
    ]
  }

  const checkElementExists = (id: string) => {
    const [project, fqn] = splitGlobalFqn(id as Fqn)
    const lookup = project ? _imports.get(project) : _elements
    const el = lookup.get(fqn)
    invariant(el, `Element with id "${id}" not found`)
    return el
  }

  const parseRelEndpoint = (endpoint: string | FqnRef): FqnRef => {
    if (typeof endpoint === 'string') {
      const [project, model] = splitGlobalFqn(endpoint as Fqn)
      if (project) {
        return { project, model }
      }
      return { model }
    }
    if ('project' in endpoint || 'deployment' in endpoint) {
      return endpoint as FqnRef
    }
    return parseRelEndpoint(endpoint.model)
  }

  const self: Builder<T> & Internals<T> = {
    get Types(): T {
      throw new Error('Types are not available in runtime')
    },
    clone: () => {
      const imports = new DefaultMap<string, Map<string, Element<Any>>>(() => new Map())
      for (const [key, value] of _imports) {
        imports.set(key, structuredClone(value))
      }

      return builder(
        structuredClone(spec),
        structuredClone(_elements),
        structuredClone(_relations),
        structuredClone(_views),
        structuredClone(_globals),
        structuredClone(_deployments),
        structuredClone(_deploymentRelations),
        imports,
      )
    },

    __addElement: (element) => {
      const [project, fqn] = splitGlobalFqn(element.id)
      const parent = parentFqn(fqn)
      const lookup = project ? _imports.get(project) : _elements
      if (parent) {
        invariant(
          lookup.get(parent),
          `Parent element with id "${parent}" not found for element with id "${element.id}"`,
        )
      }
      if (lookup.has(fqn)) {
        throw new Error(`Element with id "${element.id}" already exists`)
      }
      lookup.set(fqn, project ? { ...element, id: fqn } : element)
      return self
    },
    __addRelation(relation) {
      const source = parseRelEndpoint(relation.source)
      const sourceFqn = FqnRef.flatten(source)
      const target = parseRelEndpoint(relation.target)
      const targetFqn = FqnRef.flatten(target)
      const sourceEl = checkElementExists(sourceFqn)
      const targetEl = checkElementExists(targetFqn)
      if (isGlobalFqn(sourceFqn) && isGlobalFqn(targetFqn)) {
        throw new Error('Cannot create relationship between global elements')
      }
      if (!isGlobalFqn(sourceFqn) && !isGlobalFqn(targetFqn)) {
        invariant(
          !isSameHierarchy(sourceEl, targetEl),
          'Cannot create relationship between elements in the same hierarchy',
        )
      }
      _relations.push({
        id: `rel${_relations.length + 1}` as RelationId,
        ...relation,
        source: source as FqnRef.ModelRef,
        target: target as FqnRef.ModelRef,
      })
      return self
    },
    __fqn(id) {
      invariant(id.trim() !== '', 'Id must be non-empty')
      return id as Fqn
    },
    __deploymentFqn(id) {
      invariant(id.trim() !== '', 'Id must be non-empty')
      return id as DeploymentFqn
    },
    __addSourcelessRelation() {
      throw new Error('Can be called only in nested model')
    },
    __addView: (view) => {
      if (_views.has(view.id)) {
        throw new Error(`View with id "${view.id}" already exists`)
      }
      if (isElementView(view) && 'viewOf' in view) {
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
      if (isDeployedInstance(node)) {
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
        !isSameHierarchy(relation.source.deployment, relation.target.deployment),
        'Cannot create relationship between elements in the same hierarchy',
      )

      invariant(
        _deployments.has(relation.source.deployment),
        `Relation "${relation.source.deployment} -> ${relation.target.deployment}" references non-existing source`,
      )
      invariant(
        _deployments.has(relation.target.deployment),
        `Relation "${relation.source.deployment} -> ${relation.target.deployment}" references non-existing target`,
      )

      _deploymentRelations.push({
        id: `deploy_rel${_deploymentRelations.length + 1}` as RelationId,
        ...relation,
      })
      return self
    },
    build: (project?: string | LikeC4Project) => ({
      [_stage]: 'parsed',
      projectId: typeof project === 'string' ? project : project?.id ?? 'from-builder',
      project: {
        id: typeof project === 'string' ? project : 'from-builder',
        ...(typeof project === 'object' && project !== null ? project : {}),
      },
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
      imports: pipe(
        Array.from(_imports.entries()),
        map((
          [projectId, elementsMap],
        ) => [projectId, structuredClone([...elementsMap.values()])] as const),
        filter(([_, elements]) => elements.length > 0),
        fromEntries(),
      ),
    } as any),
    toLikeC4Model: (project?: LikeC4Project) => {
      const parsed = self.build(project as any)
      return computeLikeC4Model(parsed) as any
    },
    helpers: () => ({
      model: {
        model: (...ops: ((b: ModelBuilder<T>) => ModelBuilder<T>)[]) => {
          return (b: Builder<T>) => {
            return ops.reduce((b, op) => op(b), b as any as ModelBuilder<T>) as any
          }
        },
        rel: (source, target, _props?) => {
          return <T extends AnyTypes>(b: ModelBuilder<T>) => {
            const {
              title = '',
              links: _links = [],
              description = null,
              notes = null,
              ...props
            } = defu(
              typeof _props === 'string' ? { title: _props } : { ..._props },
              { title: null, links: null },
            )
            const links = mapLinks(_links)
            b.__addRelation(exact({
              source: {
                model: source,
              },
              target: {
                model: target,
              },
              title,
              ...(description && { description: toMarkdownOrString(description) }),
              ...(notes && { notes: toMarkdownOrString(notes) } as {}),
              links,
              ...props,
            }))
            return b
          }
        },
        relTo: (target, _props?) => {
          return <T extends AnyTypes>(b: ModelBuilder<T>) => {
            const {
              title = '',
              links,
              description = null,
              notes = null,
              ...props
            } = defu(
              typeof _props === 'string' ? { title: _props } : { ..._props },
              { title: null, links: null },
            )
            b.__addSourcelessRelation(exact({
              target: {
                model: target,
              },
              title,
              ...(description && { description: toMarkdownOrString(description) }),
              ...(notes && { notes: toMarkdownOrString(notes) } as {}),
              links: mapLinks(links),
              ...props,
            }))
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
                links,
                icon: _icon,
                color,
                shape,
                style,
                title,
                description,
                summary,
                ...props
              } = typeof _props === 'string' ? { title: _props } : { ..._props }

              const icon = _icon ?? specStyle?.icon

              const _id = b.__fqn(id)

              b.__addElement(exact({
                id: _id,
                kind: kind as any,
                title: title ?? nameFromFqn(_id),
                ...(description && { description: toMarkdownOrString(description) }),
                ...(summary && { summary: toMarkdownOrString(summary) }),
                style: exact({
                  icon: icon as IconUrl | undefined,
                  color: color ?? specStyle?.color,
                  shape: shape ?? specStyle?.shape,
                  border: specStyle?.border,
                  opacity: specStyle?.opacity,
                  size: specStyle?.size,
                  padding: specStyle?.padding,
                  textSize: specStyle?.textSize,
                  ...style,
                }) satisfies ElementStyle,
                links: mapLinks(links),
                ...spec,
                ...props,
              }))
              return b
            }) as AddElement<Id>

            add.with = (...ops: Array<(input: ModelBuilder<any>) => ModelBuilder<any>>) => (b: ModelBuilder<any>) => {
              add(b)
              const { __fqn, __addSourcelessRelation } = b
              try {
                b.__fqn = (child) => `${__fqn(id)}.${child}` as Fqn
                b.__addSourcelessRelation = (relation) => {
                  return b.__addRelation({
                    ...relation,
                    source: {
                      model: __fqn(id),
                    },
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
          const view: Writable<ParsedElementView> = {
            ...generic,
            [_type]: 'element',
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
          const view: Writable<ParsedElementView> = {
            ...generic,
            viewOf: viewOf as Fqn,
            [_type]: 'element',
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
            [_type]: 'deployment',
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
              description,
              summary,
              icon,
              color,
              shape,
              style,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }
            const _id = b.__deploymentFqn(id)
            b.__addDeployment(
              exact({
                id: _id,
                element: target as Fqn,
                ...title && { title },
                ...(summary && { summary: toMarkdownOrString(summary) }),
                ...(description && { description: toMarkdownOrString(description) }),
                style: exact({
                  icon: icon as IconUrl | undefined,
                  color,
                  shape,
                  ...style,
                }) satisfies ElementStyle,
                links: mapLinks(links),
                ...props,
              }) satisfies DeployedInstance,
            )
            return b as any
          }
        },
        rel: (source: string, target: string, _props?: T['NewRelationshipProps'] | string) => {
          return <T extends AnyTypes>(b: DeploymentModelBuilder<T>) => {
            const {
              title = null,
              links,
              description = null,
              notes = null,
              ...props
            } = typeof _props === 'string' ? { title: _props } : { ..._props }

            b.__addDeploymentRelation(exact({
              source: {
                deployment: source as any,
              },
              target: {
                deployment: target as any,
              },
              title,
              ...description && { description: toMarkdownOrString(description) },
              ...(notes && { notes: toMarkdownOrString(notes) } as {}),
              links: mapLinks(links),
              ...props,
            }))
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
                description,
                summary,
                color,
                shape,
                ...props
              } = typeof _props === 'string' ? { title: _props } : { ..._props }

              const icon = _icon ?? specStyle?.icon

              const _id = b.__deploymentFqn(id)

              b.__addDeployment(
                exact({
                  id: _id,
                  kind: kind as any,
                  title: title ?? nameFromFqn(_id),
                  ...(description && { description: toMarkdownOrString(description) }),
                  ...(summary && { summary: toMarkdownOrString(summary) }),
                  style: exact({
                    icon: icon as IconUrl | undefined,
                    color: color ?? specStyle?.color,
                    shape: shape ?? specStyle?.shape,
                    border: specStyle?.border,
                    opacity: specStyle?.opacity,
                    size: specStyle?.size,
                    padding: specStyle?.padding,
                    textSize: specStyle?.textSize,
                    ...style,
                  }) satisfies ElementStyle,
                  links: mapLinks(links),
                  ...spec,
                  ...props,
                }) satisfies DeploymentNode,
              )
              return b
            }) as AddDeploymentNode<Id>

            add.with =
              (...ops: Array<(input: DeploymentModelBuilder<any>) => DeploymentModelBuilder<any>>) =>
              (b: DeploymentModelBuilder<any>) => {
                add(b)
                const { __deploymentFqn } = b
                try {
                  b.__deploymentFqn = (child) => `${__deploymentFqn(id)}.${child}` as DeploymentFqn
                  ops.reduce((b, op) => op(b), b as any as DeploymentModelBuilder<T>) as any
                } finally {
                  b.__deploymentFqn = __deploymentFqn
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
      const b = self.clone()
      return ops.reduce((b, op) => op(b), b)
    },
    model: <Out extends AnyTypes>(cb: ModelBuilderFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().model
      const _ = helpers.model as any
      return cb({ ...helpers, _ }, _)(b as Internals<T>) as any
    },
    deployment: <Out extends AnyTypes>(cb: DeloymentModelBuildFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().deployment
      const _ = helpers.deployment as any
      return cb({ ...helpers, _ }, _)(b as Internals<T>) as any
    },
    views: <Out extends AnyTypes>(cb: ViewsBuilderFunction<T, Out>) => {
      const b = self.clone()
      const helpers = b.helpers().views
      return cb({
        ...helpers,
        _: helpers.views as any,
      } as any, helpers.views as any)(b as Internals<T>) as any
    },
  }

  return self
}
export const Builder = {
  /**
   * Creates a builder with compositional methods
   *
   * @example
   * ```ts
   * const {
   *   model: { model, system, component, relTo },
   *   deployment: { env, vm},
   *   views: { view, $include },
   *   builder,
   * } = Builder.forSpecification({
   *   elements: {
   *     system: {},
   *     component: {},
   *   },
   *   deployments: ['env', 'vm'],
   * })
   *
   * const b = builder
   *   .with(
   *     model(
   *       system('cloud').with(
   *         component('backend'),
   *         component('backend.api'),
   *         component('frontend').with(
   *           relTo('cloud.backend.api'),
   *         ),
   *       ),
   *     ),
   *   )
   * ```
   */
  forSpecification<const Spec extends BuilderSpecification>(
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
  },

  /**
   * Creates a builder with chainable methods
   *
   * @example
   * ```ts
   * const b = Builder
   *   .specification({
   *     elements: ['system', 'component'],
   *     deployments: ['env', 'vm'],
   *   })
   *   .model(({ system, component, relTo }, _) =>
   *     _(
   *       system('cloud').with(
   *         component('backend').with(
   *           component('api'),
   *         ),
   *         component('frontend').with(
   *           relTo('cloud.backend.api'),
   *         )
   *       )
   *     )
   *   )
   * ```
   */
  specification<const Spec extends BuilderSpecification>(
    spec: Spec,
  ): Builder<Types.FromSpecification<Spec>> {
    return builder<Spec, Types.FromSpecification<Spec>>(spec)
  },
}

export namespace Builder {
  export type Any = Builder<AnyTypes>
}
