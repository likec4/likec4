import type * as c4 from '@likec4/core';
import type { Except } from 'type-fest';
import { ast } from '../../ast';
import { type Base } from './Base';
export type WithExpressionV2 = ReturnType<typeof ExpressionV2Parser>;
export declare function ExpressionV2Parser<TBase extends Base>(B: TBase): {
    new (...args: any[]): {
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
    };
} & TBase;
