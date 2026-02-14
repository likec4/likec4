import { ancestorsFqn, Fqn, isAnyOf } from '@likec4/core'
import { MultiMap } from '@likec4/core/utils'
import { UriUtils } from 'langium'
import { filter, flatMap, hasAtLeast, isTruthy, pipe } from 'remeda'
import {
  type AstNodeDescriptionWithFqn,
  type LikeC4LangiumDocument,
  ast,
  ElementOps,
} from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { readStrictFqn } from '../utils/elementRef'
import { DocumentFqnIndex, FqnIndex } from './fqn-index'

const _isDeployment = isAnyOf(ast.isDeploymentElement, ast.isExtendDeployment)

export class DeploymentsIndex extends FqnIndex<ast.DeploymentElement> {
  protected Names: LikeC4NameProvider

  protected override logger = logger.getChild('deployments-index')

  constructor(protected override services: LikeC4Services) {
    super(services)
    this.Names = services.references.NameProvider
  }

  protected override createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex {
    const rootNodes = document.parseResult.value.deployments
      .flatMap(m => m.elements.filter(_isDeployment))
    if (rootNodes.length === 0) {
      return DocumentFqnIndex.EMPTY
    }
    const projectId = document.likec4ProjectId ?? this.projects.ownerProjectId(document)
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
        likec4ProjectId: projectId,
      }
      ElementOps.writeId(node, fqn)
      byfqn.set(fqn, desc)
      return desc
    }

    function traverseElement(
      node: ast.DeploymentElement,
      parentFqn: Fqn | null,
    ): AstNodeDescriptionWithFqn[] {
      const name = Names.getName(node)
      if (!isTruthy(name)) {
        return []
      }
      const thisFqn = Fqn(name, parentFqn)
      const desc = createAndSaveDescription(node, name, thisFqn)
      if (!parentFqn) {
        root.push(desc)
      } else {
        children.set(parentFqn, desc)
      }

      if (ast.isDeployedInstance(node)) {
        return [desc]
      }

      const nested = filter(
        node.body?.elements ?? [],
        _isDeployment,
      )
      if (!hasAtLeast(nested, 1)) {
        return [desc]
      }

      const traversedNested = nested.flatMap(child => traverseElement(child, thisFqn))
      for (const descendant of traversedNested) {
        descendants.set(thisFqn, descendant)
      }

      return [desc, ...traversedNested]
    }

    function traverseExtend(el: ast.ExtendDeployment) {
      const thisFqn = readStrictFqn(el.deploymentNode)
      const nested = pipe(
        el.body?.elements ?? [],
        filter(_isDeployment),
        flatMap(child => traverseElement(child, thisFqn)),
      )
      if (nested.length === 0) {
        return
      }
      for (const ancestor of [thisFqn, ...ancestorsFqn(thisFqn)]) {
        for (const child of nested) {
          descendants.set(ancestor, child)
        }
      }
    }

    for (const node of rootNodes) {
      try {
        if (ast.isExtendDeployment(node)) {
          traverseExtend(node)
          continue
        }
        traverseElement(node, null)
      } catch (error) {
        this.logger.warn(
          `Error while traversing element {el} in document {doc}`,
          {
            el: node.$type,
            doc: UriUtils.basename(document.uri),
            error,
          },
        )
      }
    }
    return new DocumentFqnIndex(root, children, descendants, byfqn, projectId)
  }
}
