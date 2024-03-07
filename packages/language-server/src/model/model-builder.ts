import {
  type c4,
  compareByFqnHierarchically,
  isStrictElementView,
  parentFqn,
  type StrictElementView,
  type ViewID
} from '@likec4/core'
import { computeView, LikeC4ModelGraph } from '@likec4/graph'
import type { URI, WorkspaceCache } from 'langium'
import { DocumentState, interruptAndCheck, type LangiumDocument, type LangiumDocuments } from 'langium'
import * as R from 'remeda'
import { type CancellationToken, Disposable } from 'vscode-languageserver'
import type {
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedLikeC4LangiumDocument
} from '../ast'
import { isParsedLikeC4LangiumDocument } from '../ast'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { printDocs } from '../utils/printDocs'
import { assignNavigateTo, resolveRelativePaths, resolveRulesExtendedViews } from '../view-utils'

function buildModel(services: LikeC4Services, docs: ParsedLikeC4LangiumDocument[]) {
  const c4Specification: ParsedAstSpecification = {
    kinds: {},
    relationships: {}
  }
  R.forEach(R.map(docs, R.prop('c4Specification')), spec => {
    Object.assign(c4Specification.kinds, spec.kinds), Object.assign(c4Specification.relationships, spec.relationships)
  })
  const resolveLinks = (doc: LangiumDocument, links: c4.NonEmptyArray<string>) => {
    return links.map(l => services.lsp.DocumentLinkProvider.resolveLink(doc, l)) as c4.NonEmptyArray<string>
  }

  const toModelElement = (doc: LangiumDocument) => {
    return ({ astPath, tags, links, ...parsed }: ParsedAstElement): c4.Element | null => {
      try {
        const kind = c4Specification.kinds[parsed.kind]
        if (kind) {
          return {
            ...kind,
            description: null,
            technology: null,
            tags: tags ?? null,
            links: links ? resolveLinks(doc, links) : null,
            ...parsed
          }
        }
        logger.warn(`No kind '${parsed.kind}' found for ${parsed.id}`)
      } catch (e) {
        logWarnError(e)
      }
      return null
    }
  }

  const elements = R.pipe(
    R.flatMap(docs, d => d.c4Elements.map(toModelElement(d))),
    R.compact,
    R.sort(compareByFqnHierarchically),
    R.reduce(
      (acc, el) => {
        const parent = parentFqn(el.id)
        if (parent && R.isNil(acc[parent])) {
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
      ...model
    }: ParsedAstRelation): c4.Relation | null => {
      if (source in elements && target in elements) {
        if (!!kind && kind in c4Specification.relationships) {
          return {
            source,
            target,
            kind,
            ...(links && {links: resolveLinks(doc, links)}),
            ...c4Specification.relationships[kind],
            ...model
          }
        }
        return {
          source,
          target,
          ...(links && {links: resolveLinks(doc, links)}),
          ...model
        }
      }
      return null
    }
  }

  const relations = R.pipe(
    R.flatMap(docs, d => R.map(d.c4Relations, toModelRelation(d))),
    R.compact,
    R.mapToObj(r => [r.id, r])
  )

  const toElementView = (doc: LangiumDocument) => {
    const docUri = doc.uri.toString()
    return (view: ParsedAstElementView): c4.ElementView => {
      // eslint-disable-next-line prefer-const
      let { astPath, rules, title, description, tags, links, ...model } = view
      if (!title && 'viewOf' in view) {
        title = elements[view.viewOf]?.title
      }
      if (!title && view.id === 'index') {
        title = 'Landscape view'
      }
      return {
        ...model,
        title: title ?? null,
        description: description ?? null,
        tags: tags ?? null,
        links: links ? resolveLinks(doc, links) : null,
        docUri,
        rules
      }
    }
  }

  const views = R.pipe(
    R.flatMap(docs, d => R.map(d.c4Views, toElementView(d))),
    resolveRelativePaths,
    R.mapToObj(v => [v.id, v]),
    resolveRulesExtendedViews
  )
  // add index view if not present
  if (!('index' in views)) {
    views['index' as ViewID] = {
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

    services.shared.workspace.DocumentBuilder.onUpdate((changed, deleted) => {
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
          parsed.push(...parser.parse(docs).map(d => d.uri))
        } catch (e) {
          logger.error(e)
        }
        if (parsed.length > 0) {
          this.notifyListeners(parsed)
        }
        return await Promise.resolve()
      }
    )
    logger.debug(`[ModelBuilder] Created`)
  }

  public async buildRawModel(cancelToken?: CancellationToken): Promise<c4.LikeC4RawModel | null> {
    return await this.services.shared.workspace.WorkspaceLock.read(async () => {
      if (cancelToken) {
        await interruptAndCheck(cancelToken)
      }
      const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4RawModel | null>
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

  public async buildModel(cancelToken?: CancellationToken): Promise<c4.LikeC4Model | null> {
    const model = await this.buildRawModel(cancelToken)
    if (!model) {
      return null
    }
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4Model | null>
    const viewsCache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(MODEL_CACHE, () => {
      const index = new LikeC4ModelGraph(model)

      const allViews = [] as c4.ComputedView[]
      for (const view of R.values(model.views)) {
        const result = computeView(view, index)
        if (!result.isSuccess) {
          logWarnError(result.error)
          continue
        }
        allViews.push(result.view)
      }
      assignNavigateTo(allViews)
      const views = R.mapToObj(allViews, v => {
        const previous = this.previousViews[v.id]
        const view = previous && R.equals(v, previous) ? previous : v
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
  }

  public async computeView(viewId: ViewID, cancelToken?: CancellationToken): Promise<c4.ComputedView | null> {
    const model = await this.buildRawModel(cancelToken)
    const view = model?.views[viewId]
    if (!view) {
      logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
      return null
    }
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.ComputedView | null>
    return cache.get(computedViewKey(viewId), () => {
      const index = new LikeC4ModelGraph(model)
      const result = computeView(view, index)
      if (!result.isSuccess) {
        logError(result.error)
        return null
      }

      const allElementViews = R.values(model.views).filter(
        (v): v is StrictElementView => isStrictElementView(v) && v.id !== viewId
      )

      let computedView = result.view
      computedView.nodes.forEach(node => {
        if (!node.navigateTo) {
          // find first element view that is not the current one
          const navigateTo = R.find(allElementViews, v => v.viewOf === node.id)
          if (navigateTo) {
            node.navigateTo = navigateTo.id
          }
        }
      })

      const previous = this.previousViews[viewId]
      if (previous) {
        computedView = R.equals(computedView, previous) ? previous : computedView
      }
      this.previousViews[viewId] = computedView

      return computedView
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
