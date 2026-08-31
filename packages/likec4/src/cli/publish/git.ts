import spawn from 'nano-spawn'

/**
 * Runs `git` with the given arguments and resolves with the trimmed stdout.
 * Rejects when git exits with a non-zero code (or is not installed at all).
 */
export type GitRunner = (args: readonly string[]) => Promise<string>

/**
 * The slice of `nano-spawn` that {@link createGitRunner} needs.
 *
 * Injecting it keeps the process boundary testable without mocking the module registry,
 * which is unreliable once vitest shares one module graph across the whole suite.
 */
export type SpawnProcess = (
  command: string,
  args: readonly string[],
  options: { cwd: string },
) => Promise<{ stdout: string }>

/**
 * Creates a {@link GitRunner} bound to `cwd`.
 * This is the only part of this module that touches the outside world.
 *
 * @param spawnProcess process spawner, defaults to `nano-spawn`
 */
export function createGitRunner(cwd: string, spawnProcess: SpawnProcess = spawn): GitRunner {
  return async (args: readonly string[]): Promise<string> => {
    const { stdout } = await spawnProcess('git', args, { cwd })
    return stdout.trim()
  }
}

/**
 * Trims a possibly-undefined value and returns `null` when it is empty.
 *
 * GitHub Actions sets unrelated variables to an empty string (e.g. `GITHUB_HEAD_REF`
 * outside of pull requests), so emptiness has to be treated as "absent".
 */
function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** `scheme://…` */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
/** `[user@]host:path` (scp-like syntax, e.g. `git@github.com:owner/repo.git`) */
const SCP_LIKE = /^(?:[^@/]+@)?([^@/:]+):(.+)$/

/** Path segments that are never a valid repository owner or name. */
const INVALID_SEGMENTS = new Set(['.', '..'])

/**
 * Normalizes a git remote url to `owner/repo`.
 *
 * Supports scp-like (`git@github.com:owner/repo.git`), `https://`, `ssh://` and `git://`
 * forms, strips embedded credentials and the trailing `.git`.
 *
 * Returns `null` when the url does not resolve to **exactly two** path segments
 * (e.g. GitLab subgroups), so the caller can ask for an explicit `--origin`.
 */
export function parseGitOrigin(url: string): string | null {
  const trimmed = url.trim()
  if (trimmed === '') {
    return null
  }

  let pathname: string
  switch (true) {
    case HAS_SCHEME.test(trimmed): {
      try {
        // credentials live in `username`/`password`, they never leak into `pathname`
        pathname = new URL(trimmed).pathname
      } catch {
        return null
      }
      break
    }
    default: {
      const scp = SCP_LIKE.exec(trimmed)
      if (!scp) {
        return null
      }
      pathname = scp[2] ?? ''
    }
  }

  const segments = pathname.split('/').filter(segment => segment !== '')
  if (segments.length !== 2) {
    return null
  }
  const owner = segments[0]!
  const repo = segments[1]!.replace(/\.git$/, '')
  if (repo === '' || INVALID_SEGMENTS.has(owner) || INVALID_SEGMENTS.has(repo)) {
    return null
  }
  return `${owner}/${repo}`
}

/** Author identity and subject of a single commit, as sent to LikeC4 Cloud. */
export type GitCommit = {
  message: string
  author: string
  email: string
  date: string
}

/** `git log -1` format used by {@link parseCommit} — NUL-separated, author identity, subject only. */
export const COMMIT_FORMAT = '%an%x00%ae%x00%aI%x00%s'

/**
 * Parses the NUL-separated output of `git log -1 --format=%an%x00%ae%x00%aI%x00%s`.
 *
 * NUL is used as separator because it is the one byte a commit subject cannot contain,
 * so newlines, tabs or pipes in the subject cannot corrupt parsing.
 *
 * The date is normalized to UTC (`…Z`): git's `%aI` emits offsets like `+02:00`, which
 * the server's `z.iso.datetime()` rejects.
 *
 * @throws when the output has fewer than four fields or an unparsable date
 */
export function parseCommit(raw: string): GitCommit {
  const parts = raw.replace(/\r?\n+$/, '').split('\0')
  if (parts.length < 4) {
    throw new Error(`Unexpected "git log" output: ${JSON.stringify(raw)}`)
  }
  const author = parts[0]!
  const email = parts[1]!
  const rawDate = parts[2]!
  // the subject is last, so join the rest back (defensive, a subject cannot contain NUL)
  const message = parts.slice(3).join('\0')

  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Unexpected commit date from git: ${JSON.stringify(rawDate)}`)
  }

  return {
    message,
    author,
    email,
    date: date.toISOString(),
  }
}

/**
 * Resolves the branch from CI environment, falling back to the git value.
 *
 * GitHub Actions rules: `GITHUB_HEAD_REF` (set on pull requests) wins, then
 * `GITHUB_REF_NAME` when `GITHUB_REF_TYPE` is `branch`.
 */
export function resolveBranch(env: Record<string, string | undefined>, gitBranch: string | null): string | null {
  const headRef = nonEmpty(env['GITHUB_HEAD_REF'])
  if (headRef !== null) {
    return headRef
  }
  if (env['GITHUB_REF_TYPE'] === 'branch') {
    const refName = nonEmpty(env['GITHUB_REF_NAME'])
    if (refName !== null) {
      return refName
    }
  }
  return nonEmpty(gitBranch)
}

/**
 * Resolves the tag from CI environment, falling back to the git value.
 *
 * GitHub Actions rule: `GITHUB_REF_NAME` when `GITHUB_REF_TYPE` is `tag`.
 */
export function resolveTag(env: Record<string, string | undefined>, gitTag: string | null): string | null {
  if (env['GITHUB_REF_TYPE'] === 'tag') {
    const refName = nonEmpty(env['GITHUB_REF_NAME'])
    if (refName !== null) {
      return refName
    }
  }
  return nonEmpty(gitTag)
}

/** Everything the publish payload needs to know about the current checkout. */
export type GitProvenance = {
  /** `owner/repo` */
  origin: string
  sha: string
  branch: string | null
  tag: string | null
  commit: GitCommit
  /**
   * Absolute path of the repository root (`git rev-parse --show-toplevel`).
   *
   * Empty string when git is unavailable and the manual escape hatch
   * (`--origin` + `--sha`) was used — callers must then fall back to the workspace path.
   */
  root: string
  /**
   * `true` when `git status --porcelain` reports uncommitted changes, `false` when the
   * working tree is clean.
   *
   * `null` means **undetermined** — `git status` could not be read (or git was not
   * available at all, see the `--origin` + `--sha` escape hatch). It must not be treated
   * as "clean": callers should warn that the state of the working tree is unknown.
   */
  dirty: boolean | null
}

/** Explicit CLI flags, each taking precedence over environment and git. */
export type GitOverrides = {
  origin?: string | undefined
  sha?: string | undefined
  branch?: string | undefined
  tag?: string | undefined
}

export type ReadGitProvenanceParams = {
  runner: GitRunner
  env: Record<string, string | undefined>
  overrides?: GitOverrides | undefined
}

const NO_GIT_HINT = 'Run "likec4 publish" inside a git repository, or pass both --origin and --sha explicitly.'

/** Runs git and returns `null` instead of rejecting — for values that may legitimately be absent. */
async function softRun(runner: GitRunner, args: readonly string[]): Promise<string | null> {
  try {
    return nonEmpty(await runner(args))
  } catch {
    return null
  }
}

/**
 * Collects git provenance for the publish payload.
 *
 * Precedence for every field is **flag → CI environment → git → `null`**.
 *
 * A detached HEAD (`symbolic-ref` fails), a missing tag or an unreadable status are soft
 * failures. A missing git binary / non-repository is an error, unless both `overrides.origin`
 * and `overrides.sha` are given. Missing `origin` remote without `--origin` is always an error —
 * the origin is a safety interlock and must never be guessed.
 */
export async function readGitProvenance(
  { runner, env, overrides = {} }: ReadGitProvenanceParams,
): Promise<GitProvenance> {
  const originOverride = nonEmpty(overrides.origin)
  const shaOverride = nonEmpty(overrides.sha)
  const hasEscapeHatch = originOverride !== null && shaOverride !== null

  let root: string | null = null
  try {
    root = nonEmpty(await runner(['rev-parse', '--show-toplevel']))
  } catch (error) {
    if (!hasEscapeHatch) {
      throw new Error(`Failed to read git repository. ${NO_GIT_HINT}`, { cause: error })
    }
  }

  if (root === null) {
    if (!hasEscapeHatch) {
      throw new Error(`Failed to resolve the git repository root. ${NO_GIT_HINT}`)
    }
    return {
      origin: originOverride,
      sha: shaOverride,
      branch: nonEmpty(overrides.branch) ?? resolveBranch(env, null),
      tag: nonEmpty(overrides.tag) ?? resolveTag(env, null),
      commit: unknownCommit(),
      root: '',
      // there is no repository to inspect, so the working tree state is undetermined
      dirty: null,
    }
  }

  const origin = originOverride ?? await readOrigin(runner)
  const sha = shaOverride ?? await readSha(runner)
  const commit = await readCommit(runner, shaOverride !== null)

  // detached HEAD makes `symbolic-ref` exit non-zero, hence a soft failure
  const gitBranch = await softRun(runner, ['symbolic-ref', '--short', '-q', 'HEAD'])
  const branch = nonEmpty(overrides.branch) ?? resolveBranch(env, gitBranch)

  const gitTag = firstLine(await softRun(runner, ['tag', '--points-at', 'HEAD']))
  const tag = nonEmpty(overrides.tag) ?? resolveTag(env, gitTag)

  const dirty = await readDirty(runner)

  return { origin, sha, branch, tag, commit, root, dirty }
}

function firstLine(value: string | null): string | null {
  if (value === null) {
    return null
  }
  return nonEmpty(value.split('\n')[0])
}

/** Placeholder commit for the `--origin` + `--sha` escape hatch, where git cannot be queried. */
function unknownCommit(): GitCommit {
  return {
    message: '',
    author: '',
    email: '',
    date: new Date().toISOString(),
  }
}

async function readOrigin(runner: GitRunner): Promise<string> {
  let url: string
  try {
    url = await runner(['remote', 'get-url', 'origin'])
  } catch (error) {
    throw new Error(
      'No "origin" remote found in this repository. Pass --origin "owner/repo" explicitly.',
      { cause: error },
    )
  }
  const origin = parseGitOrigin(url)
  if (origin === null) {
    throw new Error(
      `Cannot derive "owner/repo" from the origin remote "${url}". Pass --origin "owner/repo" explicitly.`,
    )
  }
  return origin
}

async function readSha(runner: GitRunner): Promise<string> {
  let sha: string | null
  try {
    sha = nonEmpty(await runner(['rev-parse', 'HEAD']))
  } catch (error) {
    throw new Error(`Failed to resolve the current commit. ${NO_GIT_HINT}`, { cause: error })
  }
  if (sha === null) {
    throw new Error(`Failed to resolve the current commit. ${NO_GIT_HINT}`)
  }
  return sha
}

/**
 * `true` when the working tree has uncommitted changes, `false` when it is clean,
 * `null` when `git status` could not be read — "unreadable" is deliberately not
 * collapsed into "clean", as that would silently suppress the dirty-tree warning.
 */
async function readDirty(runner: GitRunner): Promise<boolean | null> {
  try {
    return (await runner(['status', '--porcelain'])) !== ''
  } catch {
    return null
  }
}

async function readCommit(runner: GitRunner, hasShaOverride: boolean): Promise<GitCommit> {
  try {
    return parseCommit(await runner(['log', '-1', `--format=${COMMIT_FORMAT}`]))
  } catch (error) {
    // an explicit --sha means the caller does not rely on git having a readable HEAD
    if (hasShaOverride) {
      return unknownCommit()
    }
    throw new Error(`Failed to read the current commit. ${NO_GIT_HINT}`, { cause: error })
  }
}
