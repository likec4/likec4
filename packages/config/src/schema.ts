// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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
import z from 'zod/v4'
import { ImageAliasesSchema } from './schema.image-alias'
import { type IncludeConfig, IncludeSchema } from './schema.include'
import { LikeC4StylesConfigSchema } from './schema.theme'

export interface VscodeURI {
  readonly scheme: string
  readonly authority: string
  readonly path: string
  readonly fsPath: string
  readonly query: string
  readonly fragment: string
  toString(): string
}

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
  })

export type ManualLayoutsConfig = z.infer<typeof ManualLayoutsConfigSchema>

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
  metadata: z.record(z.string(), z.any())
    .optional()
    .meta({ description: 'Arbitrary metadata as key-value pairs for custom project information' }),
  styles: LikeC4StylesConfigSchema.optional().meta({
    description: 'Project styles customization',
  }),
  imageAliases: ImageAliasesSchema.optional(),
  include: IncludeSchema.optional(),
  exclude: z.array(z.string())
    .optional()
    .meta({ description: 'List of file patterns to exclude from the project, default is ["**/node_modules/**"]' }),
  manualLayouts: ManualLayoutsConfigSchema.optional(),
  inferTechnologyFromIcon: z.boolean()
    .optional()
    .meta({
      description: [
        'Automatically derive element technology from icon name when technology is not set explicitly.',
        'Applies to aws:, azure:, gcp:, and tech: icons. Bootstrap icons are excluded.',
        'Defaults to true.',
      ].join('\n'),
    }),
})
  .meta({
    id: 'LikeC4ProjectConfig',
    description: 'LikeC4 Project Configuration',
  })

export type LikeC4ProjectJsonConfig = z.input<typeof LikeC4ProjectJsonConfigSchema>

const FunctionType = z.instanceof(Function)
export const GeneratorsSchema = z.record(z.string(), FunctionType)
export const LikeC4ProjectConfigSchema = LikeC4ProjectJsonConfigSchema.extend({
  generators: GeneratorsSchema.optional(),
})

/**
 * Result of the {@link GeneratorFnContext.locate} function
 */
export type LocateResult = {
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
  document: VscodeURI
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

export interface GeneratorFnContext {
  /**
   * Workspace root directory
   */
  readonly workspace: VscodeURI

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
    readonly folder: VscodeURI
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
  ): LocateResult

  /**
   * Write a file
   * @param path - Path to the file, either absolute or relative to the project folder
   *               All folders will be created automatically
   * @param content - Content of the file
   */
  write(file: {
    path: string | string[] | VscodeURI
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
  generators?: Record<string, GeneratorFn> | undefined
}

export type LikeC4ProjectConfigInput = LikeC4ProjectJsonConfig & {
  generators?: Record<string, GeneratorFn> | undefined
}

/**
 * Validates Object into a LikeC4ProjectConfig object.
 */
export function validateProjectConfig<C extends Record<string, unknown>>(config: C): LikeC4ProjectConfig {
  const parsed = LikeC4ProjectConfigSchema.safeParse(config)
  if (parsed.success) {
    return parsed.data as unknown as LikeC4ProjectConfig
  }
  throw new Error('Config validation failed:\n' + z.prettifyError(parsed.error))
}

/**
 * Parses JSON string into a LikeC4ProjectConfig object.
 * Does not process "extends" - use `loadConfig` function instead
 */
export function parseProjectConfigJSON(config: string): LikeC4ProjectConfig {
  const parsed = JSON5.parse(config.trim() || '{}')
  return validateProjectConfig(parsed)
}

export const LikeC4ProjectConfigOps = {
  parse: parseProjectConfigJSON,
  validate: validateProjectConfig,
  normalizeInclude: (include: z.input<typeof IncludeSchema> | undefined): IncludeConfig => {
    const parsed = IncludeSchema.safeParse(include)
    if (parsed.success) {
      return parsed.data
    }
    return {
      paths: [],
      maxDepth: 3,
      fileThreshold: 30,
    }
  },
}
