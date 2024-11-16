import { type AstNode, type CstNode, DefaultNameProvider, isNamed, type NamedAstNode } from 'langium'
import { ast } from '../ast'

export class LikeC4NameProvider extends DefaultNameProvider {
  override getName(node: AstNode): string | undefined {
    if (isNamed(node)) {
      return node.name
    }
    if (ast.isDeployedArtifact(node)) {
      return node.element.el.$refText
    }
    return undefined
  }

  override getNameNode(node: AstNode): CstNode | undefined {
    if (isNamed(node)) {
      return super.getNameNode(node)
    }
    if (ast.isDeployedArtifact(node)) {
      return node.element.el.$refNode
    }
    return undefined
  }
}
