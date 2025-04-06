import { nonNullable } from '@likec4/core'
import { type AstNode, type CstNode, DefaultNameProvider, isNamed, type NamedAstNode } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

export class LikeC4NameProvider extends DefaultNameProvider {
  constructor(protected services: LikeC4Services) {
    super()
  }

  public getNameStrict(node: AstNode): string {
    return nonNullable(
      this.getName(node),
      `Failed getName for ${this.services.workspace.AstNodeLocator.getAstNodePath(node)}`
    )
  }

  override getName(node: AstNode): string | undefined {
    if (isNamed(node)) {
      return node.name
    }
    if (ast.isDeployedInstance(node)) {
      return node.element.$cstNode?.text
    }
    return undefined
  }

  override getNameNode(node: AstNode): CstNode | undefined {
    if (isNamed(node)) {
      return super.getNameNode(node)
    }
    if (ast.isDeployedInstance(node)) {
      return node.element.$cstNode
    }
    return undefined
  }
}
