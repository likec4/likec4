import z from 'zod/v4'
import { RELATIVE_PATH_REGEX } from './schema.include'

/**
 * Creates a schema for a name that follows the project name rules:
 * non-empty, not "default", and without ".", "@" or "#".
 *
 * Shared by the project `name` and the keys of the `dependencies` section,
 * because a dependency name is used as a project name in the consumer model.
 *
 * @param subject - Subject used in error messages, e.g. "Project name"
 */
export function projectNameSchema(subject: string): z.ZodString {
  return z.string()
    .nonempty(`${subject} cannot be empty`)
    .refine((value) => value !== 'default', {
      abort: true,
      error: `${subject} cannot be "default"`,
    })
    .refine((value) => !value.includes('.') && !value.includes('@') && !value.includes('#'), {
      abort: true,
      error: `${subject} cannot contain ".", "@" or "#", try to use A-z, 0-9, _ and -`,
    })
}

/**
 * Trims whitespace and converts backslashes to forward slashes.
 * Applied before validation, so that "\\server\share" and "C:\path" are rejected as absolute.
 */
function normalizeSeparators(path: string): string {
  return path.trim().replaceAll('\\', '/')
}

/**
 * Collapses repeated slashes and removes trailing slashes.
 * Applied after validation, so that "://" is still detected.
 */
function collapseSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1')
}

// Rejects any drive letter prefix, including drive-relative Windows paths ("C:foo", "C:"),
// which RELATIVE_PATH_REGEX accepts
const NO_DRIVE_LETTER_REGEX = /^(?![A-Za-z]:)/

const RELATIVE_PATH_ERROR =
  'Dependency path must be a relative path string (no leading slash, drive letter, or protocol)'

const DependencyPathSchema = z
  .string({ error: 'Dependency path must be a relative path string' })
  .overwrite(normalizeSeparators)
  .min(1, 'Dependency path cannot be empty')
  .regex(RELATIVE_PATH_REGEX, RELATIVE_PATH_ERROR)
  .regex(NO_DRIVE_LETTER_REGEX, RELATIVE_PATH_ERROR)
  .overwrite(collapseSlashes)
  .meta({
    description: [
      'Path to the folder of the dependency project (the folder with its LikeC4 config),',
      'relative to the folder containing this config file.',
      'Example: "../shared-model"',
    ].join('\n'),
  })

const DependencyNameSchema = projectNameSchema('Dependency name')

/**
 * Schema of the `dependencies` section of the project config.
 * Maps the import name to a relative path of the dependency project.
 * Paths are normalized: trimmed, with forward slashes, without repeated or trailing slashes.
 */
export const DependenciesSchema = z
  // Keys are validated in superRefine: errors of a key schema are reported by zod
  // as a generic "Invalid key in record", without the actual reason.
  .record(z.string(), DependencyPathSchema)
  .superRefine((dependencies, ctx) => {
    for (const name of Object.keys(dependencies)) {
      const parsed = DependencyNameSchema.safeParse(name)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: [name],
            input: name,
          })
        }
      }
    }
  })
  .meta({
    id: 'DependenciesConfig',
    description: [
      'Projects this project depends on.',
      'Maps the import name (used in `import ... from \'name\'`) to the path of the dependency project,',
      'relative to the folder containing this config file.',
      'Import names follow the project name rules: they cannot be "default" or contain ".", "@" or "#".',
      'Example: { "shared": "../shared-model" }',
    ].join('\n'),
  })

/**
 * Path to the folder of a dependency project (the folder with its LikeC4 config),
 * relative to the folder of the consumer project (no leading slash, drive letter, or protocol).
 *
 * @example '../shared-model'
 */
export type DependencyPath = z.infer<typeof DependencyPathSchema>

/**
 * The `dependencies` section of the project config.
 * Maps the import name (used in `import ... from 'name'`) to the dependency location.
 *
 * The import name follows the project name rules: it cannot contain ".", "@" or "#".
 *
 * @example
 * ```json
 * {
 *   "name": "my-project",
 *   "dependencies": {
 *     "shared": "../shared-model"
 *   }
 * }
 * ```
 */
export type DependenciesConfig = Record<string, DependencyPath>

/**
 * Normalizes the `dependencies` section: validates it and normalizes paths.
 * Returns an empty object if the section is missing or invalid.
 */
export function normalizeDependencies(
  dependencies: z.input<typeof DependenciesSchema> | undefined,
): DependenciesConfig {
  const parsed = DependenciesSchema.safeParse(dependencies ?? {})
  return parsed.success ? parsed.data : {}
}

/**
 * Git source of a dependency: a folder of a git repository at a git ref.
 *
 * Only the type: the `dependencies` section does not accept git sources yet
 * (validation of git entries is added separately).
 *
 * @example
 * ```json
 * {
 *   "dependencies": {
 *     "billing": { "git": "git@github.com:my-org/billing.git", "ref": "v1.2.0", "path": "architecture" }
 *   }
 * }
 * ```
 */
export interface GitDependencySource {
  /**
   * URL of the git repository: `https://`, `ssh://` or scp-like `git@host:org/repo.git`
   * (see `parseGitRepositoryUrl`)
   */
  git: string
  /**
   * Git ref: a branch, a tag or a commit SHA.
   * Resolved to a commit SHA on install, the SHA is remembered until update.
   */
  ref: string
  /**
   * Subdirectory of the repository with the dependency project (the folder with its LikeC4 config),
   * relative to the repository root. The repository root if omitted.
   */
  path?: string | undefined
}

/**
 * Entry of the `dependencies` section: a relative path of a local dependency, or a git source.
 */
export type DependencyEntry = DependencyPath | GitDependencySource

/**
 * Checks if the dependency entry is a git source.
 */
export function isGitDependencySource(entry: unknown): entry is GitDependencySource {
  return typeof entry === 'object'
    && entry !== null
    && 'git' in entry
    && typeof entry.git === 'string'
    && 'ref' in entry
    && typeof entry.ref === 'string'
}
