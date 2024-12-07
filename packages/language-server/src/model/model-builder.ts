import * as c4 from '@likec4/core'
import {
  compareRelations,
  computeColorValues,
  type CustomColorDefinitions,
  isScopedElementView,
  parentFqn,
  sortByFqnHierarchically,
  type ViewId
} from '@likec4/core'
import { mkComputeView, resolveRulesExtendedViews } from '@likec4/core/compute-view'
import { deepEqual as eq } from 'fast-equals'
import type { Cancellation, LangiumDocument, LangiumDocuments, URI, WorkspaceCache } from 'langium'
import { Disposable, DocumentState, interruptAndCheck } from 'langium'
import {
  filter,
  flatMap,
  groupBy,
  indexBy,
  isDefined,
  isEmpty,
  isNonNullish,
  isNullish,
  isNumber,
  isTruthy,
  map,
  mapToObj,
  mapValues,
  pick,
  pipe,
  prop,
  reduce,
  reverse,
  sort,
  values
} from 'remeda'
import type {
  ParsedAstElement,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedAstView,
  ParsedLikeC4LangiumDocument,
  ParsedLink
} from '../ast'
import { isParsedLikeC4LangiumDocument } from '../ast'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { assignNavigateTo, resolveRelativePaths } from '../view-utils'

function buildModel(services: LikeC4Services, docs: ParsedLikeC4LangiumDocument[]): c4.ParsedLikeC4Model {
  // Merge specifications and globals from all documents
  const c4Specification: ParsedAstSpecification = {
    tags: new Set(),
    deployments: {},
    elements: {},
    relationships: {},
    colors: {}
  }
  const globals: c4.ModelGlobals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {}
  }
  for (const doc of docs) {
    const {
      c4Specification: spec,
      c4Globals
    } = doc

    spec.tags.forEach(t => c4Specification.tags.add(t))
    Object.assign(c4Specification.elements, spec.elements)
    Object.assign(c4Specification.relationships, spec.relationships)
    Object.assign(c4Specification.colors, spec.colors)
    Object.assign(c4Specification.deployments, spec.deployments)
    Object.assign(globals.predicates, c4Globals.predicates)
    Object.assign(globals.dynamicPredicates, c4Globals.dynamicPredicates)
    Object.assign(globals.styles, c4Globals.styles)
  }

  function resolveLinks(doc: LangiumDocument, links: c4.NonEmptyArray<ParsedLink>) {
    return map(
      links,
      (link): c4.Link => {
        try {
          const relative = services.lsp.DocumentLinkProvider.relativeLink(doc, link.url)
          if (relative && relative !== link.url) {
            return {
              ...link,
              relative
            }
          }
        } catch (e) {
          logWarnError(e)
        }
        return link
      }
    )
  }

  const customColorDefinitions: CustomColorDefinitions = mapValues(
    c4Specification.colors,
    c => computeColorValues(c.color)
  )

  function toModelElement(doc: LangiumDocument) {
    return ({
      tags,
      links: unresolvedLinks,
      style: {
        color,
        shape,
        icon,
        opacity,
        border
      },
      id,
      kind,
      title,
      description,
      technology,
      metadata
    }: ParsedAstElement): c4.Element | null => {
      try {
        const __kind = c4Specification.elements[kind]
        if (!__kind) {
          logger.warn(`No kind '${kind}' found for ${id}`)
          return null
        }
        const links = unresolvedLinks ? resolveLinks(doc, unresolvedLinks) : null
        color ??= __kind.style.color
        shape ??= __kind.style.shape
        icon ??= __kind.style.icon
        opacity ??= __kind.style.opacity
        border ??= __kind.style.border
        technology ??= __kind.technology
        return {
          ...(color && { color }),
          ...(shape && { shape }),
          ...(icon && { icon }),
          ...(metadata && !isEmpty(metadata) && { metadata }),
          ...(__kind.notation && { notation: __kind.notation }),
          style: {
            ...(border && { border }),
            ...(isNumber(opacity) && { opacity })
          },
          links,
          tags: tags ?? null,
          technology: technology ?? null,
          description: description ?? null,
          title,
          kind,
          id
        }
      } catch (e) {
        logWarnError(e)
      }
      return null
    }
  }

  const elements = pipe(
    docs,
    flatMap(d => map(d.c4Elements, toModelElement(d))),
    filter(isTruthy),
    // sort from root elements to nested, so that parent is always present
    // Import to preserve the order from the source
    sortByFqnHierarchically,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logWarnError(`No parent found for ${el.id}`)
          return acc
        }
        acc[el.id] = el
        return acc
      },
      {} as c4.ParsedLikeC4Model['elements']
    )
  )

  function toModelRelation(doc: LangiumDocument) {
    return ({
      astPath,
      source,
      target,
      kind,
      links: unresolvedLinks,
      id,
      ...model
    }: ParsedAstRelation): c4.Relation | null => {
      if (isNullish(elements[source]) || isNullish(elements[target])) {
        logger.warn(
          `Invalid relation ${id}, source: ${source}(${!!elements[source]}), target: ${target}(${!!elements[target]})`
        )
        return null
      }
      const links = unresolvedLinks ? resolveLinks(doc, unresolvedLinks) : null

      if (isNonNullish(kind) && kind in c4Specification.relationships) {
        return {
          ...c4Specification.relationships[kind],
          ...model,
          ...(links && { links }),
          source,
          target,
          kind,
          id
        } satisfies c4.Relation
      }
      return {
        ...links && { links },
        ...model,
        source,
        target,
        id
      } satisfies c4.Relation
    }
  }

  const relations = pipe(
    docs,
    flatMap(d => map(d.c4Relations, toModelRelation(d))),
    filter(isTruthy),
    sort(compareRelations),
    reverse(),
    indexBy(prop('id'))
  )

  function toDeploymentElement(doc: LangiumDocument) {
    return (parsed: c4.DeploymentElement): c4.DeploymentElement | null => {
      if (!c4.DeploymentElement.isDeploymentNode(parsed)) {
        if (!parsed.links || parsed.links.length === 0) {
          return parsed
        }
        const links = resolveLinks(doc, parsed.links)
        return {
          ...parsed,
          links
        }
      }
      try {
        const __kind = c4Specification.deployments[parsed.kind]
        if (!__kind) {
          logger.warn(`No kind '${parsed.kind}' found for ${parsed.id}`)
          return parsed
        }
        let {
          technology = __kind.technology,
          notation = __kind.notation,
          links,
          style
        } = parsed
        return {
          ...parsed,
          ...notation && { notation },
          ...technology && { technology },
          style: {
            border: 'dashed',
            opacity: 10,
            ...__kind.style,
            ...style
          },
          links: links ? resolveLinks(doc, links) : null
        }
      } catch (e) {
        logWarnError(e)
      }
      return null
    }
  }

  const deploymentElements = pipe(
    docs,
    flatMap(d => map(d.c4Deployments, toDeploymentElement(d))),
    filter(isTruthy),
    // sort from root elements to nested, so that parent is always present
    // Import to preserve the order from the source
    sortByFqnHierarchically,
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logWarnError(`No parent found for deployment element ${el.id}`)
          return acc
        }
        acc[el.id] = el
        return acc
      },
      {} as c4.ParsedLikeC4Model['deployments']['elements']
    )
  )

  const deploymentRelations = pipe(
    docs,
    flatMap(d => d.c4DeploymentRelations),
    reduce(
      (acc, el) => {
        if (isDefined(acc[el.id])) {
          logWarnError(`Duplicate deployment relation ${el.id}`)
          return acc
        }
        acc[el.id] = el
        return acc
      },
      {} as c4.ParsedLikeC4Model['deployments']['relations']
    )
  )

  function toC4View(doc: LangiumDocument) {
    const docUri = doc.uri.toString()
    return (parsedAstView: ParsedAstView): c4.LikeC4View => {
      let {
        id,
        title,
        description,
        tags,
        links: unresolvedLinks,
        // ignore this property
        astPath: _ignore,
        // model should include discriminant __
        ...model
      } = parsedAstView

      if (parsedAstView.__ === 'element' && isNullish(title) && 'viewOf' in parsedAstView) {
        title = elements[parsedAstView.viewOf]?.title ?? null
      }

      if (isNullish(title) && id === 'index') {
        title = 'Landscape view'
      }

      const links = unresolvedLinks ? resolveLinks(doc, unresolvedLinks) : null

      return {
        ...model,
        customColorDefinitions,
        tags,
        links,
        docUri,
        description,
        title,
        id
      }
    }
  }

  const parsedViews = pipe(
    docs,
    flatMap(d => map(d.c4Views, toC4View(d))),
    // Resolve relative paths and sort by
    resolveRelativePaths
  )
  // Add index view if not present
  if (!parsedViews.some(v => v.id === 'index')) {
    parsedViews.unshift({
      __: 'element',
      id: 'index' as ViewId,
      title: 'Landscape view',
      description: null,
      tags: null,
      links: null,
      customColorDefinitions: customColorDefinitions,
      rules: [
        {
          include: [
            {
              wildcard: true
            }
          ]
        }
      ]
    })
  }

  const views = pipe(
    parsedViews,
    indexBy(prop('id')),
    resolveRulesExtendedViews
  )

  return {
    specification: {
      tags: Array.from(c4Specification.tags),
      elements: c4Specification.elements,
      relationships: c4Specification.relationships,
      deployments: c4Specification.deployments
    },
    elements,
    relations,
    globals,
    views,
    deployments: {
      elements: deploymentElements,
      relations: deploymentRelations
    }
  }
}

const CACHE_KEY_PARSED_MODEL = 'ParsedLikeC4Model'
const CACHE_KEY_COMPUTED_MODEL = 'ComputedLikeC4Model'

type ModelParsedListener = (docs: URI[]) => void

export class LikeC4ModelBuilder {
  private langiumDocuments: LangiumDocuments
  private listeners: ModelParsedListener[] = []

  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    const parser = services.likec4.ModelParser

    services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
      if (deleted.length > 0) {
        this.notifyListeners(deleted)
      }
    })

    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Validated,
      async (docs, _cancelToken) => {
        let parsed = [] as URI[]
        try {
          logger.debug(`[ModelBuilder] onValidated (${docs.length} docs)`)
          for (const doc of docs) {
            parsed.push(parser.parse(doc).uri)
          }
        } catch (e) {
          logWarnError(e)
        }
        if (parsed.length > 0) {
          this.notifyListeners(parsed)
        }
        return await Promise.resolve()
      }
    )
    logger.debug(`[ModelBuilder] Created`)
  }

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  public unsafeSyncBuildModel(): c4.ParsedLikeC4Model | null {
    const docs = this.documents()
    if (docs.length === 0) {
      logger.debug('[ModelBuilder] No documents to build model from')
      return null
    }
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ParsedLikeC4Model | null>
    return cache.get(CACHE_KEY_PARSED_MODEL, () => {
      logger.debug(`[ModelBuilder] buildModel (${docs.length} docs)`)
      return buildModel(this.services, docs)
    })
  }

  public async buildModel(cancelToken?: Cancellation.CancellationToken): Promise<c4.ParsedLikeC4Model | null> {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ParsedLikeC4Model | null>
    const cached = cache.get(CACHE_KEY_PARSED_MODEL)
    if (cached) {
      return cached
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      return this.unsafeSyncBuildModel()
    })
  }

  private previousViews: Record<ViewId, c4.ComputedView> = {}

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  public unsafeSyncBuildComputedModel(model: c4.ParsedLikeC4Model): c4.ComputedLikeC4Model {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedLikeC4Model>
    const viewsCache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(CACHE_KEY_COMPUTED_MODEL, () => {
      const computeView = mkComputeView(model)
      const allViews = [] as c4.ComputedView[]
      for (const view of values(model.views)) {
        const result = computeView(view)
        if (!result.isSuccess) {
          logWarnError(result.error)
          continue
        }
        allViews.push(result.view)
      }
      assignNavigateTo(allViews)
      const views = mapToObj(allViews, v => {
        const previous = this.previousViews[v.id]
        const view = previous && eq(v, previous) ? previous : v
        viewsCache.set(computedViewKey(v.id), view)
        return [v.id, view] as const
      })
      this.previousViews = { ...views }
      return {
        ...structuredClone(
          pick(model, [
            'specification',
            'elements',
            'relations',
            'globals',
            'deployments'
          ])
        ),
        views
      }
    })
  }

  public async buildComputedModel(
    cancelToken?: Cancellation.CancellationToken
  ): Promise<c4.ComputedLikeC4Model | null> {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedLikeC4Model | null>
    if (cache.has(CACHE_KEY_COMPUTED_MODEL)) {
      return cache.get(CACHE_KEY_COMPUTED_MODEL)!
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      const model = this.unsafeSyncBuildModel()
      if (!model) {
        return null
      }
      return this.unsafeSyncBuildComputedModel(model)
    })
  }

  public async computeView(
    viewId: ViewId,
    cancelToken?: Cancellation.CancellationToken
  ): Promise<c4.ComputedView | null> {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    const cacheKey = computedViewKey(viewId)
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      return cache.get(cacheKey, () => {
        const model = this.unsafeSyncBuildModel()
        const view = model?.views[viewId]
        if (!view) {
          logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
          return null
        }
        const result = mkComputeView(model)(view)
        if (!result.isSuccess) {
          logError(result.error)
          return null
        }
        let computedView = result.view

        const allElementViews = pipe(
          model.views,
          values(),
          filter(isScopedElementView),
          filter(v => v.id !== viewId),
          groupBy(v => v.viewOf)
        )

        for (const node of computedView.nodes) {
          if (!node.navigateTo) {
            const viewsOfNode = allElementViews[node.id]
            if (viewsOfNode) {
              node.navigateTo = viewsOfNode[0].id
            }
          }
        }

        const previous = this.previousViews[viewId]
        if (previous && eq(computedView, previous)) {
          computedView = previous
        } else {
          this.previousViews[viewId] = computedView
        }

        return computedView
      })
    })
  }

  public onModelParsed(callback: ModelParsedListener): Disposable {
    this.listeners.push(callback)
    return Disposable.create(() => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    })
  }

  private documents() {
    return this.langiumDocuments.all.filter(isParsedLikeC4LangiumDocument).toArray()
  }

  private notifyListeners(docs: URI[]) {
    for (const listener of this.listeners) {
      try {
        listener(docs)
      } catch (e) {
        logError(e)
      }
    }
  }
}
function computedViewKey(viewId: string): string {
  return `computed-view-${viewId}`
}
