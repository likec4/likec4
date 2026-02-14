import { nonexhaustive } from '@likec4/core';
import { GrammarUtils, } from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import { filter, isTruthy } from 'remeda';
import * as ast from '../generated/ast';
import * as utils from './utils';
import { isMultiline } from './utils';
const FormattingOptions = {
    newLine: Formatting.newLine({ allowMore: true }),
    oneSpace: Formatting.oneSpace(),
    noSpace: Formatting.noSpace(),
    indent: Formatting.indent({ allowMore: true }),
    noIndent: Formatting.noIndent(),
};
export class LikeC4Formatter extends AbstractFormatter {
    options = {
        quoteStyle: 'auto',
    };
    extendedFormattingCommands = [];
    constructor(services) {
        super();
        services.shared.workspace.ConfigurationProvider.onConfigurationSectionUpdate(update => this.onConfigurationUpdate(update.configuration.formatting));
    }
    doDocumentFormat(document, options, range) {
        this.extendedFormattingCommands = [];
        const edits = super.doDocumentFormat(document, options, range);
        this.doExtendedFormatting(edits);
        return edits;
    }
    format(node) {
        this.removeIndentFromTopLevelStatements(node);
        this.indentContentInBraces(node);
        this.normalizeQuotes(node);
        // Imports
        this.formatImports(node);
        // Specification
        this.formatSpecificationRule(node);
        // Globals
        this.formatGlobals(node);
        // Models
        this.formatElementDeclaration(node);
        this.formatExtendElement(node);
        this.formatRelation(node);
        this.formatMetadataProperty(node);
        // Deployment
        this.formatDeploymentNodeDeclaration(node);
        this.formatDeployedInstance(node);
        this.formatDeploymentRelation(node);
        this.formatExtendDeployment(node);
        // Views
        this.formatView(node);
        this.formatViewRuleGroup(node);
        this.formatViewRuleGlobalStyle(node);
        this.formatViewRuleGlobalPredicate(node);
        this.formatIncludeExcludeExpressions(node);
        this.formatWhereExpression(node);
        this.formatWhereRelationExpression(node);
        this.formatWhereElementExpression(node);
        this.formatRelationExpression(node);
        this.formatAutolayoutProperty(node);
        this.formatWithPredicate(node);
        // Common
        this.formatViewRuleStyle(node);
        this.formatLeafProperty(node);
        this.formatLinkProperty(node);
        this.formatNavigateToProperty(node);
        this.formatTags(node);
    }
    formatTags(node) {
        this.on(node, ast.isTags, (n, f) => {
            const tags = GrammarUtils.findNodesForProperty(n.$cstNode, 'values')
                .filter(isTruthy)
                .slice(1);
            f.cst(tags)
                .prepend(FormattingOptions.oneSpace);
            f.keywords(',')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
        });
    }
    formatDeploymentRelation(node) {
        this.on(node, ast.isDeploymentRelation, (n, f) => {
            const sourceNodes = n?.source?.$cstNode ? [n?.source?.$cstNode] : [];
            f.cst(sourceNodes).append(FormattingOptions.oneSpace);
            f.keywords(']->').prepend(FormattingOptions.noSpace);
            f.keywords('-[').append(FormattingOptions.noSpace);
            f.nodes(...filter([
                n.target,
                n.tags,
            ], isTruthy)).prepend(FormattingOptions.oneSpace);
            f.properties('title', 'description', 'technology').prepend(FormattingOptions.oneSpace);
        });
    }
    formatExtendDeployment(node) {
        this.on(node, ast.isExtendDeployment, (n, f) => {
            f.keywords('extend').append(FormattingOptions.oneSpace);
        });
    }
    formatRelation(node) {
        this.on(node, (n) => ast.isRelation(n) || ast.isDeploymentRelation(n), (n, f) => {
            const sourceNodes = n?.source?.$cstNode ? [n?.source?.$cstNode] : [];
            f.cst(sourceNodes).append(FormattingOptions.oneSpace);
            f.keywords(']->').prepend(FormattingOptions.noSpace);
            f.keywords('-[').append(FormattingOptions.noSpace);
            f.nodes(...filter([
                n.target,
                n.tags,
            ], isTruthy)).prepend(FormattingOptions.oneSpace);
            f.properties('title', 'description', 'technology').prepend(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isDynamicViewStep, (n, f) => {
            f.keywords('->', '<-').surround(FormattingOptions.oneSpace);
            f.property('dotKind')
                .prepend(FormattingOptions.oneSpace)
                .append(FormattingOptions.oneSpace);
            f.keywords(']->')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
            f.keywords('-[')
                .prepend(FormattingOptions.oneSpace)
                .append(FormattingOptions.noSpace);
            f.properties('title').prepend(FormattingOptions.oneSpace);
            const wrapToNextLine = 
            // Dynamic step chain with multiline source
            (ast.isDynamicStepChain(n) && isMultiline(n.$cstNode))
                // This is the beginning of the series
                || (ast.isDynamicStepSingle(n) && ast.isDynamicStepChain(n.$container) && isMultiline(n.$container.$cstNode));
            if (!wrapToNextLine) {
                return;
            }
            f.property('dotKind')
                .prepend(Formatting.indent({ allowLess: false, allowMore: true, priority: 2 }));
            f.keywords('->', '-[')
                .prepend(Formatting.indent({ allowLess: false, allowMore: true, priority: 2 }));
            if (n.custom?.$cstNode && isMultiline(n.custom.$cstNode)) {
                f.property('custom')
                    .prepend({
                    options: {
                        allowLess: false,
                        allowMore: true,
                        priority: 2,
                    },
                    moves: [{
                            tabs: 1,
                        }],
                });
            }
        });
    }
    removeIndentFromTopLevelStatements(node) {
        if (ast.isLikeC4Grammar(node.$container)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keywords('specification', 'model', 'views', 'likec4lib', 'global', 'deployments', 'import')
                .prepend(FormattingOptions.noIndent);
        }
    }
    indentContentInBraces(node) {
        if (ast.isLikeC4Lib(node)
            || ast.isSpecificationRule(node)
            || ast.isSpecificationElementKind(node)
            || ast.isSpecificationRelationshipKind(node)
            || ast.isSpecificationDeploymentNodeKind(node)
            || ast.isGlobals(node)
            || ast.isGlobalStyle(node)
            || ast.isGlobalStyleGroup(node)
            || ast.isGlobalPredicateGroup(node)
            || ast.isGlobalDynamicPredicateGroup(node)
            || ast.isGlobalStyleGroup(node)
            || ast.isModel(node)
            || ast.isElementBody(node)
            || ast.isExtendElementBody(node)
            || ast.isRelationBody(node)
            || ast.isRelationStyleProperty(node)
            || ast.isMetadataBody(node)
            || ast.isModelViews(node)
            || ast.isElementViewBody(node)
            || ast.isDynamicViewBody(node)
            || ast.isDeploymentViewBody(node)
            || ast.isViewRuleStyle(node)
            || ast.isViewRuleGroup(node)
            || ast.isCustomElementProperties(node)
            || ast.isCustomRelationProperties(node)
            || ast.isElementStyleProperty(node)
            || ast.isDynamicViewParallelSteps(node)
            || ast.isModelDeployments(node)
            || ast.isDeploymentNodeBody(node)
            || ast.isDeploymentRelationBody(node)
            || ast.isDeployedInstanceBody(node)
            || ast.isExtendDeploymentBody(node)) {
            const formatter = this.getNodeFormatter(node);
            const openBrace = formatter.keywords('{');
            openBrace
                .prepend(FormattingOptions.noIndent)
                .prepend(FormattingOptions.oneSpace);
            const multiline = isMultiline(node.$cstNode);
            const closeBrace = formatter.keywords('}');
            const interiorNodes = formatter.interior(openBrace, closeBrace);
            // Workaround for tags as they are parsed as overlapping regions.
            // E.g. '#tag1, #tag2' will be parsed as two nodes: '#tag1' and '#tag1, #tag2'
            let previousNode = null;
            for (const interiorNode of interiorNodes.nodes) {
                if (!multiline) {
                    formatter.cst([interiorNode])
                        .surround(FormattingOptions.oneSpace);
                    continue;
                }
                if (!previousNode || !utils.areOverlap(previousNode, interiorNode)) {
                    formatter.cst([interiorNode])
                        .prepend(Formatting.newLine({ allowMore: true }))
                        .prepend(FormattingOptions.indent);
                }
                previousNode = interiorNode;
            }
            if (multiline) {
                closeBrace
                    .prepend(FormattingOptions.noIndent)
                    .prepend(Formatting.newLine({ allowMore: true }));
            }
            else {
                closeBrace
                    .prepend(Formatting.oneSpace({ allowLess: true }));
            }
        }
    }
    appendKeywordsWithSpace(node) {
        this.on(node, ast.isElementKind)
            ?.keywords('element').append(FormattingOptions.oneSpace);
    }
    formatView(node) {
        this.on(node, ast.isElementView, (n, f) => {
            if (n.extends || n.viewOf || n.name) {
                f.keywords('view').append(FormattingOptions.oneSpace);
            }
            f.keywords('of', 'extends').surround(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isDynamicView)
            ?.keywords('dynamic', 'view').append(FormattingOptions.oneSpace);
        this.on(node, ast.isDeploymentView)
            ?.keywords('deployment', 'view').append(FormattingOptions.oneSpace);
    }
    formatLeafProperty(node) {
        if (ast.isElementStringProperty(node)
            || ast.isRelationStringProperty(node)
            || ast.isViewStringProperty(node)
            || ast.isNotationProperty(node)
            || ast.isNotesProperty(node)
            || ast.isSpecificationElementStringProperty(node)
            || ast.isSpecificationRelationshipStringProperty(node)
            || ast.isColorProperty(node)
            || ast.isLineProperty(node)
            || ast.isArrowProperty(node)
            || ast.isIconProperty(node)
            || ast.isShapeProperty(node)
            || ast.isBorderProperty(node)
            || ast.isOpacityProperty(node)
            || ast.isMultipleProperty(node)
            || ast.isIconColorProperty(node)
            || ast.isIconSizeProperty(node)
            || ast.isIconPositionProperty(node)
            || ast.isShapeSizeProperty(node)
            || ast.isPaddingSizeProperty(node)
            || ast.isTextSizeProperty(node)) {
            const formatter = this.getNodeFormatter(node);
            const colon = formatter.keyword(':');
            const propertyName = formatter.keywords('title', 'description', 'technology', 'summary', 'notation', 'notes', 'color', 'line', 'head', 'tail', 'icon', 'iconColor', 'iconSize', 'iconPosition', 'shape', 'border', 'opacity', 'multiple', 'size', 'padding', 'textSize');
            if (colon.nodes.length === 0) {
                propertyName
                    .append(FormattingOptions.oneSpace);
            }
            else {
                colon
                    .prepend(FormattingOptions.noSpace)
                    .append(FormattingOptions.oneSpace);
            }
            formatter.keyword(';')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.newLine);
        }
    }
    formatLinkProperty(node) {
        this.on(node, ast.isLinkProperty, (n, f) => {
            f.keyword('link').append(FormattingOptions.oneSpace);
            f.property('value').append(FormattingOptions.oneSpace);
            f.keyword(':')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
            f.keyword(';')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.newLine);
        });
    }
    formatNavigateToProperty(node) {
        this.on(node, ast.isNavigateToProperty)
            ?.property('key').append(FormattingOptions.oneSpace);
    }
    formatAutolayoutProperty(node) {
        this.on(node, ast.isViewRuleAutoLayout, (n, f) => {
            f.keyword('autoLayout').append(FormattingOptions.oneSpace);
            f.property('rankSep').prepend(FormattingOptions.oneSpace);
            f.property('nodeSep').prepend(FormattingOptions.oneSpace);
        });
    }
    formatMetadataProperty(node) {
        this.on(node, ast.isMetadataAttribute, (n, f) => {
            f.property('key').append(FormattingOptions.oneSpace);
            f.keyword(':')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
            f.keyword(';')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.newLine);
        });
    }
    formatElementDeclaration(node) {
        this.on(node, ast.isElement, (n, f) => {
            const kind = GrammarUtils.findNodeForProperty(n.$cstNode, 'kind');
            const name = GrammarUtils.findNodeForProperty(n.$cstNode, 'name');
            if (name && kind) {
                // system sys1
                if (utils.compareRanges(name, kind) > 0) {
                    f.cst([kind]).append(FormattingOptions.oneSpace);
                }
                // sys1 = system
                else {
                    f.cst([name]).append(FormattingOptions.oneSpace);
                    f.cst([kind]).prepend(FormattingOptions.oneSpace);
                }
            }
            f.properties('props').prepend(FormattingOptions.oneSpace);
        });
    }
    formatExtendElement(node) {
        this.on(node, ast.isExtendElement, (n, f) => {
            f.keywords('extend').append(FormattingOptions.oneSpace);
        });
    }
    formatGlobals(node) {
        this.on(node, ast.isGlobalStyle, (n, f) => {
            f.keyword('style').append(FormattingOptions.oneSpace);
            f.property('id').append(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isGlobalStyleGroup, (n, f) => {
            f.keyword('styleGroup').append(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isGlobalPredicateGroup, (n, f) => {
            f.keyword('predicateGroup').append(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isGlobalDynamicPredicateGroup, (n, f) => {
            f.keyword('dynamicPredicateGroup').append(FormattingOptions.oneSpace);
        });
    }
    formatImports(node) {
        this.on(node, ast.isImportsFromPoject, (n, f) => {
            f.keyword('import').append(FormattingOptions.oneSpace);
            f.keywords('{', '}', 'from').surround(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isImported, (n, f) => {
            f.keywords(',')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
        });
    }
    formatSpecificationRule(node) {
        if (ast.isSpecificationElementKind(node)
            || ast.isSpecificationRelationshipKind(node)
            || ast.isSpecificationTag(node)
            || ast.isSpecificationDeploymentNodeKind(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keywords('element', 'relationship', 'tag', 'deploymentNode')
                .append(FormattingOptions.oneSpace);
        }
        if (ast.isSpecificationColor(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('color').append(FormattingOptions.oneSpace);
            formatter.property('name').append(FormattingOptions.oneSpace);
        }
    }
    formatWithPredicate(node) {
        if (ast.isFqnExprWith(node)
            || ast.isRelationExprWith(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('with').prepend(FormattingOptions.oneSpace);
        }
    }
    formatDeploymentNodeDeclaration(node) {
        this.on(node, ast.isDeploymentNode, (n, f) => {
            const kind = GrammarUtils.findNodeForProperty(n.$cstNode, 'kind');
            const name = GrammarUtils.findNodeForProperty(n.$cstNode, 'name');
            if (name && kind) {
                // system sys1
                if (utils.compareRanges(name, kind) > 0) {
                    f.cst([kind]).append(FormattingOptions.oneSpace);
                }
                // sys1 = system
                else {
                    f.cst([name]).append(FormattingOptions.oneSpace);
                    f.cst([kind]).prepend(FormattingOptions.oneSpace);
                }
            }
            f.properties('title').prepend(FormattingOptions.oneSpace);
        });
    }
    formatDeployedInstance(node) {
        this.on(node, ast.isDeployedInstance, (n, f) => {
            const eqNode = n.$cstNode?.content.find(c => c.text === '=');
            if (eqNode) {
                f.cst([eqNode]).surround(FormattingOptions.oneSpace);
            }
            f.keyword('instanceOf').append(FormattingOptions.oneSpace);
            f.property('title').prepend(FormattingOptions.oneSpace);
        });
    }
    formatViewRuleGlobalStyle(node) {
        this.on(node, ast.isViewRuleGlobalStyle, (n, f) => {
            f.keywords('global', 'style').append(FormattingOptions.oneSpace);
        });
    }
    formatViewRuleGlobalPredicate(node) {
        const formatter = this.getNodeFormatter(node);
        if (ast.isViewRuleGlobalPredicateRef(node)
            || ast.isDynamicViewGlobalPredicateRef(node)) {
            formatter.keywords('global', 'predicate').append(FormattingOptions.oneSpace);
        }
    }
    formatViewRuleGroup(node) {
        this.on(node, ast.isViewRuleGroup, (n, f) => {
            f.keyword('group').append(FormattingOptions.oneSpace);
        });
    }
    formatViewRuleStyle(node) {
        this.on(node, ast.isViewRuleStyle)
            ?.keyword('style').append(FormattingOptions.oneSpace);
        this.on(node, ast.isDeploymentViewRuleStyle)
            ?.keyword('style').append(FormattingOptions.oneSpace);
        this.on(node, ast.isExpressions)
            ?.keyword(',')
            .prepend(FormattingOptions.noSpace)
            .append(FormattingOptions.oneSpace);
        this.on(node, ast.isFqnExpressions)
            ?.keyword(',')
            .prepend(FormattingOptions.noSpace)
            .append(FormattingOptions.oneSpace);
    }
    formatWhereExpression(node) {
        if (ast.isRelationExprWhere(node)
            || ast.isFqnExprWhere(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('where').append(FormattingOptions.oneSpace);
        }
    }
    formatWhereRelationExpression(node) {
        this.on(node, ast.isWhereRelationExpression, (n, f) => {
            f.property('operator').surround(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isWhereRelationNegation, (n, f) => {
            f.keyword('not').append(FormattingOptions.oneSpace);
        });
        if (ast.isWhereRelation(node)
            || ast.isWhereRelationTag(node)
            || ast.isWhereRelationKind(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('operator').surround(FormattingOptions.oneSpace);
            formatter.property('not').surround(FormattingOptions.oneSpace);
        }
    }
    formatWhereElementExpression(node) {
        this.on(node, ast.isWhereElementExpression, (n, f) => {
            f.property('operator').surround(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isWhereElementNegation, (n, f) => {
            f.keyword('not').append(FormattingOptions.oneSpace);
        });
        if (ast.isWhereElement(node)
            || ast.isWhereElementTag(node)
            || ast.isWhereElementKind(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('operator').surround(FormattingOptions.oneSpace);
            formatter.property('not').surround(FormattingOptions.oneSpace);
        }
    }
    formatIncludeExcludeExpressions(node) {
        if (ast.isDynamicViewRule(node)
            || ast.isViewRulePredicate(node)
            || ast.isDeploymentViewRulePredicate(node)) {
            const formatter = this.getNodeFormatter(node);
            if (!node.$cstNode || !utils.isMultiline(node.$cstNode)) {
                formatter.keywords('include', 'exclude')
                    .append(FormattingOptions.oneSpace);
            }
        }
        if (ast.isExpressions(node)) {
            const formatter = this.getNodeFormatter(node);
            const parent = this.findPredicateExpressionRoot(node);
            const isMultiline = parent?.$cstNode && utils.isMultiline(parent?.$cstNode);
            if (isMultiline) {
                formatter.property('value').prepend(FormattingOptions.indent);
            }
            formatter.keyword(',')
                .prepend(FormattingOptions.noSpace)
                .append(isMultiline ? FormattingOptions.newLine : FormattingOptions.oneSpace);
        }
    }
    formatRelationExpression(node) {
        this.on(node, ast.isIncomingRelationExpr, (n, f) => {
            f.keyword('->').append(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isInOutRelationExpr, (n, f) => {
            f.keyword('->').prepend(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isOutgoingRelationExpr, (n, f) => {
            f.keywords('->', '<->').prepend(FormattingOptions.oneSpace);
            f.keywords('-[')
                .prepend(FormattingOptions.oneSpace)
                .append(FormattingOptions.noSpace);
            f.keywords(']->')
                .prepend(FormattingOptions.noSpace)
                .append(FormattingOptions.oneSpace);
            f.property('dotKind')
                .prepend(FormattingOptions.oneSpace)
                .append(FormattingOptions.oneSpace);
        });
        this.on(node, ast.isDirectedRelationExpr, (n, f) => {
            f.property('target').prepend(FormattingOptions.oneSpace);
        });
    }
    findPredicateExpressionRoot(node) {
        let parent = node.$container;
        while (true) {
            if (!parent
                || ast.isDynamicViewRule(parent)
                || ast.isViewRulePredicate(parent)
                || ast.isDeploymentViewRulePredicate(parent)) {
                return parent;
            }
            parent = parent.$container;
        }
    }
    on(node, predicate, format) {
        const formatter = predicate(node) ? this.getNodeFormatter(node) : undefined;
        format && formatter && format(node, formatter);
        return formatter;
    }
    doExtendedFormatting(edits) {
        const quotesNormalizer = this.quotesNormalizerFactory(this.extendedFormattingCommands);
        for (let command of this.extendedFormattingCommands) {
            switch (command.type) {
                case 'normalizeQuotes':
                    quotesNormalizer(command, edits);
                    break;
                default:
                    nonexhaustive(command.type);
            }
        }
    }
    normalizeQuotes(node) {
        if (this.options.quoteStyle === 'ignore') {
            return;
        }
        let region = null;
        region = region ?? this.on(node, ast.isStringProperty)
            ?.property('value');
        region = region ?? this.on(node, ast.isElement)
            ?.properties('props');
        region = region ?? this.on(node, ast.isImportsFromPoject)
            ?.properties('project');
        region = region ?? this.on(node, ast.isRelation)
            ?.properties('title', 'technology');
        region = region ?? this.on(node, ast.isViewRuleGroup)
            ?.properties('title');
        region = region ?? this.on(node, ast.isDynamicViewStep)
            ?.properties('title');
        region = region ?? this.on(node, ast.isDeploymentNode)
            ?.properties('title');
        region = region ?? this.on(node, ast.isDeployedInstance)
            ?.properties('title');
        region = region ?? this.on(node, ast.isDeploymentRelation)
            ?.properties('title', 'technology');
        region = region ?? this.on(node, ast.isLinkProperty)
            ?.properties('title');
        if (region) {
            this.extendedFormattingCommands.push({ type: 'normalizeQuotes', region });
        }
    }
    quotesNormalizerFactory(commands) {
        const quoteStyle = this.options.quoteStyle != 'auto'
            ? this.options.quoteStyle
            : this.getAutoQuoteStyle(commands);
        return (command, edits) => {
            const quotesToReplace = quoteStyle === 'single' ? '"' : '\'';
            const quotesToInsert = quoteStyle === 'single' ? '\'' : '"';
            const markdownFence = quotesToInsert.repeat(3);
            const plainFence = quotesToInsert;
            const newEdits = command.region.nodes.map(node => {
                const fence = node.text.startsWith(`"""`) || node.text.startsWith(`'''`)
                    ? markdownFence
                    : plainFence;
                return {
                    range: node.range,
                    newText: fence +
                        this.escapeQuotesInternalQuotes(node.text.slice(fence.length, -fence.length), quotesToReplace, quotesToInsert) +
                        fence,
                };
            });
            edits.push(...newEdits);
        };
    }
    escapeQuotesInternalQuotes(text, quotesToReplace, quoteToInsert) {
        let result = '';
        let start = 0;
        while (start >= 0) {
            let pos = text.indexOf(quoteToInsert, start);
            if (pos < 0) {
                result += text.slice(start);
                break;
            }
            result += text.slice(start, pos);
            start = pos + 1;
            let escaped = false;
            while (pos > 0 && text[pos - 1] == '\\') {
                escaped = !escaped;
                pos--;
            }
            result += escaped ? quoteToInsert : `\\${quoteToInsert}`;
        }
        return result;
    }
    getAutoQuoteStyle(commands) {
        const nodes = commands.flatMap(x => x.region.nodes);
        const doubleQuotesCount = nodes.filter(x => x.text[0] == '"').length;
        return doubleQuotesCount * 2 >= nodes.length ? 'double' : 'single';
    }
    onConfigurationUpdate(options) {
        this.options = {
            ...this.options,
            ...options ?? {
                quoteStyle: 'auto',
            },
        };
    }
}
