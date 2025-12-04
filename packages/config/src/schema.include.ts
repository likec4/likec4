import * as z from 'zod'

// Relative path (no leading slash, drive letter, or protocol)
// eslint-disable-next-line no-useless-escape
const RELATIVE_PATH_REGEX = /^(?!\/|[A-Za-z]:[\\\/])(?!.*:\/\/).*$/

// Schema for an include path value: must be a non-empty string representing a relative path
const IncludePathValue = z
  .string()
  .nonempty('Include path cannot be empty')
  .regex(
    RELATIVE_PATH_REGEX,
    'Include path must be a relative path (no leading slash, drive letter, or protocol)',
  )

export const IncludeSchema = z.array(IncludePathValue)
  .optional()
  .meta({
    description: [
      'Additional relative directory paths to include LikeC4 source files from, searched recursively.',
      'Paths are relative to the project folder (the folder containing this config file).',
      'Example: ["../shared", "../common/specs"]',
    ].join('\n'),
  })

type LikeC4IncludeConfig = z.infer<typeof IncludeSchema>

export function validateIncludePaths(include?: LikeC4IncludeConfig) {
  const invalidPaths: string[] = []

  if (include) {
    for (const path of include) {
      if (!RELATIVE_PATH_REGEX.test(path)) {
        invalidPaths.push(path)
      }
    }
  }

  if (invalidPaths.length) {
    throw new Error(
      `Invalid include path(s): ${
        invalidPaths
          .map((p) => JSON.stringify(p))
          .join(', ')
      } (must be relative paths without leading slash, drive letter, or protocol)`,
    )
  }
}
