import type { Fqn } from '@likec4/core'
import { nameFromFqn, parentFqn } from '@likec4/core'
import type { LangiumDocument, LangiumDocuments, Stream } from 'langium'
import { DONE_RESULT, DocumentState, MultiMap, StreamImpl, stream } from 'langium'
import { isNil } from 'remeda'
import type { ast } from '../ast'
import { ElementOps, isLikeC4LangiumDocument, type LikeC4LangiumDocument } from '../ast'
import { logError, logger } from '../logger'
import type { LikeC4Services } from '../module'
import { printDocs } from '../utils'
import { computeDocumentFqn } from './fqn-computation'

export type FqnIndexedDocument = Omit<LikeC4LangiumDocument, 'c4fqns'> & {
  c4fqns: NonNullable<LikeC4LangiumDocument['c4fqns']>
}

export function isFqnIndexedDocument(doc: LangiumDocument): doc is FqnIndexedDocument {
  return (
    isLikeC4LangiumDocument(doc) && doc.state >= DocumentState.IndexedContent && !isNil(doc.c4fqns)
  )
}

export interface FqnIndexEntry {
  fqn: Fqn
  name: string
  el: ast.Element
  doc: FqnIndexedDocument
  path: string
}

export class FqnIndex {
  protected langiumDocuments: LangiumDocuments

  constructor(services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    // services.shared.workspace.DocumentBuilder.onUpdate((changed,deleted) => {
    //   logger.debug('') // empty line to separate batches
    //   logger.debug(`[DocumentBuilder.onUpdate]`)
    //   if (changed.length > 0) {
    //     logger.debug(` changed:\n` + changed.map(u => '  - ' + Utils.basename(u)).join('\n'))
    //   }
    //   if (deleted.length > 0) {
    //     logger.debug(` deleted:\n` + deleted.map(u => '  - ' + Utils.basename(u)).join('\n'))
    //   }
    // })
    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Changed,
      (docs, _cancelToken) => {
        logger.debug(`[FqnIndex] onChanged (${docs.length} docs):\n` + printDocs(docs))
        for (const doc of docs) {
          if (isLikeC4LangiumDocument(doc)) {
            delete doc.c4fqns
            delete doc.c4Elements
            delete doc.c4Specification
            delete doc.c4Relations
            delete doc.c4Views
          }
        }
      }
    )
    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.IndexedContent,
      (docs, _cancelToken) => {
        logger.debug(`[FqnIndex] onIndexedContent ${docs.length}:\n` + printDocs(docs))
        for (const doc of docs) {
          if (isLikeC4LangiumDocument(doc)) {
            try {
              computeDocumentFqn(doc, services)
            } catch (e) {
              logError(e)
            }
          }
        }
      }
    )
  }

  private documents() {
    return this.langiumDocuments.all.filter(isFqnIndexedDocument)
  }

  private entries(filterByFqn: (fqn: Fqn) => boolean = () => true): Stream<FqnIndexEntry> {
    return this.documents().flatMap(doc =>
      doc.c4fqns
        .entries()
        .filter(([fqn]) => filterByFqn(fqn))
        .map(([fqn, entry]): FqnIndexEntry | null => {
          const el = entry.el.deref()
          if (el) {
            return { ...entry, fqn, el, doc }
          }
          return null
        })
        .nonNullable()
    )
  }

  public getFqn(el: ast.Element): Fqn | null {
    return el.fqn ?? ElementOps.readId(el) ?? null
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
    return this.documents().flatMap(doc => {
      return doc.c4fqns.get(fqn).flatMap(entry => {
        const el = entry.el.deref()
        if (el) {
          return [{ fqn, el, doc, path: entry.path, name: entry.name }]
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
