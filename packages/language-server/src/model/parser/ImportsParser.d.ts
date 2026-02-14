import { type ProjectId } from '@likec4/core';
import type { ast } from '../../ast';
import type { Base } from './Base';
export declare function ImportsParser<TBase extends Base>(B: TBase): {
    new (...args: any[]): {
        parseImports(): void;
        isValid: ProjectId;
        readonly services: import("../../module").LikeC4Services;
        readonly doc: import("../../ast").ParsedLikeC4LangiumDocument;
        readonly project: import("../../workspace/ProjectsManager").Project;
        logError(error: unknown, astNode?: ProjectId | ProjectId<ProjectId>, level?: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports"): void;
        tryParse<N extends ProjectId, T>(level: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports", node: N | undefined, fn: (node: NoInfer<N>) => T | undefined): T | undefined;
        tryMap<N extends ProjectId, T>(level: "specification" | "model" | "views" | "deployment" | "relation" | "base" | "fqnref" | "globals" | "imports", iterable: ReadonlyArray<N>, fn: (node: N) => T | undefined): T[];
        resolveFqn(node: ast.FqnReferenceable): ProjectId;
        getAstNodePath(node: ProjectId): any;
        getMetadata(metadataAstNode: ast.MetadataProperty | undefined): {
            [key: string]: string | string[];
        } | undefined;
        parseMarkdownOrString(markdownOrString: ast.MarkdownOrString | undefined): ProjectId | undefined;
        convertTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): any;
        parseTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): ProjectId<ProjectId> | null;
        convertLinks(source?: ast.LinkProperty["$container"]): ProjectId<ProjectId> | undefined;
        parseLinks(source?: ast.LinkProperty["$container"]): ProjectId<ProjectId> | undefined;
        parseIconProperty(prop: ast.IconProperty | undefined): ProjectId | undefined;
        parseImageAlias(value: string): string | undefined;
        parseColorLiteral(astNode: ast.ColorLiteral): ProjectId | undefined;
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
            summary?: ProjectId;
            description?: ProjectId;
            technology?: string;
        };
    };
} & TBase;
