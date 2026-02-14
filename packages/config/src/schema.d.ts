import type { DeploymentElementModel, DeploymentRelationModel, ElementModel, LikeC4Model, LikeC4ViewModel, RelationshipModel } from '@likec4/core/model';
import type { aux, ProjectId } from '@likec4/core/types';
import z from 'zod/v4';
import { type IncludeConfig, IncludeSchema } from './schema.include';
export interface VscodeURI {
    readonly scheme: string;
    readonly authority: string;
    readonly path: string;
    readonly fsPath: string;
    readonly query: string;
    readonly fragment: string;
    toString(): string;
}
export declare const ManualLayoutsConfigSchema: any;
export type ManualLayoutsConfig = z.infer<typeof ManualLayoutsConfigSchema>;
export declare const LikeC4ProjectJsonConfigSchema: any;
export type LikeC4ProjectJsonConfig = z.input<typeof LikeC4ProjectJsonConfigSchema>;
export declare const GeneratorsSchema: any;
export declare const LikeC4ProjectConfigSchema: any;
/**
 * Result of the {@link GeneratorFnContext.locate} function
 */
export type LocateResult = {
    /**
     * Range inside the source file
     */
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    /**
     * Full path to the source file
     */
    document: VscodeURI;
    /**
     * Document path relative to the project folder
     */
    relativePath: string;
    /**
     * Folder, containing the source file ("dirname" of document)
     */
    folder: string;
    /**
     * Source file name ("basename" of document)
     */
    filename: string;
};
export interface GeneratorFnContext {
    /**
     * Workspace root directory
     */
    readonly workspace: VscodeURI;
    /**
     * Current project
     */
    readonly project: {
        /**
         * Project name
         */
        readonly id: ProjectId;
        readonly title?: string;
        /**
         * Project folder
         */
        readonly folder: VscodeURI;
    };
    /**
     * Returns the location of the specified element, relation, view or deployment element
     */
    locate(target: ElementModel | RelationshipModel | DeploymentRelationModel | LikeC4ViewModel | DeploymentElementModel): LocateResult;
    /**
     * Write a file
     * @param path - Path to the file, either absolute or relative to the project folder
     *               All folders will be created automatically
     * @param content - Content of the file
     */
    write(file: {
        path: string | string[] | VscodeURI;
        content: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | NodeJS.ReadableStream;
    }): Promise<void>;
    /**
     * Abort the process
     */
    abort(reason?: string): never;
}
export type GeneratorFnParams = {
    /**
     * LikeC4 model
     */
    likec4model: LikeC4Model<aux.UnknownLayouted>;
    /**
     * Generator context
     */
    ctx: GeneratorFnContext;
};
export interface GeneratorFn {
    (params: GeneratorFnParams): Promise<void> | void;
}
/**
 * LikeC4 project configuration
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   name: 'my-project',
 *   generators: {
 *     'my-generator': async ({ likec4model, ctx }) => {
 *       await ctx.write('my-generator.txt', likec4model.project.id)
 *     }
 *   }
 * })
 * ```
 */
export type LikeC4ProjectConfig = z.infer<typeof LikeC4ProjectJsonConfigSchema> & {
    /**
     * Add custom generators to the project
     * @example
     * ```ts
     * export default defineConfig({
     *   name: 'my-project',
     *   generators: {
     *     'my-generator': async ({ likec4model, ctx }) => {
     *       await ctx.write('my-generator.txt', likec4model.project.id)
     *     }
     *   }
     * })
     * ```
     *
     * Execute generator:
     * ```bash
     * likec4 gen my-generator
     * ```
     */
    generators?: Record<string, GeneratorFn> | undefined;
};
export type LikeC4ProjectConfigInput = LikeC4ProjectJsonConfig & {
    generators?: Record<string, GeneratorFn> | undefined;
};
/**
 * Validates Object into a LikeC4ProjectConfig object.
 */
export declare function validateProjectConfig<C extends Record<string, unknown>>(config: C): LikeC4ProjectConfig;
/**
 * Parses JSON string into a LikeC4ProjectConfig object.
 * Does not process "extends" - use `loadConfig` function instead
 */
export declare function parseProjectConfigJSON(config: string): LikeC4ProjectConfig;
export declare const LikeC4ProjectConfigOps: {
    parse: typeof parseProjectConfigJSON;
    validate: typeof validateProjectConfig;
    normalizeInclude: (include: z.input<typeof IncludeSchema> | undefined) => IncludeConfig;
};
