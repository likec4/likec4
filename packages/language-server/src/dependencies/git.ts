// Node-only: runs the system git for git dependencies.
// Imported only from `install.ts` / `versions.ts` (Node entry), never from the browser entry.
import { spawn } from 'node:child_process'
import { isFullGitSha } from '../workspace/dependency-uri'

/**
 * Transports git may use for git dependencies (`GIT_ALLOW_PROTOCOL`).
 * Other transports (`file`, `git`, `http`, `ext`, ...) are refused by git itself.
 */
export const GIT_ALLOWED_PROTOCOLS = 'https:ssh'

/**
 * Default timeout of one git command (milliseconds)
 */
export const GIT_COMMAND_TIMEOUT = 5 * 60 * 1000

/**
 * Error of a git command (non-zero exit code, timeout, git not found, cancellation)
 */
export class GitCommandError extends Error {
  override name = 'GitCommandError'

  constructor(
    message: string,
    /**
     * Arguments of the command
     */
    readonly args: readonly string[],
    /**
     * Exit code, undefined if git did not exit by itself (not found, killed, timed out)
     */
    readonly exitCode: number | undefined,
    /**
     * Standard error output of git (trimmed)
     */
    readonly stderr: string,
  ) {
    super(message)
  }
}

/**
 * Options of one git command
 */
export interface GitCommandOptions {
  /**
   * Working directory of the command
   */
  cwd: string
  /**
   * Aborts the command (the git process is killed)
   */
  signal?: AbortSignal | undefined
}

/**
 * Runs one git command and returns its standard output.
 * Rejects with {@link GitCommandError} if git fails.
 *
 * Low-level runner of git dependencies: replaced in tests.
 */
export type GitRunner = (args: readonly string[], options: GitCommandOptions) => Promise<string>

/**
 * Options of {@link createGitRunner}
 */
export interface GitRunnerOptions {
  /**
   * Git executable
   * @default 'git'
   */
  git?: string | undefined
  /**
   * Base environment of git processes
   * @default process.env
   */
  env?: Readonly<Record<string, string | undefined>> | undefined
  /**
   * Transports git may use (`GIT_ALLOW_PROTOCOL`, colon-separated)
   * @default GIT_ALLOWED_PROTOCOLS
   */
  allowProtocol?: string | undefined
  /**
   * Timeout of one command (milliseconds)
   * @default GIT_COMMAND_TIMEOUT
   */
  timeout?: number | undefined
}

/**
 * Environment of git processes of git dependencies: the base environment with git never asking for input
 * (no terminal prompts, no credential dialogs), restricted transports and without LFS downloads.
 * Variables of the base environment that redirect git (`GIT_DIR`, `GIT_WORK_TREE`, ...) are removed.
 */
export function gitEnvironment(
  base: Readonly<Record<string, string | undefined>>,
  allowProtocol: string = GIT_ALLOWED_PROTOCOLS,
): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(base)) {
    if (value === undefined) {
      continue
    }
    // Variables that point git to another repository or inject configuration
    if (
      key === 'GIT_DIR'
      || key === 'GIT_WORK_TREE'
      || key === 'GIT_INDEX_FILE'
      || key === 'GIT_OBJECT_DIRECTORY'
      || key === 'GIT_ALTERNATE_OBJECT_DIRECTORIES'
      || key === 'GIT_COMMON_DIR'
      || key === 'GIT_NAMESPACE'
      || key === 'GIT_CEILING_DIRECTORIES'
      || key === 'GIT_CONFIG_PARAMETERS'
      || key === 'GIT_CONFIG_COUNT'
      || key.startsWith('GIT_CONFIG_KEY_')
      || key.startsWith('GIT_CONFIG_VALUE_')
    ) {
      continue
    }
    env[key] = value
  }
  return {
    ...env,
    // never prompt for credentials on the terminal (the server would hang)
    GIT_TERMINAL_PROMPT: '0',
    // Git Credential Manager: no dialogs
    GCM_INTERACTIVE: 'never',
    // OpenSSH >= 8.4: never run an askpass program
    SSH_ASKPASS_REQUIRE: 'never',
    // only allowed transports (applies to submodules and redirects as well)
    GIT_ALLOW_PROTOCOL: allowProtocol,
    // do not download LFS objects
    GIT_LFS_SKIP_SMUDGE: '1',
    // stable (English) messages
    LC_ALL: 'C',
    LANGUAGE: 'C',
  }
}

/**
 * Configuration passed to every git command (`-c key=value`):
 * - no submodules
 * - symbolic links are checked out as plain files (they never point outside the checkout)
 * - no file system monitor, no credential dialogs
 */
export const GIT_CONFIG_ARGS: readonly string[] = [
  '-c',
  'submodule.recurse=false',
  '-c',
  'fetch.recurseSubmodules=false',
  '-c',
  'core.symlinks=false',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'credential.interactive=false',
  '-c',
  'advice.detachedHead=false',
]

/**
 * Creates the runner of the system git (see {@link GitRunner}):
 * - arguments are passed as an array, without a shell;
 * - standard input is closed, the environment is {@link gitEnvironment};
 * - every command gets {@link GIT_CONFIG_ARGS};
 * - the command is killed on timeout or when the signal is aborted.
 */
export function createGitRunner(options?: GitRunnerOptions): GitRunner {
  const git = options?.git ?? 'git'
  const env = gitEnvironment(options?.env ?? process.env, options?.allowProtocol ?? GIT_ALLOWED_PROTOCOLS)
  const timeout = options?.timeout ?? GIT_COMMAND_TIMEOUT
  return (args, { cwd, signal }) =>
    new Promise<string>((resolve, reject) => {
      const fullArgs = [...GIT_CONFIG_ARGS, ...args]
      if (signal?.aborted) {
        reject(new GitCommandError('git command was cancelled', args, undefined, ''))
        return
      }
      const child = spawn(git, fullArgs, {
        cwd,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        ...(signal && { signal }),
        killSignal: 'SIGKILL',
      })
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGKILL')
      }, timeout)
      const stdout: Buffer[] = []
      const stderr: Buffer[] = []
      child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
      let settled = false
      const fail = (message: string, exitCode: number | undefined) => {
        clearTimeout(timer)
        if (settled) {
          return
        }
        settled = true
        const errorOutput = Buffer.concat(stderr).toString('utf8').trim()
        reject(new GitCommandError(message, args, exitCode, errorOutput))
      }
      child.once('error', error => {
        switch (true) {
          case signal?.aborted === true:
            fail('git command was cancelled', undefined)
            break
          case 'code' in error && error.code === 'ENOENT':
            fail(`git executable not found: ${git}`, undefined)
            break
          default:
            fail(`git failed to start: ${error.message}`, undefined)
        }
      })
      child.once('close', (code, killSignal) => {
        if (settled) {
          return
        }
        clearTimeout(timer)
        switch (true) {
          case code === 0:
            settled = true
            resolve(Buffer.concat(stdout).toString('utf8'))
            break
          case signal?.aborted === true:
            fail('git command was cancelled', undefined)
            break
          case timedOut:
            fail(`git ${args[0] ?? ''} timed out after ${timeout}ms`, undefined)
            break
          case killSignal !== null:
            fail(`git ${args[0] ?? ''} was killed (${killSignal})`, undefined)
            break
          default: {
            const errorOutput = Buffer.concat(stderr).toString('utf8').trim()
            const lastLine = errorOutput.split('\n').at(-1)?.trim()
            fail(
              `git ${args[0] ?? ''} failed${lastLine ? `: ${lastLine}` : ` with exit code ${code}`}`,
              code ?? undefined,
            )
          }
        }
      })
    })
}

const ABBREVIATED_SHA_REGEX = /^[0-9a-f]{7,39}$/i
const FULL_SHA_ANY_CASE_REGEX = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i

/**
 * Checks if the ref of a git dependency is safe to pass to git:
 * a branch, a tag, a full ref name (`refs/...`), `HEAD` or a commit SHA,
 * following the rules of `git check-ref-format`, restricted to `A-Z a-z 0-9 . _ - / + @`.
 *
 * Rejects refs that could be taken for options (`-x`), revision expressions (`main~1`, `@{1}`, `a..b`),
 * patterns (`*`, `?`, `[`) and anything with spaces, `:`, `\`, `^` or control characters.
 */
export function isValidGitRef(ref: string): boolean {
  return ref.length > 0
    && ref.length <= 255
    && /^[A-Za-z0-9._/+@-]+$/.test(ref)
    && !ref.startsWith('-')
    && !ref.startsWith('/')
    && !ref.endsWith('/')
    && !ref.endsWith('.')
    && !ref.includes('..')
    && !ref.includes('//')
    && !ref.includes('@{')
    && ref !== '@'
    && ref.split('/').every(s => !s.startsWith('.') && !s.endsWith('.lock'))
}

/**
 * Returns the full commit SHA (lower case) if the ref is one, undefined otherwise.
 */
export function refAsFullSha(ref: string): string | undefined {
  return FULL_SHA_ANY_CASE_REGEX.test(ref) ? ref.toLowerCase() : undefined
}

/**
 * Checks if the ref looks like an abbreviated commit SHA (they cannot be resolved without a full clone).
 */
export function looksLikeAbbreviatedSha(ref: string): boolean {
  return ABBREVIATED_SHA_REGEX.test(ref)
}

/**
 * Full names of refs that may match the ref of a git dependency, in the order of preference
 * (tags before branches, as `git rev-parse` does). Peeled names (`^{}`) give commits of annotated tags.
 */
export function gitRefCandidates(ref: string): string[] {
  switch (true) {
    case ref === 'HEAD':
      return ['HEAD']
    case ref.startsWith('refs/'):
      return [ref, `${ref}^{}`]
    default:
      return [`refs/tags/${ref}`, `refs/tags/${ref}^{}`, `refs/heads/${ref}`]
  }
}

/**
 * Parses the output of `git ls-remote`: ref name -> SHA (lower case, full SHAs only).
 */
export function parseLsRemote(output: string): Map<string, string> {
  const refs = new Map<string, string>()
  for (const line of output.split('\n')) {
    const [sha, name] = line.trim().split('\t')
    if (sha && name && isFullGitSha(sha.toLowerCase())) {
      refs.set(name, sha.toLowerCase())
    }
  }
  return refs
}

/**
 * Picks the commit the ref resolved to from the output of `git ls-remote` (see {@link gitRefCandidates}).
 * Returns the full ref name and the commit SHA (peeled for annotated tags), undefined if the ref is not found.
 */
export function pickRemoteRef(
  ref: string,
  refs: ReadonlyMap<string, string>,
): { name: string; sha: string } | undefined {
  for (const name of gitRefCandidates(ref)) {
    if (name.endsWith('^{}')) {
      continue
    }
    const sha = refs.get(name)
    if (sha) {
      return { name, sha: refs.get(`${name}^{}`) ?? sha }
    }
  }
  return undefined
}

/**
 * Resolves the ref in the remote repository with `git ls-remote` (no download).
 * Returns undefined if the remote has no such ref.
 *
 * @param remote URL passed to git (validated by the caller)
 */
export async function lsRemoteRef(
  runGit: GitRunner,
  remote: string,
  ref: string,
  options: GitCommandOptions,
): Promise<{ name: string; sha: string } | undefined> {
  const output = await runGit(['ls-remote', '--quiet', '--end-of-options', remote, ...gitRefCandidates(ref)], options)
  return pickRemoteRef(ref, parseLsRemote(output))
}

/**
 * Downloads one commit into an empty directory and checks out the subdirectory:
 * `git init`, shallow `git fetch` (depth 1, no tags, no submodules), sparse checkout of the subdirectory.
 *
 * @param what full ref name or full commit SHA to fetch
 * @returns SHA of the checked out commit
 */
export async function fetchGitCommit(
  runGit: GitRunner,
  params: {
    /**
     * URL passed to git (validated by the caller)
     */
    remote: string
    /**
     * Full ref name or full commit SHA
     */
    what: string
    /**
     * Expected length of SHAs of the repository (40 for SHA-1, 64 for SHA-256)
     */
    shaLength: number
    /**
     * Normalized subdirectory (`''` for the repository root)
     */
    subdir: string
    /**
     * Empty directory to check out into
     */
    dir: string
    signal?: AbortSignal | undefined
  },
): Promise<string> {
  const options = { cwd: params.dir, signal: params.signal }
  // SHA-256 repositories need a SHA-256 local repository (git >= 2.29)
  await runGit(params.shaLength === 64 ? ['init', '--quiet', '--object-format=sha256'] : ['init', '--quiet'], options)
  if (
    !isFullGitSha(params.what) &&
    !(params.what === 'HEAD' || (params.what.startsWith('refs/') && isValidGitRef(params.what)))
  ) {
    throw new GitCommandError(`Invalid ref to fetch: ${params.what}`, ['fetch'], undefined, '')
  }
  await runGit(
    [
      'fetch',
      '--quiet',
      '--depth=1',
      '--no-tags',
      '--no-write-fetch-head',
      '--recurse-submodules=no',
      '--end-of-options',
      params.remote,
      `+${params.what}:refs/likec4/dependency`,
    ],
    options,
  )
  if (params.subdir !== '') {
    await runGit(['sparse-checkout', 'set', '--no-cone', '--', `/${params.subdir}/`], options)
  }
  await runGit(['checkout', '--quiet', '--detach', 'refs/likec4/dependency^{commit}'], options)
  const sha = (await runGit(['rev-parse', '--verify', 'HEAD^{commit}'], options)).trim().toLowerCase()
  if (!isFullGitSha(sha)) {
    throw new GitCommandError(`Unexpected commit SHA: ${sha}`, ['rev-parse'], undefined, '')
  }
  return sha
}

/**
 * Lists files of the checkout that are not regular files in git (symbolic links, submodules):
 * paths relative to the repository root (forward slashes).
 * They are checked out as plain files (`core.symlinks=false`) or empty folders and must not be read as sources.
 */
export async function listGitSpecialFiles(runGit: GitRunner, options: GitCommandOptions): Promise<Set<string>> {
  const output = await runGit(['ls-files', '--stage', '-z'], options)
  const special = new Set<string>()
  for (const line of output.split('\0')) {
    // <mode> <object> <stage>\t<path>
    const tab = line.indexOf('\t')
    if (tab < 0) {
      continue
    }
    const mode = line.slice(0, line.indexOf(' '))
    if (mode !== '100644' && mode !== '100755') {
      special.add(line.slice(tab + 1))
    }
  }
  return special
}
