import type { Fqn } from '@likec4/core'
import { nameFromFqn, parentFqn } from '@likec4/core'
import type { AstNodeDescription, LangiumDocuments, Stream } from 'langium'
import { DocumentState, DONE_RESULT, MultiMap, stream, StreamImpl } from 'langium'
import type { ast, DocFqnIndexAstNodeDescription, FqnIndexedDocument } from '../ast'
import { ElementOps, isFqnIndexedDocument, isLikeC4LangiumDocument } from '../ast'
import { logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { computeDocumentFqn } from './fqn-computation'

export interface FqnIndexEntry {
  fqn: Fqn
  name: string
  el: ast.Element
  doc: FqnIndexedDocument
  path: string
}

export class FqnIndex extends ADisposable {
  protected langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    super()
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    this.onDispose(
      services.shared.workspace.DocumentBuilder.onBuildPhase(
        DocumentState.IndexedContent,
        async (docs, _cancelToken) => {
          for (const doc of docs) {
            if (isLikeC4LangiumDocument(doc)) {
              delete doc.c4fqnIndex
              delete doc.c4Elements
              delete doc.c4Specification
              delete doc.c4Relations
              delete doc.c4Deployments
              delete doc.c4DeploymentRelations
              delete doc.c4Globals
              delete doc.c4Views
              try {
                computeDocumentFqn(doc, services)
              } catch (e) {
                logWarnError(e)
              }
            }
          }
          return await Promise.resolve()
        },
      ),
    )
    logger.debug(`[FqnIndex] Created`)
  }

  get documents() {
    return this.langiumDocuments.all.filter(isFqnIndexedDocument)
  }

  private entries(filterByFqn: (fqn: Fqn) => boolean): Stream<DocFqnIndexAstNodeDescription> {
    return this.documents.flatMap(doc => {
      return doc.c4fqnIndex.keys().filter(filterByFqn).flatMap(fqn => doc.c4fqnIndex.get(fqn))
    })
  }

  public getFqn(el: ast.Element): Fqn | null {
    return ElementOps.readId(el) ?? null
  }

  public byFqn(fqn: Fqn): Stream<AstNodeDescription> {
    return this.documents.flatMap(doc => {
      return doc.c4fqnIndex.get(fqn)
    })
  }

  public directChildrenOf(parent: Fqn): Stream<AstNodeDescription> {
    return stream([parent]).flatMap(_parent => {
      const children = this.entries(fqn => parentFqn(fqn) === _parent)
        .map((entry) => [entry.name, entry] as [string, AstNodeDescription])
        .toArray()
      if (children.length === 0) {
        return []
      }
      return new MultiMap(children)
        .entriesGroupedByKey()
        .flatMap(([_name, descrs]) => (descrs.length === 1 ? descrs : []))
        .iterator()
    })
  }

  /**
   * Returns descedant elements with unique names in the scope
   */
  public uniqueDescedants(parent: Fqn): Stream<AstNodeDescription> {
    return new StreamImpl(
      () => {
        const prefix = `${parent}.`

        const childrenNames = new Set<string>()
        const descedants = [] as AstNodeDescription[]

        const nested = new MultiMap<string, AstNodeDescription>()

        this.entries(f => f.startsWith(prefix)).forEach(e => {
          const name = nameFromFqn(e.fqn)
          const entry = { ...e, name }
          // To keep direct children always
          if (parentFqn(e.fqn) === parent) {
            childrenNames.add(name)
            nested.add(name, entry)
          } else {
            descedants.push(entry)
          }
        })

        if (nested.size + descedants.length === 0) {
          return null
        }

        for (const descedant of descedants) {
          if (!childrenNames.has(descedant.name)) {
            nested.add(descedant.name, descedant)
          }
        }

        return nested
          .entriesGroupedByKey()
          .flatMap(([_name, descrs]) => (descrs.length === 1 ? descrs : []))
          .iterator()
      },
      iterator => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT as IteratorResult<AstNodeDescription>
      },
    )
  }
}
