import { type Fqn, AsFqn } from '@likec4/core'
import { MultiMap } from 'langium'
import { isDefined, isTruthy } from 'remeda'
import {
  type AstNodeDescriptionWithFqn,
  type LikeC4LangiumDocument,
  ast,
  ElementOps,
} from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { DocumentFqnIndex, FqnIndex } from './fqn-index'

export class DeploymentsIndex extends FqnIndex {
  protected Names: LikeC4NameProvider

  protected override cachePrefix = 'deployments-index'

  constructor(protected override services: LikeC4Services) {
    super(services)
    this.Names = services.references.NameProvider
  }

  protected override createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex {
    const rootNodes = document.parseResult.value.deployments.flatMap(m => m.elements)
    if (rootNodes.length === 0) {
      return DocumentFqnIndex.EMPTY
    }
    const root = new Array<AstNodeDescriptionWithFqn>()
    const children = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const descendants = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const byfqn = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const Names = this.Names
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider

    const createAndSaveDescription = (node: ast.DeploymentNode | ast.DeployedInstance, name: string, fqn: Fqn) => {
      const desc = {
        ...Descriptions.createDescription(node, name, document),
        id: fqn,
      }
      ElementOps.writeId(node, fqn)
      byfqn.add(fqn, desc)
      return desc
    }

    const traverseNode = (
      node: ast.DeploymentNode | ast.DeployedInstance,
      parentFqn: Fqn | null,
    ): readonly AstNodeDescriptionWithFqn[] => {
      const name = Names.getName(node)
      if (!isTruthy(name)) {
        return []
      }
      const thisFqn = AsFqn(name, parentFqn)
      const desc = createAndSaveDescription(node, name, thisFqn)
      if (!parentFqn) {
        root.push(desc)
      } else {
        children.add(parentFqn, desc)
      }

      if (ast.isDeployedInstance(node)) {
        return []
      }

      let _nested = [] as AstNodeDescriptionWithFqn[]
      if (isDefined(node.body)) {
        for (const child of node.body.elements) {
          if (!ast.isDeploymentRelation(child)) {
            try {
              _nested.push(...traverseNode(child, thisFqn))
            } catch (e) {
              logWarnError(e)
            }
          }
        }
      }

      const directChildren = children.get(thisFqn)
      _nested = [
        ...directChildren,
        ..._nested,
      ]
      descendants.addAll(thisFqn, _nested)
      return _nested
    }

    for (const node of rootNodes) {
      try {
        if (ast.isDeploymentRelation(node)) {
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
