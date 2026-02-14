import type { LikeC4ProjectJsonConfig } from '@likec4/config';
import type { ComputedLikeC4ModelData } from '@likec4/core';
import { type LangiumDocument } from 'langium';
import type { LiteralUnion } from 'type-fest';
import { URI } from 'vscode-uri';
import type { LikeC4LangiumDocument } from '../ast';
export declare function createTestServices(options?: {
    workspace?: string;
    projectConfig?: Partial<LikeC4ProjectJsonConfig>;
}): {
    services: any;
    addDocument: (input: string, uri?: string) => Promise<LikeC4LangiumDocument>;
    removeDocument: (doc: LangiumDocument | URI) => Promise<void>;
    parse: (input: string, uri?: string) => Promise<LikeC4LangiumDocument>;
    validate: (input: string | LikeC4LangiumDocument, uri?: string) => Promise<{
        document: LikeC4LangiumDocument;
        diagnostics: any[];
        warnings: any[];
        errors: any[];
    }>;
    validateAll: () => Promise<{
        diagnostics: any;
        errors: any;
        warnings: any;
    }>;
    buildModel: () => Promise<ComputedLikeC4ModelData>;
    buildLikeC4Model: () => Promise<any>;
    resetState: () => Promise<void>;
    format: (input: string | LikeC4LangiumDocument, uri?: string) => Promise<any>;
};
/**
 * @example
 * ```ts
 * const { projects } = await createMultiProjectTestServices({
 *   project1: {
 *     doc1: `...`,
 *     doc2: `...`,
 *   },
 *   project2: {
 *     doc1: `...`,
 *   },
 * })
 * ```
 */
export declare function createMultiProjectTestServices<const Projects extends Record<string, Record<string, string>>>(data: Projects): Promise<{
    services: any;
    projects: { readonly [K in keyof Projects]: { readonly [L in keyof Projects[K]]: LikeC4LangiumDocument; }; };
    projectsManager: any;
    addDocument: (uri: string | URI, input: string) => Promise<LikeC4LangiumDocument>;
    /**
     * Add document outside of projects
     */
    addDocumentOutside: (input: string) => Promise<LikeC4LangiumDocument>;
    validateAll: () => Promise<{
        diagnostics: any;
        errors: any;
        warnings: any;
    }>;
    buildModel: (projectId: LiteralUnion<keyof Projects, string>) => Promise<ComputedLikeC4ModelData>;
    buildLikeC4Model: (projectId: LiteralUnion<keyof Projects, string>) => Promise<any>;
    resetState: () => Promise<void>;
}>;
export type TestServices = ReturnType<typeof createTestServices>;
export type TestParseFn = TestServices['validate'];
export type TestValidateFn = TestServices['validate'];
