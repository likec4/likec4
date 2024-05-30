import type { AstNode } from 'langium'
import { AbstractSemanticTokenProvider, type SemanticTokenAcceptor } from 'langium/lsp'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-protocol'
import { ast } from '../ast'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor
  ): void | undefined | 'prune' {
    if (ast.isRelation(node) && 'kind' in node) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }

    if (ast.isElementViewRef(node)) {
      acceptor({
        node,
        property: 'view',
        type: SemanticTokenTypes.variable
      })
    }
    if (ast.isDescedantsExpr(node) && node.$cstNode) {
      acceptor({
        cst: node.$cstNode,
        type: SemanticTokenTypes.variable
      })
      return 'prune'
    }
    if (ast.isWildcardExpr(node) && node.$cstNode) {
      acceptor({
        cst: node.$cstNode,
        type: SemanticTokenTypes.variable
      })
    }

    if (ast.isElementKindExpr(node)) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (ast.isElementTagExpr(node)) {
      acceptor({
        node,
        property: 'tag',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (ast.isElementRef(node) || ast.isFqnElementRef(node)) {
      acceptor({
        node,
        property: 'el',
        type: node.parent ? SemanticTokenTypes.property : SemanticTokenTypes.variable
      })
    }
    if (ast.isSpecificationElementKind(node) || ast.isSpecificationRelationshipKind(node)) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (ast.isTags(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (ast.isTag(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (
      ast.isColorProperty(node)
      || ast.isShapeProperty(node)
      || ast.isArrowProperty(node)
      || ast.isLineProperty(node)
      || ast.isBorderProperty(node)
    ) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.enum
      })
    }
    if (ast.isOpacityProperty(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.number
      })
    }
    if (ast.isLinkProperty(node) || ast.isIconProperty(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.string
      })
    }
    if (ast.isElement(node)) {
      this.highlightAstElement(node, acceptor)
    }
    if (ast.isLikeC4View(node)) {
      this.highlightView(node, acceptor)
    }
  }

  private highlightAstElement(node: ast.Element, acceptor: SemanticTokenAcceptor) {
    acceptor({
      node,
      property: 'name',
      type: SemanticTokenTypes.variable,
      modifier: [SemanticTokenModifiers.declaration]
    })
    acceptor({
      node,
      property: 'kind',
      type: SemanticTokenTypes.keyword,
      modifier: []
    })
  }

  private highlightView(node: ast.LikeC4View, acceptor: SemanticTokenAcceptor) {
    if (node.name) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.variable,
        modifier: [SemanticTokenModifiers.declaration]
      })
    }
  }
}
