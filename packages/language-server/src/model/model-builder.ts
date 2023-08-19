import { ModelIndex, assignNavigateTo, compareByFqnHierarchically, computeView, parentFqn, type c4 } from '@likec4/core'
import type { LangiumDocument, LangiumDocuments } from 'langium'
import { clone } from 'rambdax'
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

function buildModel(docs: ParsedLikeC4LangiumDocument[]) {
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

  const modelIndex = ModelIndex.from({ elements, relations })

  const toModelView = (view: ParsedAstElementView): c4.ComputedView | null => {
    try {
      // eslint-disable-next-line prefer-const
      let { astPath, rules, title, description, tags, links, ...model } = view
      if (!title && view.viewOf) {
        title = elements[view.viewOf]?.title
      }
      if (!title && view.id === 'index') {
        title = 'Landscape view'
      }
      const computeResult = computeView(
        {
          ...model,
          title: title ?? null,
          description: description ?? null,
          tags: tags ?? null,
          links: links ?? null,
          rules: clone(rules)
        },
        modelIndex
      )
      if (!computeResult.isSuccess) {
        logWarnError(computeResult.error)
        return null
      }
      return computeResult.view
    } catch (e) {
      logError(e)
      return null
    }
  }

  const views = R.pipe(
    R.flatMap(docs, d => d.c4Views),
    R.map(toModelView),
    R.compact
  )

  assignNavigateTo(views)

  return {
    elements,
    relations,
    views: R.mapToObj(views, v => [v.id, v])
  }
}

export class LikeC4ModelBuilder {
  private langiumDocuments: LangiumDocuments

  private readonly cachedModel: {
    last?: c4.LikeC4Model | null
  } = {}
  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

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

  public buildModel(): c4.LikeC4Model | null {
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
