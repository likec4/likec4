import type { AstNodeDescription, DocumentCache, LangiumDocuments, Stream } from 'langium'
import { EMPTY_STREAM, MultiMap, stream } from 'langium'
import { isTruthy } from 'remeda'
import type { DeployedArtifactAstNodeDescription, LikeC4LangiumDocument } from '../ast'
import { isLikeC4LangiumDocument } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'

class DocumentDeploymentsIndex {
  static create(document: LikeC4LangiumDocument, services: LikeC4Services): DocumentDeploymentsIndex {
    const nodes = new MultiMap<string, AstNodeDescription>()
    const nodeArtifacts = new MultiMap<string, DeployedArtifactAstNodeDescription>()
    const Names = services.references.NameProvider
    const Descriptions = services.workspace.AstNodeDescriptionProvider
    const { deployments } = document.parseResult.value
    for (const deploymentNode of deployments.flatMap(d => d.nodes)) {
      try {
        const deploymentTarget = Names.getName(deploymentNode)
        if (isTruthy(deploymentTarget)) {
          nodes.add(deploymentTarget, Descriptions.createDescription(deploymentNode, deploymentTarget, document))
          if (!deploymentNode.body) {
            continue
          }
          for (const artifact of deploymentNode.body.artifacts) {
            const artifactName = Names.getName(artifact)
            if (!isTruthy(artifactName)) {
              continue
            }
            nodeArtifacts.add(
              deploymentTarget,
              {
                ...Descriptions.createDescription(artifact, artifactName, document),
                deploymentTarget
              }
            )
          }
        }
      } catch (e) {
        logWarnError(e)
      }
    }
    return new DocumentDeploymentsIndex(nodes, nodeArtifacts)
  }

  private constructor(
    /**
     * Map of deployment nodes by their name
     */
    private _nodes: MultiMap<string, AstNodeDescription>,
    /**
     * Map of deployment artifacts by node name
     */
    private _nodeArtifacts: MultiMap<string, DeployedArtifactAstNodeDescription>
  ) {}

  public nodes(): Stream<AstNodeDescription> {
    return this._nodes.values()
  }

  public node(nodeName: string): Stream<AstNodeDescription> {
    if (!this._nodes.has(nodeName)) {
      return EMPTY_STREAM
    }
    return stream(this._nodes.get(nodeName))
  }

  /**
   * Returns artifacts of a deployment node
   * @param nodeName Name of the deployment node
   * @returns Stream of artifacts
   */
  public artifacts(nodeName: string): Stream<DeployedArtifactAstNodeDescription> {
    if (!this._nodes.has(nodeName)) {
      return EMPTY_STREAM
    }
    return stream(this._nodeArtifacts.get(nodeName))
  }
}

const CACHE_KEY = 'DeploymentIndex'

export class LikeC4DeploymentsIndex {
  protected langiumDocuments: LangiumDocuments
  protected cache: DocumentCache<typeof CACHE_KEY, DocumentDeploymentsIndex>

  constructor(private services: LikeC4Services) {
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.cache = services.DocumentCache as any
  }

  private documents() {
    return this.langiumDocuments.all.filter(isLikeC4LangiumDocument)
  }

  public get(document: LikeC4LangiumDocument): DocumentDeploymentsIndex {
    return this.cache.get(document.uri, CACHE_KEY, () => DocumentDeploymentsIndex.create(document, this.services))
  }

  /**
   * Returns artifacts of a deployment node
   * @param nodeName Name of the deployment node
   * @returns Stream of artifacts
   */
  public artifacts(nodeName: string): Stream<DeployedArtifactAstNodeDescription> {
    return this.documents().flatMap(doc => this.get(doc).artifacts(nodeName))
  }
}
