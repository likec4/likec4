import {
  type c4,
  compareByFqnHierarchically,
  isElementView,
  isStrictElementView,
  parentFqn,
  type StrictElementView,
  type ViewID
} from '@likec4/core'
import { deepEqual as eq } from 'fast-equals'
import type { URI, WorkspaceCache } from 'langium'
import { DocumentState, interruptAndCheck, type LangiumDocument, type LangiumDocuments } from 'langium'
import {
  filter,
  find,
  flatMap,
  forEach,
  isNullish,
  isNumber,
  isTruthy,
  map,
  mapToObj,
  pipe,
  prop,
  reduce,
  sort,
  values
} from 'remeda'
import { type CancellationToken, Disposable } from 'vscode-languageserver'
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

function buildModel(services: LikeC4Services, docs: ParsedLikeC4LangiumDocument[]) {
  const c4Specification: ParsedAstSpecification = {
    kinds: {},
    relationships: {}
  }
  forEach(map(docs, prop('c4Specification')), spec => {
    Object.assign(c4Specification.kinds, spec.kinds)
    Object.assign(c4Specification.relationships, spec.relationships)
  })
  const resolveLinks = (doc: LangiumDocument, links: c4.NonEmptyArray<string>) => {
    return links.map(l => services.lsp.DocumentLinkProvider.resolveLink(doc, l)) as c4.NonEmptyArray<string>
  }

  const toModelElement = (doc: LangiumDocument) => {
    return ({
      tags,
      links,
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
      technology
    }: ParsedAstElement): c4.Element | null => {
      try {
        const __kind = c4Specification.kinds[kind]
        if (!__kind) {
          logger.warn(`No kind '${kind}' found for ${id}`)
          return null
        }
        color ??= __kind.color
        shape ??= __kind.shape
        icon ??= __kind.icon
        opacity ??= __kind.opacity
        border ??= __kind.border
        return {
          ...(color && { color }),
          ...(shape && { shape }),
          ...(icon && { icon }),
          style: {
            ...(border && { border }),
            ...(isNumber(opacity) && { opacity })
          },
          links: links ? resolveLinks(doc, links) : null,
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
    flatMap(d => d.c4Elements.map(toModelElement(d))),
    filter(isTruthy),
    sort(compareByFqnHierarchically),
    reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && isNullish(acc[parent])) {
          logWarnError(`No parent found for ${el.id}`)
          return acc
        }
        if (el.id in acc) {
          // should not happen, as validated
          logWarnError(`Duplicate element id: ${el.id}`)
          return acc
        }
        acc[el.id] = el
        return acc
      },
      {} as c4.LikeC4Model['elements']
    )
  )

  const toModelRelation = (doc: LangiumDocument) => {
    return ({
      astPath,
      source,
      target,
      kind,
      links,
      id,
      ...model
    }: ParsedAstRelation): c4.Relation | null => {
      if (isNullish(elements[source]) || isNullish(elements[target])) {
        return null
      }

      if (!!kind && kind in c4Specification.relationships) {
        return {
          ...(links && { links: resolveLinks(doc, links) }),
          ...c4Specification.relationships[kind],
          ...model,
          source,
          target,
          kind,
          id
        }
      }
      return {
        ...(links && { links: resolveLinks(doc, links) }),
        ...model,
        source,
        target,
        id
      }
    }
  }

  const relations = pipe(
    flatMap(docs, d => map(d.c4Relations, toModelRelation(d))),
    filter(isTruthy),
    mapToObj(r => [r.id, r])
  )

  const toC4View = (doc: LangiumDocument) => {
    const docUri = doc.uri.toString()
    return (parsedAstView: ParsedAstView): c4.View => {
      let {
        id,
        title,
        description,
        tags,
        links,

        // ignore this property
        astPath: _ignore,

        // model should include discriminant __
        ...model
      } = parsedAstView

      if (parsedAstView.__ === 'element' && isNullish(title) && 'viewOf' in parsedAstView) {
        title ??= elements[parsedAstView.viewOf]?.title ?? null
      }

      if (isNullish(title) && id === 'index') {
        title = 'Landscape view'
      }

      return {
        id,
        title,
        description,
        tags,
        links: links ? resolveLinks(doc, links) : null,
        docUri,
        ...model
      }
    }
  }

  const views = pipe(
    docs,
    flatMap(d => map(d.c4Views, toC4View(d))),
    resolveRelativePaths,
    mapToObj(v => [v.id, v]),
    resolveRulesExtendedViews
  )
  // add index view if not present
  if (!('index' in views)) {
    views['index' as ViewID] = {
      __: 'element',
      id: 'index' as ViewID,
      title: 'Landscape',
      description: null,
      tags: null,
      links: null,
      rules: [
        {
          include: [
            {
              wildcard: true
            }
          ]
        }
      ]
    }
  }

  return {
    elements,
    relations,
    views
  }
}

const RAW_MODEL_CACHE = 'LikeC4RawModel'
const MODEL_CACHE = 'LikeC4Model'

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
        logger.debug(`[ModelBuilder] onValidated (${docs.length} docs)\n${printDocs(docs)}`)
        for (const doc of parser.parse(docs)) {
          parsed.push(doc.uri)
        }
        if (parsed.length > 0) {
          this.notifyListeners(parsed)
        }
        return await Promise.resolve()
      }
    )
    logger.debug(`[ModelBuilder] Created`)
  }

  public async buildModel(cancelToken?: CancellationToken): Promise<c4.LikeC4Model | null> {
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4Model | null>
      return cache.get(RAW_MODEL_CACHE, () => {
        const docs = this.documents()
        if (docs.length === 0) {
          logger.debug('[ModelBuilder] No documents to build model from')
          return null
        }
        logger.debug(`[ModelBuilder] buildModel from ${docs.length} docs:\n${printDocs(docs)}`)
        return buildModel(this.services, docs)
      })
    })
  }

  private previousViews: Record<ViewID, c4.ComputedView> = {}

  public async buildComputedModel(cancelToken?: CancellationToken): Promise<c4.LikeC4ComputedModel | null> {
    const model = await this.buildModel(cancelToken)
    if (!model) {
      return null
    }
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4ComputedModel | null>
      const viewsCache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
      return cache.get(MODEL_CACHE, () => {
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
          elements: model.elements,
          relations: model.relations,
          views
        }
      })
    })
  }

  public async computeView(viewId: ViewID, cancelToken?: CancellationToken): Promise<c4.ComputedView | null> {
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
      const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
      return cache.get(computedViewKey(viewId), () => {
        const index = new LikeC4ModelGraph(model)
        const result = isElementView(view) ? computeView(view, index) : computeDynamicView(view, index)
        if (!result.isSuccess) {
          logError(result.error)
          return null
        }

        const allElementViews = values(model.views).filter(
          (v): v is StrictElementView => isStrictElementView(v) && v.id !== viewId
        )

        let computedView = result.view
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
