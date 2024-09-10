import { type AstNode, type CompositeCstNode, type CstNode, CstUtils } from 'langium'
import { GrammarUtils } from 'langium'
import { AbstractFormatter, Formatting, type FormattingAction, type FormattingContext } from 'langium/lsp'
import type { Position, Range, TextEdit } from 'vscode-languageserver-types'
import * as ast from '../generated/ast'

const FormattingOptions = {
  newLine: Formatting.newLine({ allowMore: true }),
  oneSpace: Formatting.oneSpace(),
  noSpace: Formatting.noSpace(),
  indent: Formatting.indent(),
  noIndent: Formatting.noIndent()
}

export class LikeC4Formatter extends AbstractFormatter {
  protected format(node: AstNode): void {
    this.removeIndentFromTopLevelStatements(node)
    this.indentContentInBraces(node)
    this.prependPropsWithSpace(node)
    this.surroundKeywordsWithSpace(node)

    this.formatSpecificationRule(node)
    this.formatElementDeclaration(node)
    this.formatRelation(node)
    this.formatWhereExpression(node)
    this.formatIncludeExcludeExpressions(node)
  }

  protected override createTextEdit(
    a: CstNode | undefined,
    b: CstNode,
    formatting: FormattingAction,
    context: FormattingContext
  ): TextEdit[] {
    const x = super.createTextEdit(a, b, formatting, context)
    return x
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

  protected prependTagsWithNewLine(node: AstNode) {
    if (
      ast.isElementBody(node)
      || ast.isRelationBody(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      const operator = formatter.property('tags')
      operator.prepend(FormattingOptions.newLine)
    }
  }

  protected formatRelation(node: AstNode) {
    if (
      ast.isRelation(node)
      || ast.isInOutRelationExpression(node)
      || ast.isOutgoingRelationExpression(node)
      || ast.isDynamicViewStep(node)
    ) {
      const formatter = this.getNodeFormatter(node)

      const implicit = formatter.properties('source', 'from').nodes.length == 0
      formatter.keywords('->', '<->', '-[')
        .prepend(implicit ? FormattingOptions.newLine : FormattingOptions.oneSpace)
      formatter.keywords('->', '<->', ']->').append(FormattingOptions.oneSpace)

      const kind = formatter.property('kind')
      const dotKinded = kind.nodes.length > 0
        && formatter.keyword('-[').nodes.length == 0
      if (dotKinded) {
        kind.append(FormattingOptions.oneSpace)
        kind.prepend(implicit ? FormattingOptions.newLine : FormattingOptions.oneSpace)
      }
      else {
        kind.surround(FormattingOptions.noSpace)
      }
    }
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
      ast.isModel(node)
      || ast.isSpecificationRule(node)
      || ast.isSpecificationElementKind(node)
      || ast.isSpecificationRelationshipKind(node)
      || ast.isLikeC4Lib(node)
      || ast.isElementBody(node)
      || ast.isMetadataBody(node)
      || ast.isModelViews(node)
      || ast.isRelationBody(node)
      || ast.isRelationStyleProperty(node)
      || ast.isDynamicViewBody(node)
      || ast.isElementViewBody(node)
      || ast.isExtendElementBody(node)
      || ast.isBorderStyleValue(node)
      || ast.isBorderProperty(node)
      || ast.isViewRuleStyle(node)
      || ast.isCustomElementProperties(node)
      || ast.isCustomRelationProperties(node)
      || ast.isStyleProperty(node)
      || ast.isNotationProperty(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      const openBrace = formatter.keywords('{')
      const closeBrace = formatter.keywords('}')

      const interiorNodes = formatter.interior(openBrace, closeBrace)

      // Workaround for tags as they are parsed as overlapping regions.
      // E.g. '#tag1, #tag2' will be parsed as two nodes: '#tag1' and '#tag1, #tag2'
      let perviousNode = null
      for (const interiorNode of interiorNodes.nodes) {
        if (!perviousNode || !this.areOverlap(perviousNode, interiorNode)) {
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

  protected prependPropsWithSpace(node: AstNode) {
    if (
      ast.isElement(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.properties('props').prepend(FormattingOptions.oneSpace)
    }
    if (
      ast.isRelation(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.properties('title', 'tags').prepend(FormattingOptions.oneSpace)
    }
  }

  protected appendKeywordsWithSpace(node: AstNode) {
    if (
      ast.isSpecificationElementKind(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.keywords('element').append(FormattingOptions.oneSpace)
    }
  }

  protected surroundKeywordsWithSpace(node: AstNode) {
    const defaultFormatter = this.getNodeFormatter(node)
    defaultFormatter.keywords(
      'extends',
      'of',
      'with',
      'where'
    ).surround(FormattingOptions.oneSpace)

    defaultFormatter.keywords(
      // 'icons',
      // 'kind',
      'title',
      'technology',
      'description',
      'color',
      // 'extend',
      // 'this',
      // 'it',
      'style',
      'link',
      // 'metadata',
      // 'extends',
      // 'dynamic',
      'view',
      'autoLayout',
      'TopBottom',
      'LeftRight',
      'BottomTop',
      'RightLeft'
      // 'element.tag',
      // 'element.kind'
    ).append(FormattingOptions.oneSpace)
  }

  protected formatElementDeclaration(node: AstNode) {
    if (ast.isElement(node)) {
      const formatter = this.getNodeFormatter(node)

      const kind = GrammarUtils.findNodeForProperty(node.$cstNode, 'kind')
      const name = GrammarUtils.findNodeForProperty(node.$cstNode, 'name')

      if (name && kind && this.compareRanges(name, kind) > 0) {
        formatter.cst([name]).prepend(FormattingOptions.oneSpace)
      }
    }
  }

  protected formatSpecificationRule(node: AstNode) {
    if (
      ast.isSpecificationElementKind(node)
      || ast.isSpecificationRelationshipKind(node)
      || ast.isSpecificationTag(node)
    ) {
      const formatter = this.getNodeFormatter(node)

      formatter.keywords('element', 'relationship', 'tag', 'color')
        .append(FormattingOptions.oneSpace)
    }
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

      if (!node.$cstNode || !this.isMultiline(node.$cstNode)) {
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
      const isMultiline = parent?.$cstNode && this.isMultiline(parent?.$cstNode)
      
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

  private areOverlap(a: CstNode, b: CstNode): boolean {
    ;[a, b] = this.compareRanges(a, b) > 0 ? [b, a] : [a, b]

    return this.isInRagne(a.range, b.range.start)
  }

  private compareRanges(a: CstNode, b: CstNode): number {
    const lineDiff = a.range.start.line - b.range.start.line

    return lineDiff !== 0 ? lineDiff : a.range.start.character - b.range.start.character
  }

  private isInRagne(range: Range, pos: Position): boolean {
    return !(pos.line < range.start.line
      || pos.line > range.end.line
      || pos.line == range.start.line && pos.character < range.start.character
      || pos.line == range.end.line && pos.character > range.end.character)
  }

  private isMultiline(node: CstNode): boolean {
    return node.range.start.line != node.range.end.line
  }

  private wrapCollector() {
    const originalCollector = this.collector
    this.collector = (node: CstNode, mode: 'prepend' | 'append', formatting: FormattingAction) => {
      originalCollector(node, mode, formatting)
    }
  }
}
