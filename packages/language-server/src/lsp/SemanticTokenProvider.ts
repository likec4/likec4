import { AbstractSemanticTokenProvider, type AstNode, type SemanticTokenAcceptor } from 'langium'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-protocol'
import { ast } from '../ast'
import { isElementRefHead } from '../elementRef'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor) {
    const keyword = (keyword: string, _index?: number) =>
      acceptor({
        node,
        keyword,
        type: SemanticTokenTypes.keyword,
        modifier: [SemanticTokenModifiers.defaultLibrary]
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
    if ('arr' in node) {
      acceptor({
        node,
        property: 'arr',
        type: SemanticTokenTypes.keyword,
        modifier: [SemanticTokenModifiers.defaultLibrary]
      })
    }
    // if (
    //   ast.isRelation(node) ||
    //   ast.isRelationExpression(node) ||
    //   ast.isIncomingExpression(node) ||
    //   ast.isInOutExpression(node) ||
    //   ast.isOutgoingExpression(node)
    // ) {
    //   acceptor({
    //     node,
    //     property: 'arr',
    //     type: SemanticTokenTypes.keyword,
    //     modifier: [SemanticTokenModifiers.defaultLibrary]
    //   })
    // }
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
    if (ast.isRelation(node)) {
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
    if (ast.isColorProperty(node) || ast.isShapeProperty(node)) {
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
      return
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
      return
    }
    // ViewProperty | ElementStringProperty | RelationStringProperty | LinkProperty
    // if (
    //   ast.isViewProperty(node) ||
    //   ast.isElementStringProperty(node) ||
    //   ast.isRelationStringProperty(node) ||
    //   ast.isLinkProperty(node) ||
    //   ast.isIconProperty(node)
    // ) {
    //   acceptor({
    //     node,
    //     property: 'key',
    //     type: SemanticTokenTypes.keyword
    //     // type: SemanticTokenTypes.property,
    //     // modifier: [
    //     //   SemanticTokenModifiers.readonly,
    //     //   SemanticTokenModifiers.declaration
    //     // ]
    //   })
    //   acceptor({
    //     node,
    //     property: 'value',
    //     type: SemanticTokenTypes.string
    //   })
    //   return
    // }
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

    if (ast.isStrictElementView(node)) {
      acceptor({
        node,
        keyword: 'of',
        type: SemanticTokenTypes.keyword
      })
    }

    if (ast.isExtendElementView(node)) {
      acceptor({
        node,
        keyword: 'extends',
        type: SemanticTokenTypes.keyword
      })
    }
  }
}
