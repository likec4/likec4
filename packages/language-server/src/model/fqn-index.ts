import { DocumentState, DONE_RESULT, getDocument, MultiMap, StreamImpl } from 'langium'
import type { AstNodeDescription, AstNodeDescriptionProvider , LangiumDocument} from 'langium'
import type { URI } from 'vscode-uri'
import type { ast} from '../ast';
import { ElementOps, isLikeC4LangiumDocument, type LikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { logger } from '../logger'
import { nameFromFqn, parentFqn } from '@likec4/core/utils'
import type { Fqn } from '@likec4/core/types'
import { strictElementRefFqn } from '../elementRef'
import { isNil } from 'rambdax'
import { isLikeC4Document, LikeC4Document } from '../generated/ast'
import type { SetRequired, SetNonNullable } from 'type-fest'

type FqnIndexedDocument = SetNonNullable<SetRequired<LikeC4LangiumDocument, 'c4fqns'>, 'c4fqns'>

const isFqnIndexedDocument = (doc: LangiumDocument): doc is FqnIndexedDocument =>
  isLikeC4LangiumDocument(doc) && doc.state >= DocumentState.ComputedScopes && !isNil(doc.c4fqns)

export interface FqnIndexEntry {
  fqn: Fqn
  name: string
  doc: LikeC4LangiumDocument
  path: string
}

export class FqnIndex {
  // #fqnMap = new WeakMap<ast.Element, Fqn>()
  // protected readonly descriptions: AstNodeDescriptionProvider

  constructor(private services: LikeC4Services) {
    // this.descriptions = services.workspace.AstNodeDescriptionProvider
    // services.shared.workspace.DocumentBuilder.onUpdate((_changed, removed) => {
    //   for (const uri of [..._changed, ...removed]) {
    //     this.cleanIndexedElements(uri)
    //   }
    // })
    // services.shared.workspace.DocumentBuilder.onBuildPhase(
    //   DocumentState.Parsed,
    //   (docs, _cancelToken) => {
    //     for (const doc of docs) {
    //       this.cleanIndexedElements(doc.uri)
    //       this.doIndexElements(doc as LikeC4LangiumDocument)
    //     }
    //   }
    // )
  }

  private documents() {
    return this.services.shared.workspace.LangiumDocuments.all.filter(isFqnIndexedDocument)
  }

  private entries() {
    return this.documents().flatMap(doc => doc.c4fqns.entries().map(([fqn, path]) => ({ fqn, path, doc })))
  }

  // private index() {
  //   const index = new MultiMap<Fqn, {
  //     path: string,
  //     doc: LikeC4LangiumDocument
  //   }>()
  //   this.entries().toMap()
  //   this.entries().forEach(({ fqn, path, doc }) => {
  //     index.add(fqn, { path, doc })
  //   })
  //   // for (const doc of this.documents()) {
  //   //   doc.c4fqns.entries().forEach(([fqn, path]) => {
  //   //     index.add(fqn, { path, doc })
  //   //   })
  //   // }
  //   return index
  // }

  public get(el: ast.Element): Fqn | null {
    let fqn = ElementOps.readId(el) ?? null
    const doc = getDocument(el)
    if (fqn) {
      if (isFqnIndexedDocument(doc) && doc.c4fqns.has(fqn)) {
        return fqn
      }
      const path = this.services.workspace.AstNodeLocator.getAstNodePath(el)
      logger.error(`Clean cached FQN ${fqn} at ${path}`)
      ElementOps.writeId(el, null)
      fqn = null
    }
    return fqn
  }

  public byFqn(fqn: Fqn) {
    return this.documents()
      .flatMap(doc => {
        return doc.c4fqns.get(fqn).map(path => ({ path, doc }))
      })
  }

  public directChildrenOf(parent: Fqn) {
    return this
      .entries()
      .filter(e => parentFqn(e.fqn) === parent)
      .map((e): FqnIndexEntry => ({ ...e, name: nameFromFqn(e.fqn) }))
  }

  public uniqueDescedants(parent: Fqn) {
    return new StreamImpl(
      () => {
        const prefix = `${parent}.`

        const children = [] as FqnIndexEntry[]
        const childrenNames = new Set<string>()

        const descedants = [] as FqnIndexEntry[]

        this.entries().forEach(e => {
          if (e.fqn.startsWith(prefix)) {
            const name = nameFromFqn(e.fqn)
            const entry = { ...e, name}
            if (parentFqn(e.fqn) === parent) {
              childrenNames.add(name)
              children.push(entry)
            } else {
              descedants.push(entry)
            }
          }
        })

        if (children.length + descedants.length === 0) {
          return null
        }

        const nested = new MultiMap<string, FqnIndexEntry>(
          children.map(entry => [entry.name, entry])
        )

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
