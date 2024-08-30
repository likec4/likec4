import {
  compareByFqnHierarchically,
  compareRelations,
  computeColorValues,
  type CustomColorDefinitions,
  isElementView,
  isScopedElementView,
  parentFqn,
  type ScopedElementView,
  type ViewID
} from '@likec4/core'
import type * as c4 from '@likec4/core'
import { deepEqual as eq } from 'fast-equals'
import type { Cancellation, LangiumDocument, LangiumDocuments, URI, WorkspaceCache } from 'langium'
import { Disposable, DocumentState, interruptAndCheck } from 'langium'
import {
  filter,
  find,
  flatMap,
  forEach,
  indexBy,
  isNonNullish,
  isNullish,
  isNumber,
  isTruthy,
  map,
  mapToObj,
  pipe,
  prop,
  reduce,
  reverse,
  sort,
  values,
  mapValues
} from 'remeda'
import type {
  ParsedAstElement,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedAstView,
  ParsedLikeC4LangiumDocument
} from '../ast'
import { isParsedLikeC4LangiumDocument } from '../ast'
import { logError, logger, logWarnError } from '../logger'
import { computeDynamicView, computeView, LikeC4ModelGraph } from '../model-graph'
import type { LikeC4Services } from '../module'
import { printDocs } from '../utils/printDocs'
import { assignNavigateTo, resolveRelativePaths, resolveRulesExtendedViews } from '../view-utils'

function buildModel(services: LikeC4Services, docs: ParsedLikeC4LangiumDocument[]): c4.ParsedLikeC4Model {
  const c4Specification: ParsedAstSpecification = {
    tags: new Set(),
    elements: {},
    relationships: {},
    colors: {}
  }
  forEach(map(docs, prop('c4Specification')), spec => {
    spec.tags.forEach(t => c4Specification.tags.add(t))
    Object.assign(c4Specification.elements, spec.elements)
    Object.assign(c4Specification.relationships, spec.relationships)
    Object.assign(c4Specification.colors, spec.colors)
  })
  const resolveLinks = (doc: LangiumDocument, links: c4.NonEmptyArray<c4.Link>) => {
    try {
      return links.map(l => ({
        ...l,
        url: services.lsp.DocumentLinkProvider.resolveLink(doc, l.url)
      })) as c4.NonEmptyArray<c4.Link>
    } catch (e) {
      logWarnError(e)
      return null
    }
  }
  
  const customColorDefinitions: CustomColorDefinitions = mapValues(
    c4Specification.colors, 
    c => computeColorValues(c.color))

  const toModelElement = (doc: LangiumDocument) => {
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
          ...(metadata && { metadata }),
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
    sort(compareByFqnHierarchically),
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

  const toModelRelation = (doc: LangiumDocument) => {
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
        }
      }
      return {
        ...(links && { links }),
        ...model,
        source,
        target,
        id
      }
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

  const toC4View = (doc: LangiumDocument) => {
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
        tags,
        links,
        docUri,
        description,
        title,
        id,
        customColorDefinitions
      }
    }
  }

  const parsedViews = docs.flatMap(d => map(d.c4Views, toC4View(d)))
  // Add index view if not present
  if (!parsedViews.some(v => v.id === 'index')) {
    parsedViews.unshift({
      __: 'element',
      id: 'index' as ViewID,
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
    resolveRelativePaths,
    indexBy(prop('id')),
    resolveRulesExtendedViews
  )

  return {
    specification: {
      tags: Array.from(c4Specification.tags),
      elements: c4Specification.elements,
      relationships: c4Specification.relationships
    },
    elements,
    relations,
    views
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
          logger.debug(`[ModelBuilder] onValidated (${docs.length} docs)\n${printDocs(docs)}`)
          for (const doc of parser.parse(docs)) {
            parsed.push(doc.uri)
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

  public syncBuildModel(): c4.ParsedLikeC4Model | null {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ParsedLikeC4Model | null>
    return cache.get(CACHE_KEY_PARSED_MODEL, () => {
      const docs = this.documents()
      if (docs.length === 0) {
        logger.debug('[ModelBuilder] No documents to build model from')
        return null
      }
      logger.debug(`[ModelBuilder] buildModel from ${docs.length} docs:\n${printDocs(docs)}`)
      return buildModel(this.services, docs)
    })
  }

  public async buildModel(cancelToken?: Cancellation.CancellationToken): Promise<c4.ParsedLikeC4Model | null> {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ParsedLikeC4Model | null>
    if (cache.has(CACHE_KEY_PARSED_MODEL)) {
      return cache.get(CACHE_KEY_PARSED_MODEL)!
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      return this.syncBuildModel()
    })
  }

  private previousViews: Record<ViewID, c4.ComputedView> = {}

  public syncBuildComputedModel(model: c4.ParsedLikeC4Model): c4.ComputedLikeC4Model {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedLikeC4Model>
    const viewsCache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(CACHE_KEY_COMPUTED_MODEL, () => {
      const index = new LikeC4ModelGraph(model)

      const allViews = [] as c4.ComputedView[]
      for (const view of values(model.views)) {
        const result = isElementView(view) ? computeView(view, index) : computeDynamicView(view, index)
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
        specification: model.specification,
        elements: model.elements,
        relations: model.relations,
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
    const model = await this.buildModel(cancelToken)
    if (!model) {
      return null
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      return this.syncBuildComputedModel(model)
        const allViews = [] as c4.ComputedView[]
        for (const view of values(model.views)) {
          const result = isElementView(view) ? computeView(view, index) : computeDynamicView(view, index)

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
          elements: model.elements,
          relations: model.relations,
          views
        }
      })
    })
  }

  public async computeView(
    viewId: ViewID,
    cancelToken?: Cancellation.CancellationToken
  ): Promise<c4.ComputedView | null> {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    const cacheKey = computedViewKey(viewId)
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }
    const model = await this.buildModel(cancelToken)
    const view = model?.views[viewId]
    if (!view) {
      logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
      return null
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      return cache.get(cacheKey, () => {
        const index = new LikeC4ModelGraph(model)
        const result = isElementView(view) ? computeView(view, index) : computeDynamicView(view, index)
        if (!result.isSuccess) {
          logError(result.error)
          return null
        }
        let computedView = result.view

        const allElementViews = values(model.views).filter(
          (v): v is ScopedElementView => isScopedElementView(v) && v.id !== viewId
        )

        computedView.nodes.forEach(node => {
          if (!node.navigateTo) {
            // find first element view that is not the current one
            const navigateTo = find(allElementViews, v => v.viewOf === node.id)
            if (navigateTo) {
              node.navigateTo = navigateTo.id
            }
          }
        })

        const previous = this.previousViews[viewId]
        computedView = previous && eq(computedView, previous) ? previous : computedView
        this.previousViews[viewId] = computedView

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
