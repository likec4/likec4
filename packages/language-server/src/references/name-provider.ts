import { nonNullable } from '@likec4/core'
import { type AstNode, type CstNode, DefaultNameProvider, isNamed } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

export class LikeC4NameProvider extends DefaultNameProvider {
  constructor(protected services: LikeC4Services) {
    super()
  }

  public getNameStrict(node: AstNode): string {
    return nonNullable(
      this.getName(node),
      `Failed getName for ${this.services.workspace.AstNodeLocator.getAstNodePath(node)}`,
    )
  }

  override getName(node: AstNode): string | undefined {
    if (isNamed(node)) {
      return node.name
    }
    if (ast.isImported(node)) {
      return node.imported.$refText
    }
    if (ast.isDeployedInstance(node)) {
      return node.target.modelElement.value.$refText
    }
    return undefined
  }

  override getNameNode(node: AstNode): CstNode | undefined {
    if (isNamed(node)) {
      return super.getNameNode(node)
    }
    if (ast.isImported(node)) {
      return node.imported.$refNode
    }
    if (ast.isDeployedInstance(node)) {
      return node.target.modelElement.value.$refNode
    }
    return undefined
  }
}
