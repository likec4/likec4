import {
  ModelIndex,
  compareByFqnHierarchically,
  parentFqn,
  resolveRulesExtendedViews,
  computeView,
  type ViewID,
  type c4,
  assignNavigateTo,
  type StrictElementView,
  isStrictElementView,
  invariant
} from '@likec4/core'
import type { LangiumDocument, LangiumDocuments } from 'langium'
import { UriUtils, type URI } from 'langium'
import * as R from 'remeda'
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
import { Rpc } from '../protocol'
import { printDocs } from '../utils'
import { LikeC4WorkspaceManager } from '../shared'
import { DocumentSelector } from 'vscode-languageserver-protocol'

function buildModel(docs: ParsedLikeC4LangiumDocument[], workspaceDir?: URI | string) {
  const c4Specification: ParsedAstSpecification = {
    kinds: {}
  }
  R.forEach(R.map(docs, R.prop('c4Specification')), spec => Object.assign(c4Specification.kinds, spec.kinds))

  const toModelElement = (doc: LangiumDocument) => {
    const base = new URL(doc.uri.toString())
    const resolveLinks = (links: c4.NonEmptyArray<string>) =>
      links.map((l: string) => new URL(l, base).toString()) as c4.NonEmptyArray<string>
    return ({ astPath, tags, links, ...parsed }: ParsedAstElement): c4.Element | null => {
      try {
        const kind = c4Specification.kinds[parsed.kind]
        if (kind) {
          return {
            ...kind,
            description: null,
            technology: null,
            tags: tags ?? null,
            links: links ? resolveLinks(links) : null,
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

  const toModelRelation = ({ astPath, source, target, ...model }: ParsedAstRelation): c4.Relation | null => {
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
    return (view: ParsedAstElementView): c4.ElementView | null => {
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
        links: links ?? null,
        docUri,
        rules
      }
    }
  }

  const views = R.pipe(
    R.flatMap(docs, d => R.map(d.c4Views, toElementView(d))),
    R.compact,
    R.mapToObj(v => [v.id, v])
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
          isInclude: true,
          exprs: [
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
    views: resolveRulesExtendedViews(views)
  }
}

export class LikeC4ModelBuilder {
  private langiumDocuments: LangiumDocuments
  private workspaceManager: LikeC4WorkspaceManager

  private readonly cachedModel: {
    last?: c4.LikeC4RawModel | null
  } = {}
  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    invariant(services.shared.workspace.WorkspaceManager instanceof LikeC4WorkspaceManager)
    this.workspaceManager = services.shared.workspace.WorkspaceManager

    services.likec4.ModelParser.onParsed(() => {
      this.cleanCache()
      this.notifyClient()
    })
  }

  private cleanCache() {
    delete this.cachedModel.last
  }

  private documents() {
    return this.langiumDocuments.all.filter(isValidLikeC4LangiumDocument).toArray()
  }

  public buildRawModel(): c4.LikeC4RawModel | null {
    if ('last' in this.cachedModel) {
      logger.debug('[ModelBuilder] returning cached model')
      return this.cachedModel.last
    }
    try {
      const docs = this.documents()
      if (docs.length === 0) {
        logger.debug('[ModelBuilder] No documents to build model from')
        return null
      }
      logger.debug(`[ModelBuilder] buildModel from ${docs.length} docs:\n${printDocs(docs)}`)
      return (this.cachedModel.last = buildModel(docs))
    } catch (e) {
      logError(e)
      return null
    }
  }

  public buildModel(): c4.LikeC4Model | null {
    const model = this.buildRawModel()
    if (!model) {
      return null
    }
    const index = ModelIndex.from(model)

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
  }

  public computeView(viewId: ViewID): c4.ComputedView | null {
    const model = this.buildRawModel()
    const view = model?.views[viewId]
    if (!view) {
      logger.warn(`[ModelBuilder] Cannot find view ${viewId}`)
      return null
    }
    const result = computeView(view, ModelIndex.from(model))
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

  private scheduledCb: NodeJS.Timeout | null = null
  private notifyClient() {
    const connection = this.services.shared.lsp.Connection
    if (!connection) {
      return
    }
    if (this.scheduledCb) {
      logger.debug('[ModelBuilder] debounce onDidChangeModel')
      clearTimeout(this.scheduledCb)
    }
    this.scheduledCb = setTimeout(() => {
      this.scheduledCb = null
      logger.debug('[ModelBuilder] send onDidChangeModel')
      void connection.sendNotification(Rpc.onDidChangeModel, '')
    }, 200)
  }
}
