// Node-only: runs the system git for git dependencies.
// Imported only from `install.ts` / `versions.ts` (Node entry), never from the browser entry.
import { type ChildProcess, spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { devNull, tmpdir } from 'node:os'
import { posix, win32 } from 'node:path'
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
 * Minimum supported version of git: `sparse-checkout set --no-cone` (2.35),
 * `--end-of-options` (2.24), `fetch --no-write-fetch-head` and `init --object-format` (2.29).
 */
export const MIN_GIT_VERSION: readonly [number, number, number] = [2, 35, 0]

/**
 * SSH command used when the user configured none (`GIT_SSH_COMMAND`, `GIT_SSH`, `core.sshCommand`):
 * never asks for passwords or host key confirmations.
 */
export const GIT_BATCH_SSH_COMMAND = 'ssh -o BatchMode=yes'

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
   * Working directory of the git process.
   * Never a checkout of a dependency: repositories are addressed with `-C <dir>`.
   */
  cwd: string
  /**
   * Aborts the command (the git process tree is killed)
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
   * Git executable: a name searched in `PATH`, or an absolute path
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

type Env = Readonly<Record<string, string | undefined>>

/**
 * Parameters of {@link findGitExecutable}
 */
export interface FindGitExecutableParams {
  /**
   * Name or absolute path of the executable
   * @default 'git'
   */
  name?: string | undefined
  env: Env
  platform: string
  /**
   * Checks if the path is an executable file
   */
  isExecutable?: ((path: string) => Promise<boolean>) | undefined
}

async function isExecutableFile(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    if (!stats.isFile()) {
      return false
    }
    if (process.platform !== 'win32') {
      await access(path, constants.X_OK)
    }
    return true
  } catch {
    return false
  }
}

function envValue(env: Env, name: string, platform: string): string | undefined {
  if (platform !== 'win32') {
    return env[name]
  }
  // environment variables are case-insensitive on Windows ("Path")
  const key = Object.keys(env).find(k => k.toUpperCase() === name)
  return key !== undefined ? env[key] : undefined
}

/**
 * Finds the git executable: an absolute path is used as is, a name is searched in the absolute directories of `PATH`
 * only. The current directory and relative `PATH` entries are never searched
 * (on Windows a `git.exe` in the working directory would win otherwise).
 * On Windows, only `.exe` and `.com` extensions of `PATHEXT` are tried (batch files need a shell).
 *
 * Returns the absolute path, undefined if not found.
 */
export async function findGitExecutable(params: FindGitExecutableParams): Promise<string | undefined> {
  const { env, platform } = params
  const name = params.name ?? 'git'
  const isExecutable = params.isExecutable ?? isExecutableFile
  const path = platform === 'win32' ? win32 : posix
  if (path.isAbsolute(name)) {
    return (await isExecutable(name)) ? name : undefined
  }
  if (name.length === 0 || name.includes('/') || (platform === 'win32' && name.includes('\\'))) {
    return undefined
  }
  let extensions = ['']
  if (platform === 'win32') {
    const pathext = (envValue(env, 'PATHEXT', platform) ?? '.COM;.EXE')
      .split(';')
      .map(e => e.trim().toLowerCase())
      .filter(e => e === '.exe' || e === '.com')
    extensions = /\.(exe|com)$/i.test(name) ? [''] : pathext.length > 0 ? pathext : ['.exe']
  }
  const dirs = (envValue(env, 'PATH', platform) ?? '')
    .split(platform === 'win32' ? ';' : ':')
    .map(dir => (platform === 'win32' ? dir.trim().replace(/^"(.*)"$/, '$1') : dir))
    .filter(dir => dir.length > 0 && path.isAbsolute(dir))
  for (const dir of dirs) {
    for (const ext of extensions) {
      const candidate = path.join(dir, `${name}${ext}`)
      if (await isExecutable(candidate)) {
        return candidate
      }
    }
  }
  return undefined
}

/**
 * Parses the output of `git version` (`git version 2.39.2 (Apple Git-143)`, `git version 2.45.1.windows.1`).
 */
export function parseGitVersion(output: string): [number, number, number] | undefined {
  const match = /git version (\d+)\.(\d+)(?:\.(\d+))?/.exec(output)
  if (!match) {
    return undefined
  }
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
}

/**
 * Checks if the version is at least {@link MIN_GIT_VERSION}.
 */
export function isSupportedGitVersion(version: readonly [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) {
    const a = version[i] ?? 0
    const b = MIN_GIT_VERSION[i] ?? 0
    if (a !== b) {
      return a > b
    }
  }
  return true
}

// GIT_* variables passed to git: transport (ssh, TLS, proxies) and the location of the user configuration.
// Others (GIT_DIR, GIT_WORK_TREE, GIT_TEMPLATE_DIR, GIT_DEFAULT_HASH, GIT_SHALLOW_FILE, GIT_CONFIG_PARAMETERS,
// GIT_ASKPASS, ...) are dropped: they redirect git or change what is downloaded.
const ALLOWED_GIT_ENV = new Set([
  'GIT_SSH',
  'GIT_SSH_COMMAND',
  'GIT_SSH_VARIANT',
  'GIT_EXEC_PATH',
  'GIT_CONFIG_GLOBAL',
  'GIT_CONFIG_SYSTEM',
  'GIT_CONFIG_NOSYSTEM',
  'GIT_HTTP_USER_AGENT',
  'GIT_HTTP_LOW_SPEED_LIMIT',
  'GIT_HTTP_LOW_SPEED_TIME',
  'GIT_HTTP_PROXY_AUTHMETHOD',
])
const ALLOWED_GIT_ENV_PREFIXES = ['GIT_SSL_', 'GIT_PROXY_SSL_']

// askpass programs would show dialogs
const DROPPED_ENV = new Set(['SSH_ASKPASS', 'SSH_ASKPASS_REQUIRE', 'DISPLAY_ASKPASS'])

function isAllowedEnv(key: string): boolean {
  const upper = key.toUpperCase()
  if (DROPPED_ENV.has(upper)) {
    return false
  }
  if (!upper.startsWith('GIT_')) {
    return true
  }
  return ALLOWED_GIT_ENV.has(upper) || ALLOWED_GIT_ENV_PREFIXES.some(prefix => upper.startsWith(prefix))
}

/**
 * Environment of git processes of git dependencies: the base environment with git never asking for input
 * (no terminal prompts, no askpass programs, no credential dialogs), restricted transports and without LFS downloads.
 * Only an allowlist of `GIT_*` variables is kept (transport, TLS, proxies, location of the user configuration).
 * Credential helpers of the user are kept: private repositories work with configured credentials.
 */
export function gitEnvironment(base: Env, allowProtocol: string = GIT_ALLOWED_PROTOCOLS): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined && isAllowedEnv(key)) {
      env[key] = value
    }
  }
  return {
    ...env,
    // never prompt for credentials on the terminal (the server would hang)
    GIT_TERMINAL_PROMPT: '0',
    // Git Credential Manager: no dialogs
    GCM_INTERACTIVE: 'never',
    // OpenSSH >= 8.4: never run an askpass program
    SSH_ASKPASS_REQUIRE: 'never',
    // only allowed transports (applies to submodules, redirects and lazy fetches as well)
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
 * - no submodules, no hooks, no templates, no askpass program, no credential dialogs
 * - symbolic links are checked out as plain files (they never point outside the checkout)
 * - downloaded objects are checked (`transfer.fsckObjects`)
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
  `core.hooksPath=${devNull}`,
  '-c',
  'init.templateDir=',
  '-c',
  'core.askPass=',
  '-c',
  'credential.interactive=false',
  '-c',
  'transfer.fsckObjects=true',
  '-c',
  'fetch.fsck.zeroPaddedFilemode=ignore',
  '-c',
  'advice.detachedHead=false',
]

/**
 * Kills the process and its children (best effort):
 * the process group on POSIX (git is spawned detached), `taskkill /T` on Windows.
 */
function killProcessTree(child: ChildProcess, env: Env): void {
  const pid = child.pid
  if (pid === undefined || child.exitCode !== null) {
    return
  }
  try {
    if (process.platform === 'win32') {
      const systemRoot = envValue(env, 'SYSTEMROOT', 'win32') ?? 'C:\\Windows'
      spawn(win32.join(systemRoot, 'System32', 'taskkill.exe'), ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      }).once('error', () => child.kill('SIGKILL'))
    } else {
      process.kill(-pid, 'SIGKILL')
    }
  } catch {
    child.kill('SIGKILL')
  }
}

interface SpawnGitParams {
  executable: string
  args: readonly string[]
  cwd: string
  env: Record<string, string>
  timeout: number
  signal?: AbortSignal | undefined
}

function spawnGit({ executable, args, cwd, env, timeout, signal }: SpawnGitParams): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GitCommandError('git command was cancelled', args, undefined, ''))
      return
    }
    const child = spawn(executable, [...GIT_CONFIG_ARGS, ...args], {
      cwd,
      env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      // own process group (killed as a whole), no controlling terminal (ssh cannot prompt)
      detached: process.platform !== 'win32',
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    child.stdout?.on('data', (chunk: Buffer) => stdout.push(chunk))
    child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk))
    let timedOut = false
    let cancelled = false
    const timer = setTimeout(() => {
      timedOut = true
      killProcessTree(child, env)
    }, timeout)
    const onAbort = () => {
      cancelled = true
      killProcessTree(child, env)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    let settled = false
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    const fail = (message: string, exitCode: number | undefined) => {
      cleanup()
      if (settled) {
        return
      }
      settled = true
      reject(new GitCommandError(message, args, exitCode, Buffer.concat(stderr).toString('utf8').trim()))
    }
    child.once('error', error => {
      fail(cancelled ? 'git command was cancelled' : `git failed to start: ${error.message}`, undefined)
    })
    child.once('close', (code, killSignal) => {
      cleanup()
      if (settled) {
        return
      }
      switch (true) {
        case code === 0 && !cancelled && !timedOut:
          settled = true
          resolve(Buffer.concat(stdout).toString('utf8'))
          break
        case cancelled:
          fail('git command was cancelled', undefined)
          break
        case timedOut:
          fail(`git ${args[0] ?? ''} timed out after ${timeout}ms`, undefined)
          break
        case killSignal !== null:
          fail(`git ${args[0] ?? ''} was killed (${killSignal})`, undefined)
          break
        default: {
          const lastLine = Buffer.concat(stderr).toString('utf8').trim().split('\n').at(-1)?.trim()
          fail(
            `git ${args[0] ?? ''} failed${lastLine ? `: ${lastLine}` : ` with exit code ${code}`}`,
            code ?? undefined,
          )
        }
      }
    })
  })
}

interface GitSetup {
  executable: string
  env: Record<string, string>
}

/**
 * Creates the runner of the system git (see {@link GitRunner}).
 *
 * On first use, the runner (once, retried after a failure):
 * - finds git in the absolute directories of `PATH` ({@link findGitExecutable}), never in the working directory;
 * - checks its version ({@link MIN_GIT_VERSION});
 * - uses {@link GIT_BATCH_SSH_COMMAND} if the user configured no ssh command
 *   (`GIT_SSH_COMMAND`, `GIT_SSH`, `core.sshCommand`); a configured one is kept as is.
 *
 * Every command: arguments as an array without a shell, standard input closed, environment {@link gitEnvironment},
 * configuration {@link GIT_CONFIG_ARGS}; the process tree is killed on timeout or when the signal is aborted.
 */
export function createGitRunner(options?: GitRunnerOptions): GitRunner {
  const baseEnv = options?.env ?? process.env
  const env = gitEnvironment(baseEnv, options?.allowProtocol ?? GIT_ALLOWED_PROTOCOLS)
  const timeout = options?.timeout ?? GIT_COMMAND_TIMEOUT
  let setup: Promise<GitSetup> | undefined

  const initialize = async (): Promise<GitSetup> => {
    const name = options?.git ?? 'git'
    const executable = await findGitExecutable({ name, env: baseEnv, platform: process.platform })
    if (!executable) {
      throw new GitCommandError(`git executable not found in PATH: ${name}`, [], undefined, '')
    }
    const cwd = tmpdir()
    const output = await spawnGit({ executable, args: ['version'], cwd, env, timeout })
    const version = parseGitVersion(output)
    if (!version || !isSupportedGitVersion(version)) {
      throw new GitCommandError(
        `git ${MIN_GIT_VERSION.join('.')} or newer is required for git dependencies, found: ${output.trim()}`,
        ['version'],
        undefined,
        '',
      )
    }
    let sshConfigured = !!env['GIT_SSH_COMMAND'] || !!env['GIT_SSH']
    if (!sshConfigured) {
      const configured = await spawnGit({
        executable,
        args: ['config', '--get', 'core.sshCommand'],
        cwd,
        env,
        timeout,
      }).catch(() => '')
      sshConfigured = configured.trim().length > 0
    }
    return {
      executable,
      env: sshConfigured ? env : { ...env, GIT_SSH_COMMAND: GIT_BATCH_SSH_COMMAND },
    }
  }

  return async (args, { cwd, signal }) => {
    setup ??= initialize().catch((error: unknown) => {
      setup = undefined
      throw error
    })
    const { executable, env } = await setup
    return spawnGit({ executable, args, cwd, env, timeout, signal })
  }
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
 * Local ref the downloaded commit is fetched into
 */
const FETCHED_REF = 'refs/likec4/dependency'

/**
 * Error of {@link fetchGitCommit}: the subdirectory does not exist in the commit
 */
export class GitPathNotFoundError extends Error {
  override name = 'GitPathNotFoundError'
}

/**
 * Downloads one commit into an empty directory and checks out the subdirectory:
 * 1. `git init`, the remote is configured as a promisor (partial clone);
 * 2. shallow fetch (depth 1, no tags, no submodules) without blobs (`--filter=blob:none`;
 *    servers without filters send the whole commit);
 * 3. the subdirectory must exist in the commit with exactly this case;
 * 4. sparse checkout of the subdirectory: only its blobs are downloaded.
 *
 * Git runs in `options.cwd`, the checkout is addressed with `-C`.
 *
 * @returns SHA of the checked out commit
 * @throws {GitPathNotFoundError} if the subdirectory is not in the commit
 */
export async function fetchGitCommit(
  runGit: GitRunner,
  params: {
    /**
     * URL passed to git (validated by the caller)
     */
    remote: string
    /**
     * Full ref name (`refs/...`, `HEAD`) or full commit SHA
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
  },
  options: GitCommandOptions,
): Promise<string> {
  const { what, subdir, dir } = params
  if (!isFullGitSha(what) && what !== 'HEAD' && !(what.startsWith('refs/') && isValidGitRef(what))) {
    throw new GitCommandError(`Invalid ref to fetch: ${JSON.stringify(what)}`, ['fetch'], undefined, '')
  }
  const git = (...args: string[]) => runGit(['-C', dir, ...args], options)
  // SHA-256 repositories need a SHA-256 local repository
  await git(...(params.shaLength === 64 ? ['init', '--quiet', '--object-format=sha256'] : ['init', '--quiet']))
  await git('config', '--end-of-options', 'remote.origin.url', params.remote)
  await git('config', '--end-of-options', 'remote.origin.promisor', 'true')
  await git('config', '--end-of-options', 'remote.origin.partialclonefilter', 'blob:none')
  await git(
    'fetch',
    '--quiet',
    '--depth=1',
    '--no-tags',
    '--no-write-fetch-head',
    '--recurse-submodules=no',
    '--filter=blob:none',
    '--end-of-options',
    'origin',
    `+${what}:${FETCHED_REF}`,
  )
  const sha = (await git('rev-parse', '--verify', '--end-of-options', `${FETCHED_REF}^{commit}`)).trim().toLowerCase()
  if (!isFullGitSha(sha)) {
    throw new GitCommandError(`Unexpected commit SHA: ${JSON.stringify(sha)}`, ['rev-parse'], undefined, '')
  }
  if (subdir !== '') {
    // exact match: paths are case-sensitive in git, also on case-insensitive file systems
    const found = await git('--literal-pathspecs', 'ls-tree', '-d', '--name-only', '-z', sha, '--', subdir)
    if (!found.split('\0').includes(subdir)) {
      throw new GitPathNotFoundError(`Path ${JSON.stringify(subdir)} not found at ${sha} (paths are case-sensitive)`)
    }
    await git('sparse-checkout', 'set', '--no-cone', '--', `/${subdir}/`)
  }
  await git('checkout', '--quiet', '--detach', sha)
  return sha
}

/**
 * Lists files of the checkout that are not regular files in git (symbolic links, submodules):
 * paths relative to the repository root (forward slashes).
 * They are checked out as plain files (`core.symlinks=false`) or empty folders and must not be read as sources.
 */
export async function listGitSpecialFiles(
  runGit: GitRunner,
  dir: string,
  options: GitCommandOptions,
): Promise<Set<string>> {
  const output = await runGit(['-C', dir, 'ls-files', '--stage', '-z'], options)
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
