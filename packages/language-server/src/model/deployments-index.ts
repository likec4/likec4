import { type Fqn, ancestorsFqn, AsFqn } from '@likec4/core'
import { MultiMap } from '@likec4/core/utils'
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
import { readStrictFqn } from '../utils/elementRef'
import { DocumentFqnIndex, FqnIndex } from './fqn-index'

export class DeploymentsIndex extends FqnIndex<ast.DeploymentElement> {
  protected Names: LikeC4NameProvider

  constructor(protected override services: LikeC4Services) {
    super(services, 'deployments-index')
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
      byfqn.set(fqn, desc)
      return desc
    }

    const traverseNode = (
      node: ast.DeploymentNode | ast.DeployedInstance | ast.ExtendDeployment,
      parentFqn: Fqn | null,
    ): readonly AstNodeDescriptionWithFqn[] => {
      let thisFqn: Fqn
      if (ast.isExtendDeployment(node)) {
        thisFqn = readStrictFqn(node.deploymentNode)
      } else {
        const name = Names.getName(node)
        if (!isTruthy(name)) {
          return []
        }
        thisFqn = AsFqn(name, parentFqn)
        const desc = createAndSaveDescription(node, name, thisFqn)
        if (!parentFqn) {
          root.push(desc)
        } else {
          children.set(parentFqn, desc)
        }

        if (ast.isDeployedInstance(node)) {
          return []
        }
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

      _nested = [
        ...children.get(thisFqn) ?? [],
        ..._nested,
      ]
      for (const child of _nested) {
        descendants.set(thisFqn, child)
      }
      if (ast.isExtendDeployment(node)) {
        for (const ancestor of ancestorsFqn(thisFqn)) {
          for (const child of _nested) {
            descendants.set(ancestor, child)
          }
        }
      }
      return descendants.get(thisFqn) ?? []
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
