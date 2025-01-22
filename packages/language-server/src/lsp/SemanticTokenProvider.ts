import type { AstNode } from 'langium'
import { type SemanticTokenAcceptor, AbstractSemanticTokenProvider } from 'langium/lsp'
import { isTruthy } from 'remeda'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-types'
import { ast } from '../ast'

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor,
  ): void | undefined | 'prune' {
    if (ast.isElement(node) || ast.isDeploymentNode(node)) {
      return this.highlightNameAndKind(node, acceptor)
    }
    if (ast.isDeployedInstance(node)) {
      if ('name' in node) {
        acceptor({
          node,
          property: 'name',
          type: SemanticTokenTypes.variable,
          modifier: [
            SemanticTokenModifiers.definition,
            SemanticTokenModifiers.readonly,
          ],
        })
      }
      return
    }
    if (ast.isLikeC4View(node)) {
      return this.highlightView(node, acceptor)
    }
    if (ast.isRelationshipKind(node)) {
      return acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.function,
      })
    }
    if (ast.isLibIcon(node)) {
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition],
      })
      return 'prune'
    }

    if (ast.isOutgoingRelationExpression(node) && 'kind' in node) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.function,
      })
      return
    }
    if (ast.isRelation(node) && 'kind' in node) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.function,
      })
    }
    if (ast.isNavigateToProperty(node) || ast.isRelationNavigateToProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property,
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly,
        ],
      })
      return 'prune'
    }
    if ((ast.isElementDescedantsExpression(node) || ast.isWildcardExpression(node)) && node.$cstNode) {
      acceptor({
        cst: node.$cstNode,
        type: SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly,
        ],
      })
      return 'prune'
    }
    if (ast.isFqnRefExpr(node)) {
      if (node.selector) {
        acceptor({
          node,
          property: 'selector',
          type: SemanticTokenTypes.variable,
          modifier: [
            SemanticTokenModifiers.definition,
            SemanticTokenModifiers.readonly,
          ],
        })
      }
      return
    }
    if (ast.isWhereRelationKind(node) && isTruthy(node.value)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.function,
      })
      return
    }
    if ((ast.isWhereElement(node) || ast.isWhereRelation(node)) && isTruthy(node.value)) {
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.type,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly,
        ],
      })
      return
    }
    if ((ast.isWhereRelationParticipantKind(node) || ast.isWhereRelationParticipantTag(node))) {
      acceptor({
        node,
        property: 'participant',
        type: SemanticTokenTypes.keyword,
      })
    }
    if (ast.isElementKindExpression(node) && isTruthy(node.kind)) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition],
      })
      return 'prune'
    }
    if (ast.isElementTagExpression(node) && isTruthy(node.tag)) {
      acceptor({
        node,
        property: 'tag',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition],
      })
      return 'prune'
    }
    if (ast.isFqnRef(node)) {
      acceptor({
        node,
        property: 'value',
        type: node.parent ? SemanticTokenTypes.property : SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly,
        ],
      })
      return !node.parent ? 'prune' : undefined
    }
    if (ast.isElementRef(node) || ast.isFqnElementRef(node)) {
      acceptor({
        node,
        property: 'el',
        type: node.parent ? SemanticTokenTypes.property : SemanticTokenTypes.variable,
        modifier: [
          SemanticTokenModifiers.definition,
          SemanticTokenModifiers.readonly,
        ],
      })
      return !node.parent ? 'prune' : undefined
    }
    if (ast.isSpecificationColor(node)) {
      acceptor({
        node,
        keyword: 'color',
        type: SemanticTokenTypes.keyword,
      })
      acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [
          SemanticTokenModifiers.declaration,
          SemanticTokenModifiers.readonly,
        ],
      })
      return
    }
    if (
      ast.isSpecificationElementKind(node) || ast.isSpecificationRelationshipKind(node)
      || ast.isSpecificationDeploymentNodeKind(node)
    ) {
      acceptor({
        node,
        property: 'kind',
        type: SemanticTokenTypes.type,
        modifier: [
          SemanticTokenModifiers.declaration,
          SemanticTokenModifiers.readonly,
        ],
      })
    }
    if (ast.isTags(node)) {
      return acceptor({
        node,
        property: 'values',
        type: SemanticTokenTypes.interface,
      })
    }
    if (ast.isTag(node)) {
      return acceptor({
        node,
        property: 'name',
        type: SemanticTokenTypes.type,
        modifier: [SemanticTokenModifiers.definition],
      })
    }
    if (
      ast.isRelationStyleProperty(node)
      || (ast.isElementStyleProperty(node) && ast.isElementBody(node.$container))
    ) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property,
      })
    }
    if (ast.isOpacityProperty(node)) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property,
      })
      acceptor({
        node,
        property: 'value',
        type: SemanticTokenTypes.number,
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
        type: SemanticTokenTypes.property,
      })
      if (ast.isIconProperty(node) && (node.libicon || node.value === 'none')) {
        acceptor({
          node,
          property: node.libicon ? 'libicon' : 'value',
          type: SemanticTokenTypes.enum,
          modifier: [SemanticTokenModifiers.defaultLibrary],
        })
        return 'prune'
      }
      if ('value' in node && node.value) {
        acceptor({
          node,
          property: 'value',
          type: SemanticTokenTypes.string,
        })
      }
      return 'prune'
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
        type: SemanticTokenTypes.property,
      })
      if ('value' in node) {
        acceptor({
          node,
          property: 'value',
          type: SemanticTokenTypes.enum,
        })
      }
      return 'prune'
    }
  }

  private highlightNameAndKind(node: ast.Element | ast.DeploymentNode, acceptor: SemanticTokenAcceptor) {
    acceptor({
      node,
      property: 'name',
      type: SemanticTokenTypes.variable,
      modifier: [
        SemanticTokenModifiers.declaration,
        SemanticTokenModifiers.readonly,
      ],
    })
    acceptor({
      node,
      property: 'kind',
      type: SemanticTokenTypes.keyword,
      modifier: [],
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
          'local',
        ],
      })
    }
  }
}
