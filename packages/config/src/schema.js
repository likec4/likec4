import JSON5 from 'json5';
import z from 'zod/v4';
import { ImageAliasesSchema } from './schema.image-alias';
import { IncludeSchema } from './schema.include';
import { LikeC4StylesConfigSchema } from './schema.theme';
export const ManualLayoutsConfigSchema = z
    .strictObject({
    outDir: z.string()
        .default('.likec4')
        .meta({
        description: [
            'Path to the directory where manual layouts will be stored,',
            'relative to the folder containing the project config. ',
            '',
            'Defaults to \'.likec4\'.',
        ].join('\n'),
    }),
})
    .meta({
    id: 'ManualLayoutsConfig',
    description: 'Configuration for manual layouts',
});
export const LikeC4ProjectJsonConfigSchema = z.object({
    name: z.string()
        .nonempty('Project name cannot be empty')
        .refine((value) => value !== 'default', {
        abort: true,
        error: 'Project name cannot be "default"',
    })
        .refine((value) => !value.includes('.') && !value.includes('@') && !value.includes('#'), {
        abort: true,
        error: 'Project name cannot contain ".", "@" or "#", try to use A-z, 0-9, _ and -',
    })
        .meta({ description: 'Project name, must be unique in the workspace' }),
    extends: z.union([
        z.string().min(1, 'Extend path cannot be empty'),
        z.array(z.string().min(1, 'Extend path cannot be empty')).min(1, 'Extend list cannot be empty'),
    ])
        .optional()
        .meta({ description: 'Extend styles from other config files' }),
    title: z.string()
        .nonempty('Project title cannot be empty if specified')
        .optional()
        .meta({ description: 'A human readable title for the project' }),
    contactPerson: z.string()
        .nonempty('Contact person cannot be empty if specified')
        .optional()
        .meta({ description: 'A person who has been involved in creating or maintaining this project' }),
    styles: LikeC4StylesConfigSchema.optional().meta({
        description: 'Project styles customization',
    }),
    imageAliases: ImageAliasesSchema.optional(),
    include: IncludeSchema.optional(),
    exclude: z.array(z.string())
        .optional()
        .meta({ description: 'List of file patterns to exclude from the project, default is ["**/node_modules/**"]' }),
    manualLayouts: ManualLayoutsConfigSchema.optional(),
})
    .meta({
    id: 'LikeC4ProjectConfig',
    description: 'LikeC4 Project Configuration',
});
const FunctionType = z.instanceof(Function);
export const GeneratorsSchema = z.record(z.string(), FunctionType);
export const LikeC4ProjectConfigSchema = LikeC4ProjectJsonConfigSchema.extend({
    generators: GeneratorsSchema.optional(),
});
/**
 * Validates Object into a LikeC4ProjectConfig object.
 */
export function validateProjectConfig(config) {
    const parsed = LikeC4ProjectConfigSchema.safeParse(config);
    if (parsed.success) {
        return parsed.data;
    }
    throw new Error('Config validation failed:\n' + z.prettifyError(parsed.error));
}
/**
 * Parses JSON string into a LikeC4ProjectConfig object.
 * Does not process "extends" - use `loadConfig` function instead
 */
export function parseProjectConfigJSON(config) {
    const parsed = JSON5.parse(config.trim() || '{}');
    return validateProjectConfig(parsed);
}
export const LikeC4ProjectConfigOps = {
    parse: parseProjectConfigJSON,
    validate: validateProjectConfig,
    normalizeInclude: (include) => {
        const parsed = IncludeSchema.safeParse(include);
        if (parsed.success) {
            return parsed.data;
        }
        return {
            paths: [],
            maxDepth: 3,
            fileThreshold: 30,
        };
    },
};
