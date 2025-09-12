import type {
  DeploymentElementModel,
  DeploymentRelationModel,
  ElementModel,
  LikeC4Model,
  LikeC4ViewModel,
  RelationshipModel,
} from '@likec4/core/model'
import type {
  aux,
  ProjectId,
} from '@likec4/core/types'
import JSON5 from 'json5'
import type { URI } from 'vscode-uri'
import * as z from 'zod4'
import { ImageAliasesSchema, validateImageAliases } from './schema.image-alias'

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
    .transform((value) => value as ProjectId)
    .meta({ description: 'Project name, must be unique in the workspace' }),
  title: z.string()
    .nonempty('Project title cannot be empty if specified')
    .optional()
    .meta({ description: 'A human readable title for the project' }),
  contactPerson: z.string()
    .nonempty('Contact person cannot be empty if specified')
    .optional()
    .meta({ description: 'A person who has been involved in creating or maintaining this project' }),
  imageAliases: ImageAliasesSchema
    .optional(),
  exclude: z.array(z.string())
    .optional()
    .meta({ description: 'List of file patterns to exclude from the project, default is ["**/node_modules/**"]' }),
})
  .meta({
    description: 'LikeC4 project configuration',
  })

export type LikeC4ProjectJsonConfig = z.input<typeof LikeC4ProjectJsonConfigSchema>

const FunctionType = z.instanceof(Function)
export const GeneratorsSchema = z.record(z.string(), FunctionType)
export const LikeC4ProjectConfigSchema = LikeC4ProjectJsonConfigSchema.extend({
  generators: GeneratorsSchema.optional(),
})

export interface GeneratorFnContext {
  /**
   * Workspace root directory
   */
  readonly workspace: URI

  /**
   * Current project
   */
  readonly project: {
    /**
     * Project name
     */
    readonly id: ProjectId

    readonly title?: string

    /**
     * Project folder
     */
    readonly folder: URI
  }

  /**
   * Returns the location of the specified element, relation, view or deployment element
   */
  locate(
    target:
      | ElementModel
      | RelationshipModel
      | DeploymentRelationModel
      | LikeC4ViewModel
      | DeploymentElementModel,
  ): {
    /**
     * Range inside the source file
     */
    range: {
      start: {
        line: number
        character: number
      }
      end: {
        line: number
        character: number
      }
    }
    /**
     * Full path to the source file
     */
    document: URI
    /**
     * Document path relative to the project folder
     */
    relativePath: string
    /**
     * Folder, containing the source file ("dirname" of document)
     */
    folder: string
    /**
     * Source file name ("basename" of document)
     */
    filename: string
  }

  /**
   * Write a file
   * @param path - Path to the file, either absolute or relative to the project folder
   *               All folders will be created automatically
   * @param content - Content of the file
   */
  write(file: {
    path: string | string[] | URI
    content:
      | string
      | NodeJS.ArrayBufferView
      | Iterable<string | NodeJS.ArrayBufferView>
      | AsyncIterable<string | NodeJS.ArrayBufferView>
      | NodeJS.ReadableStream
  }): Promise<void>

  /**
   * Abort the process
   */
  abort(reason?: string): never
}

export type GeneratorFnParams = {
  /**
   * LikeC4 model
   */
  likec4model: LikeC4Model<aux.UnknownLayouted>

  /**
   * Generator context
   */
  ctx: GeneratorFnContext
}

export interface GeneratorFn {
  (params: GeneratorFnParams): Promise<void> | void
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
export type LikeC4ProjectConfig = z.input<typeof LikeC4ProjectJsonConfigSchema> & {
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
  generators?: Record<string, GeneratorFn> | undefined
}

/**
 * Validates JSON string or JSON object into a LikeC4ProjectConfig object.
 */
export function validateProjectConfig<C extends string | Record<string, unknown>>(
  config: C,
): LikeC4ProjectConfig {
  const parsed = LikeC4ProjectConfigSchema.safeParse(
    typeof config === 'string' ? JSON5.parse(config) : config,
  )
  if (!parsed.success) {
    throw new Error('Config validation failed:\n' + z.prettifyError(parsed.error))
  }
  // TODO: rewrite with zod refine
  if (parsed.data.imageAliases) {
    validateImageAliases(parsed.data.imageAliases)
  }
  return parsed.data as unknown as LikeC4ProjectConfig
}

/**
 * Converts a LikeC4ProjectConfig object into a LikeC4ProjectJsonConfig object.
 * Omit generators property (as it is not serializable)
 */
export function serializableLikeC4ProjectConfig(
  { generators, ...config }: LikeC4ProjectConfig,
): LikeC4ProjectJsonConfig {
  return LikeC4ProjectJsonConfigSchema.parse(config) as unknown as LikeC4ProjectJsonConfig
}
