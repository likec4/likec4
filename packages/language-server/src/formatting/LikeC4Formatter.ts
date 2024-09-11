import { type AstNode, GrammarUtils } from 'langium'
import { AbstractFormatter, Formatting, type NodeFormatter } from 'langium/lsp'
import * as ast from '../generated/ast'
import * as utils from './utils'

const FormattingOptions = {
  newLine: Formatting.newLine({ allowMore: true }),
  oneSpace: Formatting.oneSpace(),
  noSpace: Formatting.noSpace(),
  indent: Formatting.indent(),
  noIndent: Formatting.noIndent()
}
type Predicate<T extends AstNode> = (x: unknown) => x is T

export class LikeC4Formatter extends AbstractFormatter {
  protected format(node: AstNode): void {
    this.removeIndentFromTopLevelStatements(node)
    this.indentContentInBraces(node)

    this.formatSpecificationRule(node)
    this.formatElementDeclaration(node)
    this.formatRelation(node)
    this.formatView(node)
    this.formatViewRuleStyle(node)
    this.formatIncludeExcludeExpressions(node)
    this.formatWhereExpression(node)
    this.formatWithPredicate(node)
    this.formatLeafProperty(node)
    this.formatMetadataProperty(node)
    this.formatAutolayoutProperty(node)
    this.formatLinkProperty(node)
    this.formatNavigateToProperty(node)
    this.formatTags(node)
  }

  protected surroundOperatorsWithSpace(node: AstNode) {
    if (
      ast.isWhereElementExpression(node)
      || ast.isWhereRelationExpression(node)
      || ast.isWhereElement(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      const operator = formatter.properties('operator', 'not')
      operator.surround(FormattingOptions.oneSpace)
      formatter.keyword('not').surround(FormattingOptions.oneSpace)
    }
  }

  protected formatTags(node: AstNode) {
    this.on(node, ast.isTags, (n, f) => {
      f.cst(GrammarUtils.findNodesForProperty(n.$cstNode, 'values').slice(1))
        .prepend(FormattingOptions.oneSpace)

      f.keywords(',')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.oneSpace)
    })
  }

  protected formatRelation(node: AstNode) {
    this.on(node, ast.isRelation, (n, f) => {
      f.property('source').append(FormattingOptions.oneSpace)
      f.keywords(']->').prepend(FormattingOptions.noSpace)
      f.keywords('-[').append(FormattingOptions.noSpace)

      f.properties('target', 'title', 'technology', 'tags').prepend(FormattingOptions.oneSpace)
    })

    this.on(node, ast.isDynamicViewStep, (n, f) => {
      f.properties('source').append(FormattingOptions.oneSpace)
      f.keywords(']->').prepend(FormattingOptions.noSpace)
      f.keywords('-[').append(FormattingOptions.noSpace)
      f.properties('target', 'title').prepend(FormattingOptions.oneSpace)
    })

    this.on(node, ast.isDirectedRelationExpression)
      ?.property('target').prepend(FormattingOptions.oneSpace)

    this.on(node, ast.isOutgoingRelationExpression, (n, f) => {
      f.property('from').append(FormattingOptions.oneSpace)
      f.keywords(']->').prepend(FormattingOptions.noSpace)
      f.keywords('-[').append(FormattingOptions.noSpace)
    })

    this.on(node, ast.isIncomingRelationExpression)
      ?.keywords('->').append(FormattingOptions.oneSpace)

    this.on(node, ast.isInOutRelationExpression)
      ?.property('inout').append(FormattingOptions.oneSpace)
  }

  protected removeIndentFromTopLevelStatements(node: AstNode) {
    if (
      ast.isModel(node)
      || ast.isSpecificationRule(node)
      || ast.isModelViews(node)
      || ast.isLikeC4Lib(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keywords('specification', 'model', 'views', 'likec4lib')
        .prepend(FormattingOptions.noIndent)
    }
  }

  protected indentContentInBraces(node: AstNode) {
    if (
      ast.isLikeC4Lib(node)
      || ast.isSpecificationRule(node)
      || ast.isSpecificationElementKind(node)
      || ast.isSpecificationRelationshipKind(node)
      || ast.isModel(node)
      || ast.isElementBody(node)
      || ast.isExtendElementBody(node)
      || ast.isRelationBody(node)
      || ast.isRelationStyleProperty(node)
      || ast.isMetadataBody(node)
      || ast.isModelViews(node)
      || ast.isElementViewBody(node)
      || ast.isDynamicViewBody(node)
      || ast.isViewRuleStyle(node)
      || ast.isCustomElementProperties(node)
      || ast.isCustomRelationProperties(node)
      || ast.isElementStyleProperty(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      const openBrace = formatter.keywords('{')
      const closeBrace = formatter.keywords('}')

      const interiorNodes = formatter.interior(openBrace, closeBrace)

      // Workaround for tags as they are parsed as overlapping regions.
      // E.g. '#tag1, #tag2' will be parsed as two nodes: '#tag1' and '#tag1, #tag2'
      let perviousNode = null
      for (const interiorNode of interiorNodes.nodes) {
        if (!perviousNode || !utils.areOverlap(perviousNode, interiorNode)) {
          formatter.cst([interiorNode]).prepend(FormattingOptions.indent)
        }
        perviousNode = interiorNode
      }

      openBrace
        .prepend(FormattingOptions.noIndent)
        .prepend(FormattingOptions.oneSpace)
      closeBrace
        .prepend(FormattingOptions.noIndent)
        .prepend(Formatting.newLine({ allowMore: true }))
    }
  }

  protected appendKeywordsWithSpace(node: AstNode) {
    this.on(node, ast.isElementKind)
      ?.keywords('element').append(FormattingOptions.oneSpace)
  }

  protected formatView(node: AstNode) {
    this.on(node, ast.isElementView, (n, f) => {
      if (n.extends || n.viewOf || n.name) {
        f.keywords('view').append(FormattingOptions.oneSpace)
      }
      f.keywords('of', 'extends').surround(FormattingOptions.oneSpace)
    })

    this.on(node, ast.isDynamicView)
      ?.keywords('dynamic', 'view').append(FormattingOptions.oneSpace)
  }

  protected formatLeafProperty(node: AstNode) {
    if (
      ast.isElementStringProperty(node)
      || ast.isRelationStringProperty(node)
      || ast.isViewStringProperty(node)
      || ast.isNotationProperty(node)
      || ast.isSpecificationElementStringProperty(node)
      || ast.isSpecificationRelationshipStringProperty(node)
      || ast.isColorProperty(node)
      || ast.isLineProperty(node)
      || ast.isArrowProperty(node)
      || ast.isIconProperty(node)
      || ast.isShapeProperty(node)
      || ast.isBorderProperty(node)
      || ast.isOpacityProperty(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keywords(
        'title',
        'description',
        'technology',
        'notation',
        'color',
        'line',
        'head',
        'tail',
        'icon',
        'shape',
        'border',
        'opacity'
      )
        .append(FormattingOptions.oneSpace)

      formatter.keyword(':')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.oneSpace)

      formatter.keyword(';')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.newLine)
    }
  }

  protected formatLinkProperty(node: AstNode) {
    this.on(node, ast.isLinkProperty, (n, f) => {
      f.keyword('link').append(FormattingOptions.oneSpace)
      f.property('value').append(FormattingOptions.oneSpace)
      f.keyword(':')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.oneSpace)

      f.keyword(';')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.newLine)
    })
  }

  protected formatNavigateToProperty(node: AstNode) {
    this.on(node, ast.isNavigateToProperty)
      ?.property('key').append(FormattingOptions.oneSpace)
  }

  protected formatAutolayoutProperty(node: AstNode) {
    this.on(node, ast.isViewRuleAutoLayout)
      ?.keyword('autoLayout').append(FormattingOptions.oneSpace)
  }

  protected formatMetadataProperty(node: AstNode) {
    this.on(node, ast.isMetadataAttribute, (n, f) => {
      f.property('key').append(FormattingOptions.oneSpace)
      f.keyword(':')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.oneSpace)
      f.keyword(';')
        .prepend(FormattingOptions.noSpace)
        .append(FormattingOptions.newLine)
    })
  }

  protected formatElementDeclaration(node: AstNode) {
    this.on(node, ast.isElement, (n, f) => {
      const kind = GrammarUtils.findNodeForProperty(n.$cstNode, 'kind')
      const name = GrammarUtils.findNodeForProperty(n.$cstNode, 'name')

      if (name && kind) {
        // system sys1
        if (utils.compareRanges(name, kind) > 0) {
          f.cst([kind]).append(FormattingOptions.oneSpace)
        }
        // sys1 = system
        else {
          f.cst([name]).append(FormattingOptions.oneSpace)
          f.cst([kind]).prepend(FormattingOptions.oneSpace)
        }
      }

      f.properties('props').prepend(FormattingOptions.oneSpace)
    })
  }

  protected formatSpecificationRule(node: AstNode) {
    if (
      ast.isSpecificationElementKind(node)
      || ast.isSpecificationRelationshipKind(node)
      || ast.isSpecificationTag(node)
    ) {
      const formatter = this.getNodeFormatter(node)

      formatter.keywords('element', 'relationship', 'tag')
        .append(FormattingOptions.oneSpace)
    }
    if (
      ast.isSpecificationColor(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keyword('color').append(FormattingOptions.oneSpace)
      formatter.property('name').append(FormattingOptions.oneSpace)
    }
  }

  protected formatWithPredicate(node: AstNode) {
    const formatter = this.getNodeFormatter(node)
    if (
      ast.isElementPredicateWith(node)
      || ast.isRelationPredicateWith(node)
    ) {
      formatter.keyword('with').prepend(FormattingOptions.oneSpace)
    }
  }

  protected formatViewRuleStyle(node: AstNode) {
    this.on(node, ast.isViewRuleStyle)
      ?.keyword('style').append(FormattingOptions.oneSpace)

      this.on(node, ast.isElementExpressionsIterator)
      ?.keyword(',')
      .prepend(FormattingOptions.noSpace)
      .append(FormattingOptions.oneSpace)
  }

  protected formatWhereExpression(node: AstNode) {
    if (
      ast.isRelationPredicateOrWhere(node)
      || ast.isElementPredicateOrWhere(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keyword('where').append(FormattingOptions.oneSpace)
    }
    if (
      ast.isWhereRelationExpression(node)
      || ast.isWhereElementExpression(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.property('operator').surround(FormattingOptions.oneSpace)
    }
    if (
      ast.isWhereElementNegation(node)
      || ast.isWhereRelationNegation(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keyword('not').append(FormattingOptions.oneSpace)
    }
    if (
      ast.isWhereElement(node)
      || ast.isWhereElementTag(node)
      || ast.isWhereElementKind(node)
      || ast.isWhereRelation(node)
      || ast.isWhereRelationTag(node)
      || ast.isWhereRelationKind(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.property('operator').surround(FormattingOptions.oneSpace)
      formatter.property('not').surround(FormattingOptions.oneSpace)
    }
  }

  protected formatIncludeExcludeExpressions(node: AstNode) {
    if (
      ast.isDynamicViewRule(node)
      || ast.isIncludePredicate(node)
      || ast.isExcludePredicate(node)
    ) {
      const formatter = this.getNodeFormatter(node)

      if (!node.$cstNode || !utils.isMultiline(node.$cstNode)) {
        formatter.keywords('include', 'exclude')
          .append(FormattingOptions.oneSpace)
      }
    }
    if (
      ast.isDynamicViewPredicateIterator(node)
      || ast.isPredicates(node)
      || ast.isPredicates(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      const parent = this.findPredicateExpressionRoot(node)
      const isMultiline = parent?.$cstNode && utils.isMultiline(parent?.$cstNode)

      if (isMultiline) {
        formatter.property('value').prepend(FormattingOptions.indent)
      }
      formatter.keyword(',')
        .prepend(FormattingOptions.noSpace)
        .append(isMultiline ? FormattingOptions.newLine : FormattingOptions.oneSpace)
    }
  }

  private findPredicateExpressionRoot(node: AstNode): AstNode | undefined {
    let parent = node.$container
    while (true) {
      if (
        !parent
        || ast.isDynamicViewRule(parent)
        || ast.isIncludePredicate(parent)
        || ast.isExcludePredicate(parent)
      ) {
        return parent
      }

      parent = parent.$container
    }
  }

  private on<T extends AstNode>(
    node: AstNode,
    predicate: Predicate<T>,
    format?: (node: T, f: NodeFormatter<T>) => void
  ): NodeFormatter<T> | undefined {
    const formatter = predicate(node) ? this.getNodeFormatter(node) : undefined

    format && formatter && format(node as T, formatter)

    return formatter
  }
}
