import * as c4 from '@likec4/core';
import type { Except, Writable } from 'type-fest';
import { type ParsedAstDynamicView, type ParsedAstElementView, ast } from '../../ast';
import type { WithDeploymentView } from './DeploymentViewParser';
import type { WithPredicates } from './PredicatesParser';
export type WithViewsParser = ReturnType<typeof ViewsParser>;
type ViewRuleStyleOrGlobalRef = c4.ElementViewRuleStyle | c4.ViewRuleGlobalStyle;
export declare function ViewsParser<TBase extends WithPredicates & WithDeploymentView>(B: TBase): {
    new (...args: any[]): {
        parseViews(): void;
        parseElementView(astNode: ast.ElementView, additionalStyles: ViewRuleStyleOrGlobalRef[]): ParsedAstElementView;
        parseElementViewRule(astRule: ast.ViewRule): c4.ElementViewRule;
        parseViewRulePredicate(astNode: ast.ViewRulePredicate): c4.ElementViewPredicate;
        parseViewRuleGlobalPredicateRef(astRule: ast.ViewRuleGlobalPredicateRef | ast.DynamicViewGlobalPredicateRef): c4.ViewRuleGlobalPredicateRef;
        parseViewRuleStyleOrGlobalRef(astRule: ast.ViewRuleStyleOrGlobalRef): ViewRuleStyleOrGlobalRef;
        parseViewRuleGroup(astNode: ast.ViewRuleGroup): c4.ElementViewRuleGroup;
        parseViewRuleRank(astRule: ast.ViewRuleRank): c4.ElementViewRuleRank;
        parseViewRuleStyle(astRule: ast.ViewRuleStyle | ast.GlobalStyle): c4.ElementViewRuleStyle;
        parseViewRuleGlobalStyle(astRule: ast.ViewRuleGlobalStyle): c4.ViewRuleGlobalStyle;
        parseDynamicElementView(astNode: ast.DynamicView, additionalStyles: ViewRuleStyleOrGlobalRef[]): ParsedAstDynamicView;
        parseDynamicViewRule(astRule: ast.DynamicViewRule): c4.DynamicViewRule;
        parseDynamicViewIncludePredicate(astRule: ast.DynamicViewIncludePredicate): c4.DynamicViewIncludeRule;
        parseDynamicParallelSteps(node: ast.DynamicViewParallelSteps): c4.DynamicStepsParallel;
        /**
         * @returns non-empty array in case of step chain A -> B -> C
         */
        parseDynamicStep(node: ast.DynamicViewStep): c4.DynamicStep | c4.DynamicStepsSeries;
        recursiveParseDynamicStepChain(node: ast.DynamicStepChain, callstack?: Array<[source: c4.Fqn, target: c4.Fqn]>): c4.DynamicStep[];
        parseDynamicStepSingle(node: ast.DynamicStepSingle): c4.DynamicStep;
        parseAbstractDynamicStep(astnode: ast.AbstractDynamicStep): Writable<Except<c4.DynamicStep, "source", {
            requireExactProps: true;
        }>>;
        parsePredicate(astNode: ast.ExpressionV2): c4.ModelExpression;
        parseElementPredicate(astNode: ast.FqnExprOrWith): c4.ModelFqnExpr.Any;
        parseElementPredicateOrWhere(astNode: ast.FqnExprOrWhere): c4.ModelFqnExpr.OrWhere;
        parseElementExpression(astNode: ast.FqnExpr): c4.ModelFqnExpr;
        parseElementPredicateWhere(astNode: ast.FqnExprWhere): c4.ModelFqnExpr.Where;
        parseElementPredicateWith(astNode: ast.FqnExprWith): c4.ModelFqnExpr.Custom;
        parseRelationPredicate(astNode: ast.RelationExprOrWith): c4.ModelRelationExpr.Any;
        parseRelationPredicateOrWhere(astNode: ast.RelationExprOrWhere): c4.ModelRelationExpr.OrWhere;
        parseRelationPredicateWhere(astNode: ast.RelationExprWhere): c4.ModelRelationExpr.Where;
        parseRelationPredicateWith(astNode: ast.RelationExprWith): c4.ModelRelationExpr.Custom;
        parseRelationExpression(astNode: ast.RelationExpr): c4.ModelRelationExpr;
        parseFqnRef(astNode: ast.FqnRef): c4.FqnRef;
        parseExpressionV2(astNode: ast.ExpressionV2): c4.Expression;
        parseFqnExprOrWith(astNode: ast.FqnExprOrWith): c4.FqnExpr.Any;
        parseFqnExprWith(astNode: ast.FqnExprWith): c4.FqnExpr.Custom;
        parseFqnExprOrWhere(astNode: ast.FqnExprOrWhere): c4.FqnExpr.OrWhere;
        parseFqnExprWhere(astNode: ast.FqnExprWhere): c4.FqnExpr.Where;
        parseFqnExpr(astNode: ast.FqnExpr): c4.FqnExpr;
        parseFqnRefExpr(astNode: ast.FqnRefExpr): c4.FqnExpr.NonWildcard;
        parseFqnExpressions(astNode: ast.FqnExpressions): c4.FqnExpr[];
        parseRelationExprOrWith(astNode: ast.RelationExprOrWith): c4.RelationExpr.Any;
        parseRelationExprWith(astNode: ast.RelationExprWith): c4.RelationExpr.Custom;
        parseCustomRelationProperties(custom: ast.CustomRelationProperties | undefined): Except<c4.RelationExpr.Custom["customRelation"], "expr">;
        parseRelationExprOrWhere(astNode: ast.RelationExprOrWhere): c4.RelationExpr.OrWhere;
        parseRelationExprWhere(astNode: ast.RelationExprWhere): c4.RelationExpr.Where;
        parseRelationExpr(astNode: ast.RelationExpr): c4.RelationExpr.OrWhere;
        parseInlineKindCondition(astNode: ast.OutgoingRelationExpr): c4.WhereOperator | null;
        wrapInWhere(expr: c4.RelationExpr, condition: c4.WhereOperator | null): c4.RelationExpr.OrWhere;
        isValid: c4;
        readonly services: import("../../module").LikeC4Services;
        readonly doc: import("../../ast").ParsedLikeC4LangiumDocument;
        readonly project: import("../../workspace/ProjectsManager").Project;
        logError(error: unknown, astNode?: c4 | c4<c4>, level?: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports"): void;
        tryParse<N extends c4, T>(level: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports", node: N | undefined, fn: (node: NoInfer<N>) => T | undefined): T | undefined;
        tryMap<N extends c4, T>(level: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports", iterable: ReadonlyArray<N>, fn: (node: N) => T | undefined): T[];
        resolveFqn(node: ast.FqnReferenceable): c4.Fqn;
        getAstNodePath(node: c4): any;
        getMetadata(metadataAstNode: ast.MetadataProperty | undefined): {
            [key: string]: string | string[];
        } | undefined;
        parseMarkdownOrString(markdownOrString: ast.MarkdownOrString | undefined): c4.MarkdownOrString | undefined;
        convertTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): any;
        parseTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): c4.NonEmptyArray<c4.Tag> | null;
        convertLinks(source?: ast.LinkProperty["$container"]): c4.NonEmptyArray<c4.Link> | undefined;
        parseLinks(source?: ast.LinkProperty["$container"]): c4.NonEmptyArray<c4.Link> | undefined;
        parseIconProperty(prop: ast.IconProperty | undefined): c4.IconUrl | undefined;
        parseImageAlias(value: string): string | undefined;
        parseColorLiteral(astNode: ast.ColorLiteral): c4.ColorLiteral | undefined;
        parseElementStyle(elementProps: Array<ast.ElementProperty> | ast.ElementStyleProperty | undefined): import("../../ast").ParsedElementStyle;
        parseStyleProps(styleProps: Array<ast.StyleProperty> | undefined): import("../../ast").ParsedElementStyle;
        parseBaseProps(props: {
            title?: ast.MarkdownOrString | undefined;
            summary?: ast.MarkdownOrString | undefined;
            description?: ast.MarkdownOrString | undefined;
            technology?: ast.MarkdownOrString | undefined;
        }, override?: {
            title?: string | undefined;
            summary?: string | undefined;
            description?: string | undefined;
            technology?: string | undefined;
        }): {
            title?: string;
            summary?: c4.MarkdownOrString;
            description?: c4.MarkdownOrString;
            technology?: string;
        };
        parseDeploymentView(astNode: ast.DeploymentView): import("../../ast").ParsedAstDeploymentView;
        parseDeploymentViewRule(astRule: ast.DeploymentViewRule): c4.DeploymentViewRule;
        parseDeploymentViewRulePredicate(astRule: ast.DeploymentViewRulePredicate): c4.DeploymentViewPredicate;
        parseDeploymentViewRuleStyle(astRule: ast.DeploymentViewRuleStyle): c4.DeploymentViewRuleStyle;
        parseDeployment(): void;
        parseDeploymentNode(astNode: ast.DeploymentNode): import("../../ast").ParsedAstDeployment.Node;
        parseDeployedInstance(astNode: ast.DeployedInstance): import("../../ast").ParsedAstDeployment.Instance;
        parseExtendDeployment(astNode: ast.ExtendDeployment): import("../../ast").ParsedAstExtend | null;
        _resolveDeploymentRelationSource(node: ast.DeploymentRelation): c4;
        parseDeploymentRelation(astNode: ast.DeploymentRelation): import("../../ast").ParsedAstDeploymentRelation;
    };
} & TBase;
export {};
