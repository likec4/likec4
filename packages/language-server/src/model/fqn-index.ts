import type { Fqn } from '@likec4/core'
import { nameFromFqn, parentFqn } from '@likec4/core'
import type { LangiumDocument, LangiumDocuments, Stream } from 'langium'
import { DONE_RESULT, DocumentState, MultiMap, StreamImpl } from 'langium'
import { isNil } from 'remeda'
import type { ast } from '../ast'
import { ElementOps, isLikeC4LangiumDocument, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'
import { computeDocumentFqn } from './fqn-computation'

type FqnIndexedDocument = Omit<LikeC4LangiumDocument, 'c4fqns'> & {
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
  doc: LikeC4LangiumDocument
  path: string
}

export class FqnIndex {
  protected langiumDocuments: LangiumDocuments

  constructor(services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.IndexedContent,
      (docs, _cancelToken) => {
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

  private entries() {
    return this.documents().flatMap(doc =>
      doc.c4fqns.entries().map(([fqn, path]) => ({ fqn, path, doc }))
    )
  }

  public getFqn(el: ast.Element): Fqn | null {
    return ElementOps.readId(el) ?? null
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

  public byFqn(fqn: Fqn): Stream<{
    path: string
    doc: LikeC4LangiumDocument
  }> {
    return this.documents().flatMap(doc => {
      return doc.c4fqns.get(fqn).map(path => ({ path, doc }))
    })
  }

  public directChildrenOf(parent: Fqn): Stream<FqnIndexEntry> {
    return new StreamImpl(
      () => {
        const children = this.entries()
          .filter(e => parentFqn(e.fqn) === parent)
          .map((e): [string, FqnIndexEntry] => {
            const name = nameFromFqn(e.fqn)
            const entry = { ...e, name }
            return [name, entry]
          })
          .toArray()

        if (children.length === 0) {
          return null
        }
        return new MultiMap(children)
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

        this.entries()
          .filter(e => e.fqn.startsWith(prefix))
          .forEach(e => {
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
