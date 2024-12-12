import type { Fqn } from '@likec4/core'
import type { LangiumDocument, LangiumDocuments, Stream } from 'langium'
import { AstUtils, DocumentState, MultiMap } from 'langium'
import { forEachObj, groupBy, isTruthy, pipe, prop } from 'remeda'
import {
  ast,
  type DeploymentAstNodeDescription,
  ElementOps,
  isLikeC4LangiumDocument,
  type LikeC4LangiumDocument
} from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'

const DeploymentsIndexKey = Symbol.for('DeploymentsIndex')

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
    return this.langiumDocuments.all.filter((d): d is LikeC4LangiumDocument =>
      isLikeC4LangiumDocument(d) && d.state >= DocumentState.IndexedContent
    )
  }

  public get(document: LikeC4LangiumDocument): DocumentDeploymentsIndex {
    if (document.state < DocumentState.IndexedContent) {
      logWarnError(`Document ${document.uri.path} is not indexed`)
    }
    return (document as IndexedDocument)[DeploymentsIndexKey] ??= this.createDocumentIndex(document)
  }
  /**
   * Nested elements (nodes/artifacts) of the node
   * @param nodeName Name of the deployment node
   * @returns Stream of artifacts
   */
  public nested(node: ast.DeploymentNode): Stream<DeploymentAstNodeDescription> {
    const fqnName = this.getFqnName(node)
    return this.documents().flatMap(doc => this.get(doc).nested(fqnName))
  }

  public byFqn(fqnName: string): Stream<DeploymentAstNodeDescription> {
    return this.documents().flatMap(doc => this.get(doc).byFqn(fqnName))
  }

  public getFqnName(node: ast.DeploymentElement): Fqn {
    let id = ElementOps.readId(node)
    if (isTruthy(id)) {
      return id
    }
    const fqn = [
      this.Names.getNameStrict(node)
    ]
    let parentNode: ast.DeploymentNode | undefined
    while ((parentNode = AstUtils.getContainerOfType(node.$container, ast.isDeploymentNode))) {
      fqn.push(this.Names.getNameStrict(parentNode))
      node = parentNode
    }
    id = fqn.reduceRight((acc, cur) => `${acc}.${cur}`) as Fqn
    ElementOps.writeId(node, id)
    return id
  }

  public createDocumentIndex(document: LikeC4LangiumDocument): DocumentDeploymentsIndex {
    const rootNodes = document.parseResult.value.deployments.flatMap(m => m.elements)
    if (rootNodes.length === 0) {
      return DocumentDeploymentsIndex.EMPTY
    }
    const _root = new Array<DeploymentAstNodeDescription>()
    const _nested = new MultiMap<string, DeploymentAstNodeDescription>()
    const _byfqn = new MultiMap<string, DeploymentAstNodeDescription>()
    const Names = this.Names
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider

    const createAndSaveDescription = (
      props: { node: ast.DeploymentNode | ast.DeployedInstance; name: string; fqn: string }
    ) => {
      const desc = {
        ...Descriptions.createDescription(props.node, props.name, document),
        fqn: props.fqn
      }
      ElementOps.writeId(props.node, props.fqn as Fqn)
      _byfqn.add(props.fqn, desc)
      return desc
    }

    const traverseNode = (
      container: ast.DeploymentNode,
      parentFqn: string
    ): readonly DeploymentAstNodeDescription[] => {
      const _descedants = [] as DeploymentAstNodeDescription[]
      const children = container.body?.elements
      if (!children || children.length === 0) {
        return []
      }
      const directChildren = new Set<string>()
      for (const node of children) {
        if (ast.isDeploymentRelation(node)) {
          continue
        }
        try {
          const name = Names.getName(node)
          if (isTruthy(name)) {
            const fqn = `${parentFqn}.${name}`
            const desc = createAndSaveDescription({ node, name, fqn })
            _nested.add(parentFqn, desc)
            directChildren.add(desc.name)
            if (ast.isDeploymentNode(node) && node.body) {
              _descedants.push(...traverseNode(node, fqn))
            }
          }
        } catch (e) {
          logWarnError(e)
        }
      }
      if (_descedants.length > 0) {
        pipe(
          _descedants,
          groupBy(prop('name')),
          forEachObj((descs, key) => {
            if (descs.length > 1 || directChildren.has(key)) {
              return
            }
            _nested.add(parentFqn, descs[0])
          })
        )
      }
      return _nested.get(parentFqn)
    }

    for (const node of rootNodes) {
      try {
        if (ast.isDeploymentRelation(node)) {
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
  static readonly EMPTY = new DocumentDeploymentsIndex([], new MultiMap(), new MultiMap())

  constructor(
    private _rootNodes: Array<DeploymentAstNodeDescription>,
    /**
     * Nested of a deployment node
     */
    private _nested: MultiMap<string, DeploymentAstNodeDescription>,
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
  public nested(nodeName: string): readonly DeploymentAstNodeDescription[] {
    return this._nested.get(nodeName)
  }

  /**
   * Returns all deployment elements in the document,
   * with unique combination "type and name"
   */
  public unique(): readonly DeploymentAstNodeDescription[] {
    const result = [] as DeploymentAstNodeDescription[]
    pipe(
      [...this._byfqn.values()],
      groupBy(prop('name')),
      forEachObj(descs => {
        if (descs.length === 1) {
          result.push(descs[0])
        }
      })
    )
    return result
  }
}
