import { AbstractSemanticTokenProvider, type AstNode, type SemanticTokenAcceptor } from 'langium'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-protocol'
import { ast } from '../ast'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor) {
    const keyword = (keyword: string, _index?: number) =>
      acceptor({
        node,
        keyword,
        type: SemanticTokenTypes.keyword,
        modifier: [SemanticTokenModifiers.defaultLibrary]
      })

    if ('arr' in node) {
      acceptor({
        node,
        property: 'arr',
        type: SemanticTokenTypes.keyword,
        modifier: [SemanticTokenModifiers.defaultLibrary]
      })
    }

    if (ast.isRelation(node) && 'kind' in node) {
      keyword('-[')
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
      keyword(']->')
    }

    if (ast.isElementRef(node) || ast.isFqnElementRef(node)) {
      acceptor({
        node,
        property: 'el',
        type: node.parent ? SemanticTokenTypes.property : SemanticTokenTypes.variable
      })
    }
    if (ast.isElementViewRef(node)) {
      acceptor({
        node,
        property: 'view',
        type: SemanticTokenTypes.variable
      })
    }
    if (ast.isWildcardExpression(node)) {
      acceptor({
        node,
        property: 'isWildcard',
        type: SemanticTokenTypes.variable
      })
    }

    if (ast.isElementKindExpression(node) || ast.isElementTagExpression(node)) {
      keyword('element')
      if (ast.isElementKindExpression(node)) {
        keyword('kind')
        acceptor({
          node,
          property: 'kind',
          type: SemanticTokenTypes.type,
          modifier: [SemanticTokenModifiers.definition]
        })
      }
      if (ast.isElementTagExpression(node)) {
        keyword('tag')
        acceptor({
          node,
          property: 'tag',
          type: SemanticTokenTypes.type,
          modifier: [SemanticTokenModifiers.definition]
        })
      }
    }
    if (ast.isRelation(node)) {
      if ('title' in node) {
        acceptor({
          node,
          property: 'title',
          type: SemanticTokenTypes.string
        })
      }
    }
    if (ast.isElementKind(node)) {
      acceptor({
        node,
        property: 'name',
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
    if (ast.isRelationshipKind(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
    }
    if (
      ast.isColorProperty(node) ||
      ast.isShapeProperty(node) ||
      ast.isArrowProperty(node) ||
      ast.isLineProperty(node)
    ) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.keyword
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.enum
      })
    }
    if (ast.isLinkProperty(node) || ast.isIconProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.keyword
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.string
      })
    }
    if (ast.isElement(node)) {
      this.highlightAstElement(node, acceptor)
    }
    if (ast.isView(node)) {
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

  private highlightView(node: ast.ElementView, acceptor: SemanticTokenAcceptor) {
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
