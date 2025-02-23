import { type Fqn, AsFqn } from '@likec4/core/types'
import { ancestorsFqn, DefaultWeakMap } from '@likec4/core/utils'
import {
  type AstNodeDescription,
  type LangiumDocuments,
  type Stream,
  DocumentState,
  MultiMap,
  stream,
  WorkspaceCache,
} from 'langium'
import { forEachObj, groupBy, isDefined, isEmpty, pipe, prop } from 'remeda'
import {
  type DocFqnIndexAstNodeDescription,
  type LikeC4LangiumDocument,
  ast,
  ElementOps,
  isLikeC4LangiumDocument,
} from '../ast'
import { logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { getFqnElementRef } from '../utils/elementRef'

export class FqnIndex extends ADisposable {
  protected langiumDocuments: LangiumDocuments
  protected workspaceCache: WorkspaceCache<string, DocFqnIndexAstNodeDescription[]>
  protected documentCache: DefaultWeakMap<LikeC4LangiumDocument, ModelFqnDocumentIndex>

  constructor(private services: LikeC4Services) {
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
    logger.debug(`[FqnIndex] Created`)
  }

  private documents() {
    return this.langiumDocuments.all.filter((d): d is LikeC4LangiumDocument =>
      isLikeC4LangiumDocument(d) && d.state >= DocumentState.IndexedContent
    )
  }

  public get(document: LikeC4LangiumDocument): ModelFqnDocumentIndex {
    if (document.state < DocumentState.IndexedContent) {
      logWarnError(`Document ${document.uri.path} is not indexed`)
    }
    return this.documentCache.get(document)
  }

  public getFqn(el: ast.Element): Fqn | null {
    return ElementOps.readId(el) ?? null
  }

  public byFqn(fqn: Fqn): Stream<DocFqnIndexAstNodeDescription> {
    return this.documents().flatMap(doc => {
      return this.get(doc).byFqn(fqn)
    })
  }

  public directChildrenOf(parent: Fqn): Stream<DocFqnIndexAstNodeDescription> {
    const childrenOf = this.workspaceCache.get(`children@${parent}`, () => {
      return this.documents()
        .reduce((map, doc) => {
          this.get(doc).children(parent).forEach(desc => {
            map.add(desc.name, desc)
          })
          return map
        }, new MultiMap<string, DocFqnIndexAstNodeDescription>())
        .entriesGroupedByKey()
        .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
        .toArray()
    })
    return stream(childrenOf)
  }

  /**
   * Returns descedant elements with unique names in the scope
   */
  public uniqueDescedants(parent: Fqn): Stream<DocFqnIndexAstNodeDescription> {
    const descendants = this.workspaceCache.get(`descendants@${parent}`, () => {
      const {
        children,
        descendants,
      } = this.documents()
        .reduce((map, doc) => {
          const docIndex = this.get(doc)
          docIndex.children(parent).forEach(desc => {
            map.children.add(desc.name, desc)
          })
          docIndex.descendants(parent).forEach(desc => {
            map.descendants.add(desc.name, desc)
          })
          return map
        }, {
          children: new MultiMap<string, DocFqnIndexAstNodeDescription>(),
          descendants: new MultiMap<string, DocFqnIndexAstNodeDescription>(),
        })
      return children
        .entriesGroupedByKey()
        .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
        .concat(
          descendants
            .entriesGroupedByKey()
            .flatMap(([_name, descs]) => (descs.length === 1 && !children.has(_name) ? descs : [])),
        )
        .toArray()
    })
    return stream(descendants)
  }

  private createDocumentIndex(document: LikeC4LangiumDocument): ModelFqnDocumentIndex {
    const rootElements = document.parseResult.value.models.flatMap(m => m.elements)
    if (rootElements.length === 0) {
      return ModelFqnDocumentIndex.EMPTY
    }
    const root = new Array<DocFqnIndexAstNodeDescription>()
    const children = new MultiMap<Fqn, DocFqnIndexAstNodeDescription>()
    const descendants = new MultiMap<Fqn, DocFqnIndexAstNodeDescription>()
    const byfqn = new MultiMap<Fqn, DocFqnIndexAstNodeDescription>()
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider
    const Names = this.services.references.NameProvider

    const createAndSaveDescription = (node: ast.Element, name: string, fqn: Fqn) => {
      const desc = {
        ...Descriptions.createDescription(node, name, document),
        fqn,
      }
      ElementOps.writeId(node, fqn)
      byfqn.add(fqn, desc)
      return desc
    }

    const traverseNode = (
      el: ast.Element | ast.ExtendElement,
      parentFqn: Fqn | null,
    ): readonly DocFqnIndexAstNodeDescription[] => {
      let thisFqn: Fqn
      if (ast.isElement(el)) {
        thisFqn = AsFqn(el.name, parentFqn)
        const desc = createAndSaveDescription(el, el.name, thisFqn)
        if (!parentFqn) {
          root.push(desc)
        } else {
          children.add(parentFqn, desc)
        }
      } else {
        thisFqn = getFqnElementRef(el.element)
      }

      let _nested = [] as DocFqnIndexAstNodeDescription[]
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

      const directChildren = children.get(thisFqn)
      const directChildrenNames = new Set<string>(directChildren.map(c => c.name))

      _nested = directChildren
        .concat(_nested.filter(n => !directChildrenNames.has(n.name)))

      pipe(
        _nested,
        groupBy(prop('name')),
        forEachObj((descs) => {
          if (descs.length === 1) {
            descendants.add(thisFqn, descs[0])
          }
        }),
      )

      if (ast.isExtendElement(el)) {
        _nested = [...descendants.get(thisFqn)]
        ancestorsFqn(thisFqn).forEach(ancestor => {
          descendants.addAll(ancestor, _nested)
        })
      }

      return descendants.get(thisFqn)
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

    return new ModelFqnDocumentIndex(root, children, descendants, byfqn)
  }
}

class ModelFqnDocumentIndex {
  static readonly EMPTY = new ModelFqnDocumentIndex([], new MultiMap(), new MultiMap(), new MultiMap())

  constructor(
    private _rootElements: Array<DocFqnIndexAstNodeDescription>,
    /**
     * direct children of elements
     */
    private _children: MultiMap<Fqn, DocFqnIndexAstNodeDescription>,
    /**
     * All descendants of an element (unique by name)
     */
    private _descendants: MultiMap<Fqn, DocFqnIndexAstNodeDescription>,
    /**
     * All elements by FQN
     */
    private _byfqn: MultiMap<Fqn, DocFqnIndexAstNodeDescription>,
  ) {}

  public rootElements(): readonly DocFqnIndexAstNodeDescription[] {
    return this._rootElements
  }

  public byFqn(fqn: Fqn): readonly DocFqnIndexAstNodeDescription[] {
    return this._byfqn.get(fqn)
  }

  public children(parent: Fqn): readonly DocFqnIndexAstNodeDescription[] {
    return this._children.get(parent)
  }

  public descendants(nodeName: Fqn): readonly DocFqnIndexAstNodeDescription[] {
    return this._descendants.get(nodeName)
  }
}
