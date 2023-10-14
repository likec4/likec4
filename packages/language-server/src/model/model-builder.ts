import {
  compareByFqnHierarchically,
  invariant,
  isStrictElementView,
  parentFqn,
  type StrictElementView,
  type ViewID,
  type c4
} from '@likec4/core'
import type { URI, WorkspaceCache } from 'langium'
import {
  DocumentState,
  interruptAndCheck,
  type LangiumDocument,
  type LangiumDocuments
} from 'langium'
import * as R from 'remeda'
import { Disposable } from 'vscode-languageserver'
import type {
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedAstSpecification,
  ParsedLikeC4LangiumDocument
} from '../ast'
import { isValidLikeC4LangiumDocument } from '../ast'
import { logError, logWarnError, logger } from '../logger'
import type { LikeC4Services } from '../module'
import { LikeC4WorkspaceManager } from '../shared'
import { printDocs, queueMicrotask } from '../utils'
import { assignNavigateTo, resolveRelativePaths, resolveRulesExtendedViews } from '../view-utils'
import { LikeC4ModelGraph, computeView } from '@likec4/graph'

function isRelativeLink(link: string) {
  return link.startsWith('.') || link.startsWith('/')
}

function buildModel(docs: ParsedLikeC4LangiumDocument[]) {
  const c4Specification: ParsedAstSpecification = {
    kinds: {}
  }
  R.forEach(R.map(docs, R.prop('c4Specification')), spec =>
    Object.assign(c4Specification.kinds, spec.kinds)
  )

  const resolveLinks = (doc: LangiumDocument, links: c4.NonEmptyArray<string>) => {
    const base = new URL(doc.uri.toString())
    return links.map(l =>
      isRelativeLink(l) ? new URL(l, base).toString() : l
    ) as c4.NonEmptyArray<string>
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

  const toModelRelation = ({
    astPath,
    source,
    target,
    ...model
  }: ParsedAstRelation): c4.Relation | null => {
    if (source in elements && target in elements) {
      return {
        source,
        target,
        ...model
      }
    }
    return null
  }

  const relations = R.pipe(
    R.flatMap(docs, d => d.c4Relations),
    R.map(toModelRelation),
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
  private workspaceManager: LikeC4WorkspaceManager
  private listeners: ModelParsedListener[] = []

  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    invariant(services.shared.workspace.WorkspaceManager instanceof LikeC4WorkspaceManager)
    this.workspaceManager = services.shared.workspace.WorkspaceManager
    const parser = services.likec4.ModelParser
    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Validated,
      async (docs, cancelToken) => {
        await queueMicrotask(() => parser.parse(docs))
        // Only allow interrupting the execution after all documents have been parsed
        await interruptAndCheck(cancelToken)
        this.notifyListeners(docs.map(d => d.uri))
      }
    )
  }

  public get workspaceUri() {
    return this.workspaceManager.workspace()?.uri ?? null
  }

  public buildRawModel(): c4.LikeC4RawModel | null {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4RawModel | null>
    return cache.get(RAW_MODEL_CACHE, () => {
      try {
        const docs = this.documents()
        if (docs.length === 0) {
          logger.debug('[ModelBuilder] No documents to build model from')
          return null
        }
        logger.debug(`[ModelBuilder] buildModel from ${docs.length} docs:\n${printDocs(docs)}`)
        return buildModel(docs)
      } catch (e) {
        logError(e)
        return null
      }
    })
  }

  public buildModel(): c4.LikeC4Model | null {
    const cache = this.services.WorkspaceCache as WorkspaceCache<string, c4.LikeC4Model | null>
    return cache.get(MODEL_CACHE, () => {
      const model = this.buildRawModel()
      if (!model) {
        return null
      }
      const index = new LikeC4ModelGraph(model)

      const views = R.pipe(
        R.values(model.views),
        R.map(view => computeView(view, index).view),
        R.compact
      )
      assignNavigateTo(views)
      return {
        elements: model.elements,
        relations: model.relations,
        views: R.mapToObj(views, v => [v.id, v])
      }
    })
  }

  public computeView(viewId: ViewID): c4.ComputedView | null {
    const model = this.buildRawModel()
    const view = model?.views[viewId]
    if (!view) {
      logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
      return null
    }
    const index = new LikeC4ModelGraph(model)
    const result = computeView(view, index)
    if (!result.isSuccess) {
      logError(result.error)
      return null
    }

    const allElementViews = R.values(model.views).filter(
      (v): v is StrictElementView => isStrictElementView(v) && v.id !== viewId
    )

    const computedView = result.view
    computedView.nodes.forEach(node => {
      // find first element view that is not the current one
      const navigateTo = R.find(allElementViews, v => v.viewOf === node.id)
      if (navigateTo) {
        node.navigateTo = navigateTo.id
      }
    })

    return computedView
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
    return this.langiumDocuments.all.filter(isValidLikeC4LangiumDocument).toArray()
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
