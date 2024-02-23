import type { Fqn } from '@likec4/core'
import { nameFromFqn, parentFqn } from '@likec4/core'
import type { LangiumDocuments, Stream } from 'langium'
import { DocumentState, DONE_RESULT, MultiMap, stream, StreamImpl } from 'langium'
import type { ast, FqnIndexedDocument } from '../ast'
import { ElementOps, isFqnIndexedDocument, isLikeC4LangiumDocument } from '../ast'
import { logError, logger } from '../logger'
import type { LikeC4Services } from '../module'
import { printDocs } from '../utils/printDocs'
import { computeDocumentFqn } from './fqn-computation'

export interface FqnIndexEntry {
  fqn: Fqn
  name: string
  el: ast.Element
  doc: FqnIndexedDocument
  path: string
}

const True = () => true

export class FqnIndex {
  protected langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.IndexedContent,
      async (docs, _cancelToken) => {
        logger.debug(`[FqnIndex] onIndexedContent ${docs.length}:\n` + printDocs(docs))
        for (const doc of docs) {
          if (isLikeC4LangiumDocument(doc)) {
            delete doc.c4fqns
            delete doc.c4Elements
            delete doc.c4Specification
            delete doc.c4Relations
            delete doc.c4Views
            try {
              computeDocumentFqn(doc, services)
            } catch (e) {
              logError(e)
            }
          }
        }
        return Promise.resolve()
      }
    )
    logger.debug(`[FqnIndex] Created`)
  }

  get documents() {
    return this.langiumDocuments.all.filter(isFqnIndexedDocument)
  }

  private entries(filterByFqn: (fqn: Fqn) => boolean = True): Stream<FqnIndexEntry> {
    return this.documents.flatMap(doc =>
      doc.c4fqns.entries().flatMap(([fqn, entry]): FqnIndexEntry | FqnIndexEntry[] => {
        if (filterByFqn(fqn)) {
          const el = entry.el.deref()
          if (el) {
            return { ...entry, fqn, el, doc }
          }
        }
        return []
      })
    )
  }

  public getFqn(el: ast.Element): Fqn | null {
    return ElementOps.readId(el) ?? null
    // let fqn = ElementOps.readId(el) ?? null
    // if (fqn) {
    //   const doc = getDocument(el)
    //   if (isFqnIndexedDocument(doc) && doc.c4fqns.has(fqn)) {
    //     return fqn
    //   }
    //   const path = this.services.workspace.AstNodeLocator.getAstNodePath(el)
    //   logError(`Clean cached FQN ${fqn} at ${path}`)
    //   ElementOps.writeId(el, null)
    //   fqn = null
    // }
    // return fqn
  }

  public byFqn(fqn: Fqn): Stream<FqnIndexEntry> {
    return this.documents.flatMap(doc => {
      return doc.c4fqns.get(fqn).flatMap(entry => {
        const el = entry.el.deref()
        if (el) {
          return { fqn, el, doc, path: entry.path, name: entry.name }
        }
        return []
      })
    })
  }

  public directChildrenOf(parent: Fqn): Stream<FqnIndexEntry> {
    return stream([parent]).flatMap(_parent => {
      const children = this.entries(fqn => parentFqn(fqn) === _parent)
        .map((entry): [string, FqnIndexEntry] => [entry.name, entry])
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
  public uniqueDescedants(parent: Fqn): Stream<FqnIndexEntry> {
    return new StreamImpl(
      () => {
        const prefix = `${parent}.`

        const childrenNames = new Set<string>()
        const descedants = [] as FqnIndexEntry[]

        const nested = new MultiMap<string, FqnIndexEntry>()

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
        return DONE_RESULT as IteratorResult<FqnIndexEntry>
      }
    )
  }
}
