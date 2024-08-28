import { AbstractFormatter, Formatting } from 'langium/lsp';
import type { AstNode } from 'langium';
import * as ast from '../generated/ast';

const FormattingOptions = {
    newLine: Formatting.newLine({allowMore: true}),
    oneSpace: Formatting.oneSpace(),
    noSpace: Formatting.noSpace(),
    indent: Formatting.indent(),
    noIndent: Formatting.noIndent(),
}

export class LikeC4Formatter extends AbstractFormatter {

    protected format(node: AstNode): void {
        this.removeIndentFromTopLevelStatements(node);
        this.indentContentInBraces(node);
        this.prependsPropsWithSpace(node);
        this.surroundsOperatorsWithSpace(node);
        this.surroundsArrowsWithSpace(node);
        this.surroundsKeywordsWithSpace(node);
    }

    protected surroundsOperatorsWithSpace(node: AstNode) {
        if(
            ast.isWhereElementExpression(node)
            || ast.isWhereRelationExpression(node)
            || ast.isWhereElement(node)
        ) {
            const formatter = this.getNodeFormatter(node);
            const operator = formatter.properties('operator', 'not');
            operator.surround(FormattingOptions.oneSpace);
            formatter.keyword('not').surround(FormattingOptions.oneSpace);
        }
    }

    protected surroundsArrowsWithSpace(node: AstNode) {
        if(
            ast.isExplicitRelation(node)
            || ast.isImplicitRelation(node)
            || ast.isOutgoingRelationExpression(node)
            || ast.isInOutRelationExpression(node)
            || ast.isDynamicViewStep(node)
        ) {
            const formatter = this.getNodeFormatter(node);
            formatter.properties('isBidirectional', 'isBackward')
                .surround(FormattingOptions.oneSpace);
            
            formatter.keywords('-[').prepend(FormattingOptions.oneSpace);
            formatter.keywords(']->').append(FormattingOptions.oneSpace);
        }
        if(ast.isIncomingRelationExpression(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('->').append(FormattingOptions.oneSpace);
        }        
        if(ast.isExplicitRelation(node)) {
            const formatter = this.getNodeFormatter(node);
            if(formatter.property('source').nodes.length != 0) {
                formatter.keyword('->').surround(FormattingOptions.oneSpace);
            }
        }                
        if(ast.isDynamicViewStep(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('->').surround(FormattingOptions.oneSpace);
        }
        if(ast.isImplicitRelation(node)) {
            const formatter = this.getNodeFormatter(node);
            if(formatter.keywords('this', 'it').nodes.length == 0) {
                formatter.keyword('->').append(FormattingOptions.oneSpace);
            }
            else {
                formatter.keyword('->').surround(FormattingOptions.oneSpace);
            }
        }
    }

    protected removeIndentFromTopLevelStatements(node: AstNode) {
        if(
            ast.isModel(node)
            || ast.isSpecificationRule(node)
            || ast.isModelViews(node)
            || ast.isLikeC4Lib(node)) {
                
            const formatter = this.getNodeFormatter(node);
            formatter.keywords('specification', 'model', 'views', 'likec4lib')
                .prepend(FormattingOptions.noIndent);
        }
    }

    protected indentContentInBraces(node: AstNode) {
        if(
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
            || ast.isStyleProperties(node)
        ) {
            const formatter = this.getNodeFormatter(node);
            const openBrace = formatter.keywords('{');
            const closeBrace = formatter.keywords('}');

            openBrace.prepend(FormattingOptions.oneSpace).append(Formatting.newLine({allowMore: true}));
            closeBrace.prepend(Formatting.newLine({allowMore: true}));
            formatter.interior(openBrace, closeBrace).prepend(FormattingOptions.indent);
        }
    }

    protected prependsPropsWithSpace(node: AstNode) {
        if(
            ast.isElement(node)
        ) {
            const formatter = this.getNodeFormatter(node);
            formatter.properties('props').prepend(FormattingOptions.oneSpace);
        }
        if(
            ast.isImplicitRelation(node)
            || ast.isExplicitRelation(node)
        ) {
            const formatter = this.getNodeFormatter(node);
            formatter.properties('title', 'tags').prepend(FormattingOptions.oneSpace);
        }
    }

    protected surroundsKeywordsWithSpace(node: AstNode) {
        const defaultFormatter = this.getNodeFormatter(node);
        defaultFormatter.keywords(
            'extends',
            'of',
            'with',
            'where'
        ).surround(FormattingOptions.oneSpace);
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
            'exclude',
            // 'element.tag',
            // 'element.kind'
        ).append(FormattingOptions.oneSpace);
    }
}