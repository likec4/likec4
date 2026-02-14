import { type AstNode, type LangiumDocument } from 'langium';
import { AbstractFormatter, FormattingRegion } from 'langium/lsp';
import type { FormattingOptions as LSFormattingOptions, Range, TextEdit } from 'vscode-languageserver-types';
import type { LikeC4Services } from '../module';
type QuoteStyle = 'single' | 'double' | 'ignore' | 'auto';
interface LikeC4FormatterOptions {
    quoteStyle: QuoteStyle;
}
type ExtendedFormattingCommandType = 'normalizeQuotes';
interface ExtendedFormattingCommand {
    type: ExtendedFormattingCommandType;
    region: FormattingRegion;
}
export declare class LikeC4Formatter extends AbstractFormatter {
    protected options: LikeC4FormatterOptions;
    extendedFormattingCommands: ExtendedFormattingCommand[];
    constructor(services: LikeC4Services);
    protected doDocumentFormat(document: LangiumDocument, options: LSFormattingOptions, range?: Range): TextEdit[];
    protected format(node: AstNode): void;
    protected formatTags(node: AstNode): void;
    protected formatDeploymentRelation(node: AstNode): void;
    protected formatExtendDeployment(node: AstNode): void;
    protected formatRelation(node: AstNode): void;
    protected removeIndentFromTopLevelStatements(node: AstNode): void;
    protected indentContentInBraces(node: AstNode): void;
    protected appendKeywordsWithSpace(node: AstNode): void;
    protected formatView(node: AstNode): void;
    protected formatLeafProperty(node: AstNode): void;
    protected formatLinkProperty(node: AstNode): void;
    protected formatNavigateToProperty(node: AstNode): void;
    protected formatAutolayoutProperty(node: AstNode): void;
    protected formatMetadataProperty(node: AstNode): void;
    protected formatElementDeclaration(node: AstNode): void;
    protected formatExtendElement(node: AstNode): void;
    protected formatGlobals(node: AstNode): void;
    protected formatImports(node: AstNode): void;
    protected formatSpecificationRule(node: AstNode): void;
    protected formatWithPredicate(node: AstNode): void;
    protected formatDeploymentNodeDeclaration(node: AstNode): void;
    protected formatDeployedInstance(node: AstNode): void;
    protected formatViewRuleGlobalStyle(node: AstNode): void;
    protected formatViewRuleGlobalPredicate(node: AstNode): void;
    protected formatViewRuleGroup(node: AstNode): void;
    protected formatViewRuleStyle(node: AstNode): void;
    protected formatWhereExpression(node: AstNode): void;
    protected formatWhereRelationExpression(node: AstNode): void;
    protected formatWhereElementExpression(node: AstNode): void;
    protected formatIncludeExcludeExpressions(node: AstNode): void;
    protected formatRelationExpression(node: AstNode): void;
    private findPredicateExpressionRoot;
    private on;
    private doExtendedFormatting;
    protected normalizeQuotes(node: AstNode): void;
    private quotesNormalizerFactory;
    private escapeQuotesInternalQuotes;
    private getAutoQuoteStyle;
    private onConfigurationUpdate;
}
export {};
