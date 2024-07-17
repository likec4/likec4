import type { AstNode } from 'langium'
import { AbstractSemanticTokenProvider, type SemanticTokenAcceptor } from 'langium/lsp'
import { isTruthy } from 'remeda'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-protocol'
import { ast } from '../ast'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor
  ): void | undefined | 'prune' {
    if (ast.isRelationshipKind(node)) {
      return acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.function
      })
    }
    if (ast.isLibIcon(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
      return 'prune'
    }

    if (ast.isRelation(node) && 'kind' in node) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.function
      })
    }
    if (ast.isNavigateToProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly
        ]
      })
      return 'prune'
    }
    if ((ast.isElementDescedantsExpression(node) || ast.isWildcardExpression(node)) && node.$cstNode) {
      acceptor({
        cst: node.$cstNode,
        type: SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly
        ]
      })
      return 'prune'
    }
    if (ast.isElementKindExpression(node) && isTruthy(node.kind)) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (ast.isElementTagExpression(node) && isTruthy(node.tag)) {
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
        type: node.parent ? SemanticTokenTypes.property : SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly
        ]
      })
      return !node.parent ? 'prune' : undefined
    }
    if (ast.isSpecificationElementKind(node) || ast.isSpecificationRelationshipKind(node)) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [
          SemanticTokenModifiers.declaration,
          SemanticTokenModifiers.readonly
        ]
      })
    }
    if (ast.isTags(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.interface
      })
      return
    }
    if (ast.isTag(node)) {
      return acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (
      ast.isRelationStyleProperty(node)
      || (ast.isStyleProperties(node) && ast.isElementBody(node.$container))
    ) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property
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
        property: 'key',
        type: SemanticTokenTypes.property
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.enum
      })
      return 'prune'
    }
    if (ast.isOpacityProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.number
      })
      return 'prune'
    }
    if (
      ast.isLinkProperty(node)
      || ast.isIconProperty(node)
      || ast.isStringProperty(node)
    ) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property
      })
      if (ast.isIconProperty(node) && node.libicon) {
        acceptor({
          node,
          property: 'libicon',
          type: SemanticTokenTypes.enum
        })
      }
      if ('value' in node) {
        acceptor({
          node,
          property: 'value',
          type: SemanticTokenTypes.string
        })
      }

      return 'prune'
    }
    if (ast.isElement(node)) {
      return this.highlightAstElement(node, acceptor)
    }
    if (ast.isLikeC4View(node)) {
      return this.highlightView(node, acceptor)
    }
  }

  private highlightAstElement(node: ast.Element, acceptor: SemanticTokenAcceptor) {
    acceptor({
      node,
      property: 'name',
      type: SemanticTokenTypes.variable,
      modifier: [
        SemanticTokenModifiers.declaration,
        SemanticTokenModifiers.readonly
      ]
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
        modifier: [
          SemanticTokenModifiers.declaration,
          SemanticTokenModifiers.readonly,
          'local'
        ]
      })
    }
  }
}
