import z from 'zod/v4'
import { parseGitRepositoryUrl } from './git-url'
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

const GIT_URL_ERROR = 'Git dependency URL must use https://, ssh:// or git@host:org/repo.git'

const GitUrlSchema = z
  .string({
    error: (issue) => issue.input === undefined ? 'Git dependency URL is required' : GIT_URL_ERROR,
  })
  .trim()
  .refine((value) => value.length > 0, {
    abort: true,
    error: 'Git dependency URL cannot be empty',
  })
  .refine((value) => parseGitRepositoryUrl(value) !== undefined, {
    error: GIT_URL_ERROR,
  })
  .meta({
    description: [
      'URL of the git repository.',
      'Allowed forms: https://host/org/repo.git, ssh://[user@]host[:port]/org/repo.git, git@host:org/repo.git',
    ].join('\n'),
  })

// eslint-disable-next-line no-control-regex
const INVALID_REF_REGEX = /^-|[\s\x00-\x1f\x7f]/

const GitRefSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Git dependency ref is required' : 'Git dependency ref must be a string',
  })
  .trim()
  .refine((value) => value.length > 0, {
    abort: true,
    error: 'Git dependency ref cannot be empty',
  })
  .refine((value) => !INVALID_REF_REGEX.test(value), {
    error: 'Git dependency ref must be a branch, a tag or a commit SHA (no whitespace, cannot start with "-")',
  })
  .meta({
    description: 'Git ref: a branch, a tag or a commit SHA',
  })

const GIT_PATH_ERROR =
  'Git dependency path must be a relative path inside the repository (no leading slash, drive letter, or protocol)'

const GitPathSchema = z
  .string({ error: GIT_PATH_ERROR })
  .overwrite(normalizeSeparators)
  .refine((value) => value.length > 0, {
    abort: true,
    error: 'Git dependency path cannot be empty, omit it for the repository root',
  })
  .regex(RELATIVE_PATH_REGEX, GIT_PATH_ERROR)
  .regex(NO_DRIVE_LETTER_REGEX, GIT_PATH_ERROR)
  .refine((value) => !value.split('/').includes('..'), {
    error: 'Git dependency path must stay inside the repository (no ".." segments)',
  })
  .overwrite(collapseSlashes)
  .meta({
    description: [
      'Folder of the dependency project (the folder with its LikeC4 config) in the repository,',
      'relative to the repository root. The repository root if omitted.',
      'Example: "architecture"',
    ].join('\n'),
  })

const GitDependencySourceSchema = z
  .strictObject({
    git: GitUrlSchema,
    ref: GitRefSchema,
    path: GitPathSchema.optional(),
  })
  .meta({
    id: 'GitDependencySource',
    description: [
      'Dependency project from a git repository.',
      'Example: { "git": "git@github.com:my-org/billing.git", "ref": "v1.2.0", "path": "architecture" }',
    ].join('\n'),
  })

const DEPENDENCY_ENTRY_ERROR =
  'Dependency path must be a relative path string, or a git source object { "git": "...", "ref": "...", "path": "..." }'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const DependencyEntrySchema = z.union([DependencyPathSchema, GitDependencySourceSchema], {
  // Reported when no option matches the type of the input (e.g. a number),
  // or the object has a missing or mistyped field (then the union cannot pick the option itself).
  error: (issue) => {
    if (issue.code !== 'invalid_union' || !isPlainObject(issue.input)) {
      return DEPENDENCY_ENTRY_ERROR
    }
    const gitIssues = issue.errors[1] ?? []
    if (gitIssues.length === 0) {
      return DEPENDENCY_ENTRY_ERROR
    }
    return gitIssues
      .map((nested) => nested.path.length > 0 ? `${nested.path.join('.')}: ${nested.message}` : nested.message)
      .join('; ')
  },
})

const DependencyNameSchema = projectNameSchema('Dependency name')

/**
 * Schema of the `dependencies` section of the project config.
 * Maps the import name to a relative path of the dependency project, or to a git source.
 * Paths are normalized: trimmed, with forward slashes, without repeated or trailing slashes.
 */
export const DependenciesSchema = z
  // Keys are validated in superRefine: errors of a key schema are reported by zod
  // as a generic "Invalid key in record", without the actual reason.
  .record(z.string(), DependencyEntrySchema)
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
      'Maps the import name (used in `import ... from \'name\'`) to the dependency project:',
      '- a path to the folder of the project, relative to the folder containing this config file',
      '- a git source { git, ref, path }: a repository URL (https://, ssh:// or git@host:org/repo.git),',
      '  a ref (branch, tag or commit SHA) and an optional folder in the repository',
      'Import names follow the project name rules: they cannot be "default" or contain ".", "@" or "#".',
      'Example: { "shared": "../shared-model", "billing": { "git": "git@github.com:my-org/billing.git", "ref": "v1.2.0" } }',
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
 * Maps the import name (used in `import ... from 'name'`) to the dependency location:
 * a relative path ({@link DependencyPath}) or a git source ({@link GitDependencySource}).
 *
 * The import name follows the project name rules: it cannot contain ".", "@" or "#".
 *
 * @example
 * ```json
 * {
 *   "name": "my-project",
 *   "dependencies": {
 *     "shared": "../shared-model",
 *     "billing": { "git": "git@github.com:my-org/billing.git", "ref": "v1.2.0" }
 *   }
 * }
 * ```
 */
export type DependenciesConfig = Record<string, DependencyEntry>

/**
 * Normalizes the `dependencies` section: validates it and normalizes paths
 * (relative paths of local dependencies and `path` of git sources).
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
 * Validated by the `dependencies` section schema: the URL must be accepted by `parseGitRepositoryUrl`,
 * the ref is required, the path is relative and stays inside the repository. Unknown fields are rejected.
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
