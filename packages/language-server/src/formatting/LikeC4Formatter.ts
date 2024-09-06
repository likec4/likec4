import { CstUtils, type AstNode, type CompositeCstNode, type CstNode } from 'langium'
import { AbstractFormatter, Formatting, type FormattingAction, type FormattingContext } from 'langium/lsp'
import type { Position, Range, TextEdit } from 'vscode-languageserver-types'
import { GrammarUtils } from 'langium'
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
    this.surroundOperatorsWithSpace(node)
    this.surroundArrowsWithSpace(node)
    this.surroundKeywordsWithSpace(node)

    this.formatElementDeclaration(node)
  }

  protected override createTextEdit(a: CstNode | undefined, b: CstNode, formatting: FormattingAction, context: FormattingContext): TextEdit[] {
    return super.createTextEdit(a, b, formatting, context)
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

  protected surroundArrowsWithSpace(node: AstNode) {
    if (
      ast.isRelation(node)
      || ast.isOutgoingRelationExpression(node)
      || ast.isInOutRelationExpression(node)
      || ast.isDynamicViewStep(node)
    ) {
      const formatter = this.getNodeFormatter(node)
      formatter.properties('isBidirectional', 'isBackward')
        .surround(FormattingOptions.oneSpace)

      formatter.keywords('-[')
        .prepend(FormattingOptions.oneSpace)
        .prepend(Formatting.newLines(0, { allowMore: true }))
      formatter.keywords(']->').append(FormattingOptions.oneSpace)
    }
    if (ast.isIncomingRelationExpression(node)) {
      const formatter = this.getNodeFormatter(node)
      formatter.keyword('->').append(FormattingOptions.oneSpace)
    }
    if (ast.isRelation(node)) {
      const formatter = this.getNodeFormatter(node)
      if (formatter.property('source').nodes.length != 0) {
        formatter.keyword('->').surround(FormattingOptions.oneSpace)
      }
    }
    if (ast.isDynamicViewStep(node)) {
      const formatter = this.getNodeFormatter(node)
      formatter.keyword('->').surround(FormattingOptions.oneSpace)
    }
    // if(ast.isImplicitRelation(node)) {
    //     const formatter = this.getNodeFormatter(node);
    //     if(formatter.keywords('this', 'it').nodes.length == 0) {
    //         formatter.keyword('->').append(FormattingOptions.oneSpace);
    //     }
    //     else {
    //         formatter.keyword('->').surround(FormattingOptions.oneSpace);
    //     }
    // }
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
      // 'element',
      // 'tag',
      // 'kind',
      // 'relationship',
      'title',
      'technology',
      'description',
      // 'extend',
      // 'this',
      // 'it',
      'style',
      'link',
      // 'metadata',
      // 'extends',
      // 'dynamic',
      'view',
      // 'TopBottom',
      // 'LeftRight',
      // 'BottomTop',
      // 'RightLeft',
      'include',
      'exclude'
      // 'element.tag',
      // 'element.kind'
    ).append(FormattingOptions.oneSpace)
  }

  private formatElementDeclaration(node: AstNode){
    if(ast.isElement(node)) {
      const formatter = this.getNodeFormatter(node)

      const contentNodes = (node?.$cstNode as CompositeCstNode).content.map(x => x.astNode)
      const kind = GrammarUtils.findNodeForProperty(node.$cstNode, 'kind')
      const name = GrammarUtils.findNodeForProperty(node.$cstNode, 'name')

      if(name && kind && this.compareRanges(name, kind) > 0){
        formatter.cst([name]).prepend(FormattingOptions.oneSpace)
      }
    }
  }

  private areOverlap(a: CstNode, b: CstNode): boolean {
    [a, b] = this.compareRanges(a, b) > 0 ? [b, a] : [a, b]

    return this.isInRagne(a.range, b.range.start)
  }

  private compareRanges(a: CstNode, b: CstNode): number {
    const lineDiff = a.range.start.line - b.range.start.line;
    
    return lineDiff !== 0 ? lineDiff : a.range.start.character - b.range.start.character
  }

  private isInRagne(range: Range, pos: Position): boolean {
    return !(pos.line < range.start.line
      || pos.line > range.end.line
      || pos.line == range.start.line && pos.character < range.start.character
      || pos.line == range.end.line && pos.character > range.end.character)
  }

  private wrapCollector() {
    const originalCollector = this.collector
    this.collector = (node: CstNode, mode: 'prepend' | 'append', formatting: FormattingAction) => {
      originalCollector(node, mode, formatting)
    }
  }
}
