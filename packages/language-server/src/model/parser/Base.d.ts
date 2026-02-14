import type * as c4 from '@likec4/core';
import { type MarkdownOrString } from '@likec4/core';
import { type AstNode, type Reference } from 'langium';
import { type ParsedElementStyle, type ParsedLikeC4LangiumDocument, ast } from '../../ast';
import type { LikeC4Services } from '../../module';
import { type IsValidFn } from '../../validation';
import type { Project } from '../../workspace/ProjectsManager';
export type GConstructor<T = {}> = new (...args: any[]) => T;
export declare function toSingleLine(str: undefined | null): undefined;
export declare function toSingleLine(str: string): string;
export declare function toSingleLine(str: ast.MarkdownOrString): MarkdownOrString;
export declare function toSingleLine(str: ast.MarkdownOrString | string): MarkdownOrString | string;
export declare function toSingleLine(str: string | undefined | null): string | undefined;
export declare function toSingleLine(str: ast.MarkdownOrString | undefined | null): MarkdownOrString | undefined;
export declare function toSingleLine<S extends ast.MarkdownOrString | string | undefined | null>(str: S): S;
export declare function removeIndent(str: undefined): undefined;
export declare function removeIndent(str: string): string;
export declare function removeIndent(str: ast.MarkdownOrString): MarkdownOrString;
export declare function removeIndent(str: string | undefined): string | undefined;
export declare function removeIndent(str: ast.MarkdownOrString | undefined): MarkdownOrString | undefined;
export declare function removeIndent(str: ast.MarkdownOrString | string): MarkdownOrString | string;
export declare function removeIndent<S extends ast.MarkdownOrString | string | undefined>(str: S): S;
export type Base = GConstructor<BaseParser>;
type ParserLevel = 'base' | 'model' | 'deployment' | 'fqnref' | 'relation' | 'views' | 'globals' | 'imports' | 'specification';
export declare class BaseParser {
    readonly services: LikeC4Services;
    readonly doc: ParsedLikeC4LangiumDocument;
    readonly project: Project;
    isValid: IsValidFn;
    constructor(services: LikeC4Services, doc: ParsedLikeC4LangiumDocument, project: Project);
    logError(error: unknown, astNode?: AstNode | Reference<AstNode>, level?: ParserLevel): void;
    tryParse<N extends AstNode, T>(level: ParserLevel, node: N | undefined, fn: (node: NoInfer<N>) => T | undefined): T | undefined;
    tryMap<N extends AstNode, T>(level: ParserLevel, iterable: ReadonlyArray<N>, fn: (node: N) => T | undefined): T[];
    resolveFqn(node: ast.FqnReferenceable): c4.Fqn;
    getAstNodePath(node: AstNode): any;
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
    convertLinks(source?: ast.LinkProperty['$container']): c4.NonEmptyArray<c4.Link> | undefined;
    parseLinks(source?: ast.LinkProperty['$container']): c4.NonEmptyArray<c4.Link> | undefined;
    parseIconProperty(prop: ast.IconProperty | undefined): c4.IconUrl | undefined;
    parseImageAlias(value: string): string | undefined;
    parseColorLiteral(astNode: ast.ColorLiteral): c4.ColorLiteral | undefined;
    parseElementStyle(elementProps: Array<ast.ElementProperty> | ast.ElementStyleProperty | undefined): ParsedElementStyle;
    parseStyleProps(styleProps: Array<ast.StyleProperty> | undefined): ParsedElementStyle;
    /**
     * Parse base properties: title, description and technology
     *
     * @param props - body properties (inside '{...}')
     * @param override - optional, inline properties (right on the node)
     *                   have higher priority and override body properties
     */
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
}
export {};
