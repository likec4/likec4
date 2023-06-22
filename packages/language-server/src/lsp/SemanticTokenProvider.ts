import { AbstractSemanticTokenProvider, type AstNode, type SemanticTokenAcceptor } from 'langium'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver'
import { ast } from '../ast'
import { isElementRefHead } from '../elementRef'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor) {
    const keyword = (keyword: string, _index?: number) =>
      acceptor({
        node,
        keyword,
        type: SemanticTokenTypes.keyword
      })

    if (ast.isElementRef(node) || ast.isStrictElementRef(node)) {
      acceptor({
        node,
        property: 'el',
        type: isElementRefHead(node) ? SemanticTokenTypes.variable : SemanticTokenTypes.property
      })
      return
    }
    if (ast.isWildcardExpression(node)) {
      acceptor({
        node,
        property: 'isWildcard',
        type: SemanticTokenTypes.variable
      })
      return
    }
    if (
      ast.isRelationExpression(node) ||
      ast.isIncomingExpression(node) ||
      ast.isOutgoingExpression(node)
    ) {
      keyword('->')
      return
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
        return
      }
      if (ast.isElementTagExpression(node)) {
        keyword('tag')
        acceptor({
          node,
          property: 'tag',
          type: SemanticTokenTypes.type,
          modifier: [SemanticTokenModifiers.definition]
        })
        return
      }
    }
    if (ast.isInOutExpression(node)) {
      keyword('->', 0)
      keyword('->', 1)
      return
    }
    if (ast.isRelation(node)) {
      keyword('->')
      if ('title' in node) {
        acceptor({
          node,
          property: 'title',
          type: SemanticTokenTypes.string
        })
      }
      return
    }
    if (ast.isElementKind(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
      return
    }
    if (ast.isTags(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
      return
    }
    if (ast.isTag(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition]
      })
      return
    }
    if (ast.isAStyleProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.keyword
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.enumMember
      })
      return
    }
    if (ast.isAnyStringProperty(node)) {
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
      return
    }
    // if (ast.isModel(node)) {
    //   keyword('model')
    //   return
    // }
    // if (ast.isModelViews(node)) {
    //   keyword('views')
    //   return
    // }
    if (ast.isElement(node)) {
      return this.highlightAstElement(node, acceptor)
    }
    if (ast.isView(node)) {
      return this.highlightView(node, acceptor)
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

    if ('title' in node) {
      acceptor({
        node,
        property: 'title',
        type: SemanticTokenTypes.string
      })
    }
  }

  private highlightView(node: ast.ElementView, acceptor: SemanticTokenAcceptor) {
    acceptor({
      node,
      keyword: 'view',
      type: SemanticTokenTypes.keyword
    })

    if (node.name) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.variable,
        modifier: [SemanticTokenModifiers.declaration]
      })
    }

    if (node.viewOf) {
      acceptor({
        node,
        keyword: 'of',
        type: SemanticTokenTypes.keyword
      })
    }
  }
}
