import { invariant, nonNullable } from '@likec4/core'
import { type Fqn, AsFqn } from '@likec4/core/types'
import { ancestorsFqn, compareNatural, DefaultWeakMap, MultiMap, sortNaturalByFqn } from '@likec4/core/utils'
import {
  type AstNode,
  type LangiumDocuments,
  type Stream,
  AstUtils,
  DocumentState,
  stream,
  WorkspaceCache,
} from 'langium'
import { isDefined, isEmpty, isTruthy } from 'remeda'
import {
  type AstNodeDescriptionWithFqn,
  type LikeC4LangiumDocument,
  ast,
  ElementOps,
  isLikeC4LangiumDocument,
} from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { readStrictFqn } from '../utils/elementRef'

export class FqnIndex<AstNd extends AstNode = ast.Element> extends ADisposable {
  protected langiumDocuments: LangiumDocuments
  protected documentCache: DefaultWeakMap<LikeC4LangiumDocument, DocumentFqnIndex>
  protected workspaceCache: WorkspaceCache<string, AstNodeDescriptionWithFqn[]>

  constructor(
    protected services: LikeC4Services,
    private cachePrefix = 'fqn-index',
  ) {
    super()
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.documentCache = new DefaultWeakMap(doc => this.createDocumentIndex(doc))
    this.workspaceCache = new WorkspaceCache(services.shared, DocumentState.IndexedContent)

    this.onDispose(
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.IndexedContent,
        async (doc, _cancelToken) => {
          if (isLikeC4LangiumDocument(doc)) {
            this.documentCache.set(doc, this.createDocumentIndex(doc))
          }
          return await Promise.resolve()
        },
      ),
    )
  }

  private documents() {
    return this.langiumDocuments.all.filter((d): d is LikeC4LangiumDocument =>
      isLikeC4LangiumDocument(d) && d.state >= DocumentState.IndexedContent
    )
  }

  public get(document: LikeC4LangiumDocument): DocumentFqnIndex {
    if (document.state < DocumentState.IndexedContent) {
      logWarnError(`Document ${document.uri.path} is not indexed`)
    }
    return this.documentCache.get(document)
  }

  public getFqn(el: AstNd): Fqn {
    invariant(ast.isElement(el) || ast.isDeploymentElement(el))
    let id = ElementOps.readId(el)
    if (isTruthy(id)) {
      return id
    }
    // Document index is not yet created
    const doc = AstUtils.getDocument(el)
    invariant(isLikeC4LangiumDocument(doc))
    logWarnError(`Document ${doc.uri.path} is not indexed, but getFqn was called`)
    // This will create the document index
    this.get(doc)
    return nonNullable(ElementOps.readId(el), 'Element fqn must be set, invalid state')
  }

  public byFqn(fqn: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(this.workspaceCache.get(`${this.cachePrefix}:${fqn}`, () => {
      return this
        .documents()
        .toArray()
        .flatMap(doc => {
          return this.get(doc).byFqn(fqn)
        })
    }))
  }

  public directChildrenOf(parent: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(
      this.workspaceCache.get(`${this.cachePrefix}:directChildrenOf:${parent}`, () => {
        const allchildren = this.documents()
          .reduce((map, doc) => {
            this.get(doc).children(parent).forEach(desc => {
              map.set(desc.name, desc)
            })
            return map
          }, new MultiMap<string, AstNodeDescriptionWithFqn>())
        return uniqueByName(allchildren)
          .sort((a, b) => compareNatural(a.name, b.name))
      }),
    )
  }

  /**
   * Returns descedant elements with unique names in the scope
   */
  public uniqueDescedants(parent: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(
      this.workspaceCache.get(`${this.cachePrefix}:uniqueDescedants:${parent}`, () => {
        const { children, descendants } = this.documents()
          .reduce((map, doc) => {
            const docIndex = this.get(doc)
            docIndex.children(parent).forEach(desc => {
              map.children.set(desc.name, desc)
            })
            docIndex.descendants(parent).forEach(desc => {
              map.descendants.set(desc.name, desc)
            })
            return map
          }, {
            children: new MultiMap<string, AstNodeDescriptionWithFqn>(),
            descendants: new MultiMap<string, AstNodeDescriptionWithFqn>(),
          })

        const uniqueChildren = uniqueByName(children)
          .sort((a, b) => compareNatural(a.name, b.name))

        const uniqueDescendants = [...descendants.associations()]
          .flatMap(([_name, descs]) => descs.length === 1 && !children.has(_name) ? descs : [])

        return [
          ...uniqueChildren,
          ...sortNaturalByFqn(uniqueDescendants),
        ]
      }),
    )
  }

  protected createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex {
    const rootElements = document.parseResult.value.models.flatMap(m => m.elements)
    if (rootElements.length === 0) {
      return DocumentFqnIndex.EMPTY
    }
    const root = new Array<AstNodeDescriptionWithFqn>()
    const children = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const descendants = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const byfqn = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider

    const createAndSaveDescription = (node: ast.Element, name: string, fqn: Fqn) => {
      const desc = {
        ...Descriptions.createDescription(node, name, document),
        id: fqn,
      }
      ElementOps.writeId(node, fqn)
      byfqn.set(fqn, desc)
      return desc
    }

    const traverseNode = (
      el: ast.Element | ast.ExtendElement,
      parentFqn: Fqn | null,
    ): readonly AstNodeDescriptionWithFqn[] => {
      let thisFqn: Fqn
      if (ast.isElement(el)) {
        thisFqn = AsFqn(el.name, parentFqn)
        const desc = createAndSaveDescription(el, el.name, thisFqn)
        if (!parentFqn) {
          root.push(desc)
        } else {
          children.set(parentFqn, desc)
        }
      } else {
        thisFqn = readStrictFqn(el.element)
      }

      let _nested = [] as AstNodeDescriptionWithFqn[]
      if (isDefined(el.body) && !isEmpty(el.body.elements)) {
        for (const child of el.body.elements) {
          if (!ast.isRelation(child)) {
            try {
              _nested.push(...traverseNode(child, thisFqn))
            } catch (e) {
              logWarnError(e)
            }
          }
        }
      }

      const directChildren = children.get(thisFqn) ?? []
      _nested = [
        ...directChildren,
        ..._nested,
      ]
      for (const child of _nested) {
        descendants.set(thisFqn, child)
      }
      if (ast.isExtendElement(el)) {
        for (const ancestor of ancestorsFqn(thisFqn)) {
          for (const child of _nested) {
            descendants.set(ancestor, child)
          }
        }
      }
      return descendants.get(thisFqn) ?? []
    }

    for (const node of rootElements) {
      try {
        if (ast.isRelation(node)) {
          continue
        }
        traverseNode(node, null)
      } catch (e) {
        logWarnError(e)
      }
    }

    return new DocumentFqnIndex(root, children, descendants, byfqn)
  }
}

function uniqueByName(multimap: MultiMap<string, AstNodeDescriptionWithFqn>) {
  return [...multimap.associations()]
    .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
}

export class DocumentFqnIndex {
  static readonly EMPTY = new DocumentFqnIndex([], new MultiMap(), new MultiMap(), new MultiMap())

  constructor(
    private _rootElements: Array<AstNodeDescriptionWithFqn>,
    /**
     * direct children of elements
     */
    private _children: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
    /**
     * All descendants of an element (unique by name)
     */
    private _descendants: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
    /**
     * All elements by FQN
     */
    private _byfqn: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
  ) {}

  public rootElements(): readonly AstNodeDescriptionWithFqn[] {
    return this._rootElements
  }

  public byFqn(fqn: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._byfqn.get(fqn) ?? []
  }

  public children(parent: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._children.get(parent) ?? []
  }

  public descendants(nodeName: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._descendants.get(nodeName) ?? []
  }
}
