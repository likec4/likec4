import { AbstractSemanticTokenProvider, type AstNode, type SemanticTokenAcceptor } from 'langium'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-protocol'
import { ast } from '../ast'
import { isElementRefHead } from '../elementRef'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {

  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor) {

    const keyword = (keyword: string, _index?: number) => acceptor({
      node,
      keyword,
      type: SemanticTokenTypes.keyword,
    })

    if (ast.isElementRef(node) || ast.isStrictElementRef(node)) {
      acceptor({
        node,
        property: 'el',
        type: isElementRefHead(node) ? SemanticTokenTypes.variable : SemanticTokenTypes.property,
      })
      // acceptor({
      //   node,
      //   property: 'el',
      //   type: SemanticTokenTypes.variable,
      // })
      return
    }
    //   if (ast.isSpec(node)) {
    //     keyword('spec')
    //     return
    //   }
    if (ast.isWildcardExpression(node)) {
      acceptor({
        node,
        property: 'isWildcard',
        type: SemanticTokenTypes.variable
      })
      return
    }
    if (ast.isRelationExpression(node) || ast.isIncomingExpression(node) || ast.isOutgoingExpression(node)) {
      keyword('->')
      return
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
    //   if (ast.isDynamicViewStep(node)) {
    //     keyword(node.isReverse ? '<-' : '->')
    //     if (hasTitle(node)) {
    //       acceptor({
    //         node,
    //         property: 'title',
    //         type: SemanticTokenTypes.string
    //       })
    //     }
    //     return
    //   }
    //   if (ast.isStyleProperties(node)) {
    //     keyword('style')
    //     return
    //   }
    if (ast.isElementKind(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [
          SemanticTokenModifiers.definition,
        ]
      })
      return
    }
    //   if (ast.isElementKindSpec(node)) {
    //     keyword('element')
    //     // keyword('nested')
    //     // if (node.nested.length > 0) {
    //     //   acceptor({
    //     //     node,
    //     //     property: 'nested',
    //     //     type: SemanticTokenTypes.type,
    //     //   })
    //     // }
    //     // acceptor({
    //     //   node,
    //     //   property: 'kind',
    //     //   type: SemanticTokenTypes.type,
    //     // })
    //     return
    //   }
    //   if (ast.isTagSpec(node)) {
    //     keyword('tag')
    //     acceptor({
    //       node,
    //       property: 'tag',
    //       type: SemanticTokenTypes.enumMember
    //     })
    //     return
    //   }
    if (ast.isTags(node)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.macro
      })
      return
    }
    if (ast.isTag(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.macro
      })
      return
    }
    if (ast.isColorProperty(node) || ast.isShapeProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.keyword,
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.enumMember
      })
      return
    }
    if (ast.isElementProperty(node) || ast.isRelationProperty(node) || ast.isViewProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.keyword,
      })
      if ('value' in node) {
        acceptor({
          node,
          property: 'value',
          type: SemanticTokenTypes.string
        })
      }
      return
    }
    if (ast.isModel(node)) {
      keyword('model')
      return
    }
    if (ast.isModelViews(node)) {
      keyword('views')
      return
    }
    if (ast.isElement(node)) {
      return this.highlightAstElement(node, acceptor)
    }
    if (ast.isExtendElement(node)) {
      keyword('extend')
      return
    }
    //   if (ast.isElementProperty(node) || ast.isRelationProperty(node) || ast.isViewProperty(node)) {
    //     acceptor({
    //       node,
    //       property: 'key',
    //       type: SemanticTokenTypes.property,
    //       modifier: [SemanticTokenModifiers.definition]
    //     })
    //     if ('value' in node) {
    //       acceptor({
    //         node,
    //         property: 'value',
    //         type: SemanticTokenTypes.string
    //       })
    //     }
    //     return
    //   }
    if (ast.isView(node)) {
      return this.highlightView(node, acceptor)
    }
    //   if (ast.isDynamicViewSteps(node)) {
    //     keyword('steps')
    //     return
    //   }
    if (ast.isViewRuleAutoLayout(node)) {
      keyword('autoLayout')
      return
    }
    if (ast.isViewRuleStyle(node)) {
      keyword('style')
      return
    }
    if (ast.isViewRuleExpression(node)) {
      keyword(node.isInclude ? 'include' : 'exclude')
      return
    }
    //
  }

  private highlightAstElement(node: ast.Element, acceptor: SemanticTokenAcceptor) {
    acceptor({
      node,
      property: 'name',
      type: SemanticTokenTypes.variable,
      modifier: [
        SemanticTokenModifiers.declaration,
      ]
    })
    acceptor({
      node,
      property: 'kind',
      type: SemanticTokenTypes.keyword,
      modifier: [
      ]
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
    if (node.name) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.variable,
      })
    }
    if (node.viewOf) {
      acceptor({
        node,
        keyword: 'of',
        type: SemanticTokenTypes.keyword
      })
    }
    acceptor({
      node,
      keyword: 'view',
      type: SemanticTokenTypes.keyword
    })
  }
}
