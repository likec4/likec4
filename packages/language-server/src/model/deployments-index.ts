import type { LangiumDocument, LangiumDocuments, Stream } from 'langium'
import { AstUtils, DocumentState, EMPTY_STREAM, MultiMap, stream } from 'langium'
import { entries, filter, flat, flatMap, groupBy, isTruthy, map, pipe, uniqueBy } from 'remeda'
import { ast, type DeploymentAstNodeDescription, isFqnIndexedDocument, type LikeC4LangiumDocument } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'

const DeploymentsIndexKey = Symbol('DeploymentsIndex')

type IndexedDocument = LangiumDocument & {
  [DeploymentsIndexKey]?: DocumentDeploymentsIndex
}

export class DeploymentsIndex {
  protected Names: LikeC4NameProvider
  protected langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.Names = services.references.NameProvider
    this.langiumDocuments = services.shared.workspace.LangiumDocuments

    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.IndexedContent,
      (docs, _cancelToken) => {
        for (const doc of docs) {
          delete (doc as IndexedDocument)[DeploymentsIndexKey]
        }
      }
    )
  }

  private documents() {
    return this.langiumDocuments.all.filter(isFqnIndexedDocument)
  }

  public get(document: LikeC4LangiumDocument): DocumentDeploymentsIndex {
    if (!isFqnIndexedDocument(document)) {
      logWarnError(`Document ${document.uri.path} is not indexed`)
    }
    return (document as IndexedDocument)[DeploymentsIndexKey] ??= this.createDocumentIndex(document)
  }

  // private workspace(): DocumentDeploymentsIndex {
  //   return this.globalCache.get(CACHE_KEY, () => {
  //     const [first, ...rest] = this.documents().map(doc => this.get(doc)).toArray()
  //     if (first) {
  //       return rest.reduce((acc, index) => acc.mergeWith(index), first)
  //     }
  //     return indexes.reduce((acc, index) => acc.mergeWith(index))
  //   })
  // }

  /**
   * Nested elements (nodes/artifacts) of the node
   * @param nodeName Name of the deployment node
   * @returns Stream of artifacts
   */
  public children(node: ast.DeploymentNode): Stream<DeploymentAstNodeDescription> {
    const fqnName = this.getFqnName(node)
    return this.documents().flatMap(doc => this.get(doc).children(fqnName))
  }

  public byFqn(fqnName: string): Stream<DeploymentAstNodeDescription> {
    return this.documents().flatMap(doc => this.get(doc).byFqn(fqnName))
  }

  public getFqnName(node: ast.DeploymentNode | ast.DeployedArtifact): string {
    const fqn = [
      this.Names.getNameStrict(node)
    ]
    let container: ast.DeploymentNode | undefined
    while (node.$container && !!(container = AstUtils.getContainerOfType(node.$container, ast.isDeploymentNode))) {
      node = container
      fqn.unshift(this.Names.getNameStrict(node))
    }
    return fqn.join('.')
  }

  public createDocumentIndex(document: LikeC4LangiumDocument): DocumentDeploymentsIndex {
    const rootNodes = document.parseResult.value.deployments.flatMap(m => m.nested)
    if (rootNodes.length === 0) {
      return DocumentDeploymentsIndex.EMPTY
    }
    const _root = new Array<DeploymentAstNodeDescription>()
    const _nested = new MultiMap<string, DeploymentAstNodeDescription>()
    const _byfqn = new MultiMap<string, DeploymentAstNodeDescription>()
    const Names = this.services.references.NameProvider
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider

    const createAndSaveDescription = (
      props: { node: ast.DeploymentNode | ast.DeployedArtifact; name: string; fqn: string }
    ) => {
      const desc = {
        ...Descriptions.createDescription(props.node, props.name, document),
        fqn: props.fqn
      }
      _byfqn.add(props.fqn, desc)
      return desc
    }

    const traverseNode = (node: ast.DeploymentNode, parentFqn: string): readonly DeploymentAstNodeDescription[] => {
      const _descedants = [] as DeploymentAstNodeDescription[]
      const children = node.body?.nested
      if (!children || children.length === 0) {
        return []
      }
      const directChildren = new Set<string>()
      for (const node of children) {
        try {
          const name = Names.getName(node)
          if (isTruthy(name)) {
            const fqn = `${parentFqn}.${name}`
            const desc = createAndSaveDescription({ node, name, fqn })
            if (!directChildren.has(name)) {
              _nested.add(parentFqn, desc)
              directChildren.add(name)
            }
            if (ast.isDeploymentNode(node) && node.body) {
              _descedants.push(...traverseNode(node, fqn))
            }
          }
        } catch (e) {
          logWarnError(e)
        }
      }
      if (_descedants.length > 0) {
        _nested.addAll(
          parentFqn,
          // Unique descendent elements
          pipe(
            _descedants,
            filter(desc => !directChildren.has(desc.name)),
            groupBy(desc => `${desc.type}.${desc.name}`),
            entries(),
            flatMap(([_, descs]) => descs.length === 1 ? descs : [])
          )
        )
      }
      return _nested.get(parentFqn)
    }

    for (const node of rootNodes) {
      try {
        if (!ast.isDeploymentNode(node)) {
          continue
        }
        const name = Names.getName(node)
        if (isTruthy(name)) {
          _root.push(createAndSaveDescription({ node, name, fqn: name }))
          traverseNode(node, name)
        }
      } catch (e) {
        logWarnError(e)
      }
    }
    return new DocumentDeploymentsIndex(_root, _nested, _byfqn)
  }
}

export class DocumentDeploymentsIndex {
  static EMPTY = new DocumentDeploymentsIndex([], new MultiMap(), new MultiMap())

  constructor(
    private _rootNodes: Array<DeploymentAstNodeDescription>,
    /**
     * Children of a deployment node
     */
    private _children: MultiMap<string, DeploymentAstNodeDescription>,
    /**
     * All elements by FQN
     */
    private _byfqn: MultiMap<string, DeploymentAstNodeDescription>
  ) {}

  public rootNodes(): readonly DeploymentAstNodeDescription[] {
    return this._rootNodes
  }

  public byFqn(fqnName: string): readonly DeploymentAstNodeDescription[] {
    return this._byfqn.get(fqnName)
  }

  /**
   * Returns artifacts of a deployment node
   * @param nodeName Name of the deployment node
   * @returns Stream of artifacts
   */
  public children(nodeName: string): readonly DeploymentAstNodeDescription[] {
    return this._children.get(nodeName)
  }
}
