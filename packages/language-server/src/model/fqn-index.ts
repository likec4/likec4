import { DocumentState, DONE_RESULT, MultiMap, StreamImpl } from 'langium'
import type { AstNodeDescription, AstNodeDescriptionProvider } from 'langium'
import type { URI } from 'vscode-uri'
import { ast, ElementOps, type LikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { logger } from '../logger'
import { parentFqn } from '@likec4/core/utils'
import { Fqn } from '@likec4/core/types'
import { strictElementRefFqn } from '../elementRef'

export class FqnIndex {

  // #fqnMap = new WeakMap<ast.Element, Fqn>()

  #index = new MultiMap<Fqn, AstNodeDescription>()

  protected readonly descriptions: AstNodeDescriptionProvider

  constructor(private services: LikeC4Services) {
    this.descriptions = services.workspace.AstNodeDescriptionProvider
    services.shared.workspace.DocumentBuilder.onUpdate((_changed, removed) => {
      for (const uri of [...removed]) {
        this.cleanIndexedElements(uri)
      }
    })
    services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.ComputedScopes, (docs, _cancelToken) => {
      for (const doc of docs) {
        this.cleanIndexedElements(doc.uri)
        this.doIndexElements(doc as LikeC4LangiumDocument)
      }
    })

  }

  public get(el: ast.Element): Fqn | null {
    let fqn = ElementOps.readId(el) ?? null
    // if ()
    // let fqn = this.#fqnMap.get(el) ?? null
    if (fqn && !this.#index.has(fqn)) {
      const path = this.services.workspace.AstNodeLocator.getAstNodePath(el)
      logger.error(`Clean cached FQN ${fqn} at ${path}`)
      // this.#fqnMap.delete(el)
      fqn = null
    }
    return fqn
  }

  public byFqn(fqn: Fqn) {
    return this.#index.get(fqn)
  }

  public directChildrenOf(parent: Fqn) {
    return this.#index
      .entriesGroupedByKey()
      .flatMap(([fqn, descrs]) => (descrs.length === 1 && parentFqn(fqn) === parent) ? descrs : [])
  }

  public uniqueDescedants(parent: Fqn) {
    return new StreamImpl(
      () => {
        const prefix = `${parent}.`

        const children = [] as [Fqn, AstNodeDescription][]
        const childrenNames = new Set<string>()

        const descedants = [] as [Fqn, AstNodeDescription][]

        this.#index.entries().forEach(([fqn, desc]) => {
          if (fqn.startsWith(prefix)) {
            if (parentFqn(fqn) === parent) {
              childrenNames.add(desc.name)
              children.push([fqn, desc])
            } else {
              descedants.push([fqn, desc])
            }
          }
        })

        if ((children.length + descedants.length) === 0) {
          return null
        }

        const nested = new MultiMap<string, AstNodeDescription>(
          children.map(([_fqn, desc]) => [desc.name, desc])
        )

        for (const [_, indexed] of descedants) {
          if (!childrenNames.has(indexed.name)) {
            nested.add(indexed.name, indexed)
          }
        }
        return nested
          .entriesGroupedByKey()
          .flatMap(([_name, descrs]) => descrs.length === 1 ? descrs : [])
          .iterator()
      },
      (iterator) => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT as IteratorResult<AstNodeDescription>
      }
    )
  }

  private doIndexElements(doc: LikeC4LangiumDocument) {

    const visitElement = (element: ast.Element, parent: Fqn | null = null) => {
      try {
        const name = element.name
        const fqn = Fqn(name, parent)
        this.#index.add(fqn, this.descriptions.createDescription(element, name, doc))
        ElementOps.writeId(element, fqn)
        // this.#fqnMap.set(element, fqn)
        if (element.body) {
          for (const nested of element.body.elements) {
            if (ast.isElement(nested)) {
              visitElement(nested, fqn)
            }
          }
        }
      } catch (e) {
        logger.warn(e)
      }
    }

    const visitExtendElement = (extendElement: ast.ExtendElement) => {
      try {
        const fqn = strictElementRefFqn(extendElement.element)
        for (const nested of extendElement.body.elements) {
          if (ast.isElement(nested)) {
            visitElement(nested, fqn)
          }
        }
      } catch (e) {
        logger.warn(e)
      }
    }

    const elements = doc.parseResult.value.model?.elements ?? []
    for (const modelElement of elements) {
      if (ast.isExtendElement(modelElement)) {
        visitExtendElement(modelElement)
        continue
      }
      if (ast.isElement(modelElement)) {
        visitElement(modelElement)
        continue
      }
    }
  }

  private cleanIndexedElements(docUri: URI) {
    const docUriAsString = docUri.toString()
    const toDelete = this.#index.entries().filter(([, indexed]) => indexed.documentUri.toString() === docUriAsString)
    for (const [fqn, indexed] of toDelete.toArray()) {
      this.#index.delete(fqn, indexed)
    }
  }
}
