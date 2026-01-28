import z from 'zod/v4'

// Relative path (no leading slash, drive letter, or protocol)
// eslint-disable-next-line no-useless-escape
const RELATIVE_PATH_REGEX = /^(?!\/|[A-Za-z]:[\\\/])(?!.*:\/\/).*$/

// Schema for an include path value: must be a non-empty string representing a relative path
const IncludePathValue = z
  .string()
  .min(1, 'Include path cannot be empty')
  .regex(
    RELATIVE_PATH_REGEX,
    'Include path must be a relative path (no leading slash, drive letter, or protocol)',
  )

export const IncludeSchema = z
  .strictObject({
    paths: z.array(IncludePathValue)
      .meta({
        description: [
          'Additional relative directory paths to include LikeC4 source files from, searched recursively.',
          'Paths are relative to the project folder (the folder containing this config file).',
          'Example: ["../shared", "../common/specs"]',
        ].join('\n'),
      }),
    maxDepth: z.number()
      .int()
      .min(1)
      .max(20)
      .default(3)
      .meta({
        description: [
          'Maximum directory depth to scan when searching for .c4 files in include paths.',
          'Prevents excessive scanning of deeply nested directories.',
          'Default: 3',
        ].join('\n'),
      }),
    fileThreshold: z.number()
      .int()
      .min(1)
      .max(10000)
      .default(30)
      .meta({
        description: [
          'Maximum number of files to load from include paths before warning.',
          'Helps identify performance issues from accidentally including large directories.',
          'Default: 30',
        ].join('\n'),
      }),
  })
  .meta({
    id: 'include-config',
    description: [
      'Configuration for including additional LikeC4 source files from other directories.',
      'Example: { "paths": ["../shared", "../common/specs"], "maxDepth": 5, "fileThreshold": 50 }',
    ].join('\n'),
  })

export type IncludeConfig = z.infer<typeof IncludeSchema>
