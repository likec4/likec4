// Node-only: runs the system git for git dependencies.
// Imported only from `install.ts` / `versions.ts` (Node entry), never from the browser entry.
import { ConfigFilenames, isLikeC4JsonConfig } from '@likec4/config'
import { type ChildProcess, spawn, spawnSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, mkdtemp, realpath, rm, stat } from 'node:fs/promises'
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
 * the fix of CVE-2022-24765 (2.35.2: repositories owned by other users are not used),
 * `--end-of-options` (2.24), `fetch --no-write-fetch-head` and `init --object-format` (2.29).
 */
export const MIN_GIT_VERSION: readonly [number, number, number] = [2, 35, 2]

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
  /**
   * Time to wait for the output streams after git exited (milliseconds)
   * @default 2000
   */
  drainGrace?: number | undefined
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
 * Checks if the path is absolute and independent of the current directory and drive:
 * on Windows, root-relative paths (`\\tools`) depend on the current drive, a drive letter or UNC prefix is required.
 */
function isFullyAbsolute(path: string, platform: string): boolean {
  return platform === 'win32' ? /^(?:[a-z]:[\\/]|\\\\)/i.test(path) : posix.isAbsolute(path)
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
  if (isFullyAbsolute(name, platform)) {
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
    .filter(dir => dir.length > 0 && isFullyAbsolute(dir, platform))
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
 *
 * Configuration from the environment (`GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_COUNT`/`KEY_n`/`VALUE_n`) is dropped
 * on purpose, so it cannot override the hardening of {@link GIT_CONFIG_ARGS}: CI must configure `insteadOf`
 * rewrites and credentials in the global git configuration (`git config --global`, or `GIT_CONFIG_GLOBAL`).
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
 * - paths that are special on NTFS and HFS+ (`.git` aliases) are refused on checkout on every platform
 *
 * Downloaded objects are not checked with `transfer.fsckObjects`: it rejects real repositories with harmless
 * defects (bad time zones, zero-padded modes), and its per-message leniency does not apply to partial clones.
 * Checkout checks every path itself (`.git`, `..`, NTFS/HFS+ aliases).
 */
export const GIT_CONFIG_ARGS: readonly string[] = [
  '-c',
  'submodule.recurse=false',
  '-c',
  'fetch.recurseSubmodules=false',
  '-c',
  'core.symlinks=false',
  '-c',
  'core.protectNTFS=true',
  '-c',
  'core.protectHFS=true',
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
  'advice.detachedHead=false',
]

/**
 * Time to wait for the output streams after git exited (a grandchild, e.g. an ssh master, may keep them open)
 */
const DRAIN_GRACE = 2000

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f-\x9f\p{Cf}]+/gu

/**
 * Makes text from git (or the server, via git) safe for messages: control and format characters
 * (bidirectional overrides, zero-width characters) become spaces,
 * truncated to `max` characters.
 */
export function sanitizeGitOutput(text: string, max = 200): string {
  const clean = text.replace(CONTROL_CHARS_REGEX, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

/**
 * Running git processes: their process groups are killed when the Node process exits
 */
const runningProcesses = new Set<ChildProcess>()
let exitHookInstalled = false

function installExitHook(): void {
  if (exitHookInstalled) {
    return
  }
  exitHookInstalled = true
  // synchronous: nothing asynchronous runs in an "exit" handler
  process.once('exit', () => {
    for (const child of runningProcesses) {
      const pid = child.pid
      if (pid === undefined) {
        continue
      }
      try {
        if (process.platform === 'win32') {
          spawnSync(taskkillPath(process.env), ['/pid', String(pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true,
            timeout: 5000,
          })
        } else {
          process.kill(-pid, 'SIGKILL')
        }
      } catch {
        // already gone
      }
    }
  })
}

/**
 * Absolute path of `taskkill.exe` (never searched in `PATH` or the working directory)
 */
function taskkillPath(env: Env): string {
  const systemRoot = envValue(env, 'SYSTEMROOT', 'win32') ?? 'C:\\Windows'
  return win32.join(systemRoot, 'System32', 'taskkill.exe')
}

/**
 * Kills the process and its children (best effort), also after the process itself exited:
 * the process group on POSIX (git is spawned detached, children stay in its group),
 * `taskkill /T` on Windows (children of an exited process cannot be found there).
 */
function killProcessTree(child: ChildProcess, env: Env): void {
  const pid = child.pid
  if (pid === undefined) {
    return
  }
  if (process.platform !== 'win32') {
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      // ESRCH: the group is gone
    }
    return
  }
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }
  try {
    spawn(taskkillPath(env), ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    }).once('error', () => child.kill('SIGKILL'))
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
  drainGrace: number
  signal?: AbortSignal | undefined
}

/**
 * Maximum standard output of one git command (bytes)
 */
const MAX_STDOUT = 16 * 1024 * 1024
/**
 * Maximum error output of one git command (bytes)
 */
const MAX_STDERR = 1024 * 1024

/**
 * Runs git. Settles when the output streams close, or `drainGrace` after git exited (or was killed)
 * if they stay open, so a grandchild holding the streams never blocks the caller.
 * `GIT_CEILING_DIRECTORIES` is the parent of the real path of the working directory.
 */
async function spawnGit(params: SpawnGitParams): Promise<string> {
  // repository discovery never leaves the working directory (CVE-2022-24765): the ceiling is its real parent
  const realCwd = await realpath(params.cwd).catch(() => params.cwd)
  return await spawnGitIn({ ...params, cwd: realCwd })
}

/**
 * Spawns git in the (real) working directory and collects its output, see {@link spawnGit}:
 * kills the process tree on timeout, abort or too much output, and gives up on the streams
 * `drainGrace` after the process exited.
 */
function spawnGitIn({ executable, args, cwd, env, timeout, drainGrace, signal }: SpawnGitParams): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GitCommandError('git command was cancelled', args, undefined, ''))
      return
    }
    installExitHook()
    const child = spawn(executable, [...GIT_CONFIG_ARGS, ...args], {
      cwd,
      env: { ...env, GIT_CEILING_DIRECTORIES: posixOrWin32().dirname(cwd) },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      // own process group (killed as a whole), no controlling terminal (ssh cannot prompt)
      detached: process.platform !== 'win32',
    })
    runningProcesses.add(child)
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutSize = 0
    let stderrSize = 0
    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutSize += chunk.byteLength
      if (stdoutSize > MAX_STDOUT) {
        kill('overflow')
        return
      }
      stdout.push(chunk)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrSize += chunk.byteLength
      if (stderrSize > MAX_STDERR) {
        kill('overflow')
        return
      }
      stderr.push(chunk)
    })
    let killedBy: 'timeout' | 'cancel' | 'overflow' | undefined
    let settled = false
    let graceTimer: ReturnType<typeof setTimeout> | undefined
    const command = gitSubcommand(args)

    const cleanup = () => {
      clearTimeout(timer)
      clearTimeout(graceTimer)
      signal?.removeEventListener('abort', onAbort)
      runningProcesses.delete(child)
    }
    const errorOutput = () => Buffer.concat(stderr).toString('utf8').trim()
    const fail = (message: string, exitCode: number | undefined) => {
      cleanup()
      if (settled) {
        return
      }
      settled = true
      reject(new GitCommandError(message, args, exitCode, errorOutput()))
    }
    const finish = (code: number | null, killSignal: NodeJS.Signals | null) => {
      cleanup()
      if (settled) {
        return
      }
      switch (true) {
        case killedBy === 'cancel':
          fail('git command was cancelled', undefined)
          break
        case killedBy === 'timeout':
          fail(`git ${command} timed out after ${timeout}ms`, undefined)
          break
        case killedBy === 'overflow':
          fail(
            `git ${command} produced too much output (limits: ${MAX_STDOUT} bytes, ${MAX_STDERR} bytes of errors)`,
            undefined,
          )
          break
        case code === 0:
          settled = true
          resolve(Buffer.concat(stdout).toString('utf8'))
          break
        case killSignal !== null:
          fail(`git ${command} was killed (${killSignal})`, undefined)
          break
        default: {
          const lastLine = sanitizeGitOutput(errorOutput().split('\n').at(-1) ?? '')
          fail(`git ${command} failed${lastLine ? `: ${lastLine}` : ` with exit code ${code}`}`, code ?? undefined)
        }
      }
    }
    // stop waiting for the streams: they may be held by a grandchild
    const startGrace = (code: number | null, killSignal: NodeJS.Signals | null) => {
      if (graceTimer || settled) {
        return
      }
      graceTimer = setTimeout(() => {
        child.stdout?.destroy()
        child.stderr?.destroy()
        finish(code, killSignal)
      }, drainGrace)
    }
    const kill = (reason: 'timeout' | 'cancel' | 'overflow') => {
      killedBy ??= reason
      killProcessTree(child, env)
      startGrace(null, 'SIGKILL')
    }
    const timer = setTimeout(() => kill('timeout'), timeout)
    const onAbort = () => kill('cancel')
    signal?.addEventListener('abort', onAbort, { once: true })

    child.once('error', error => {
      fail(killedBy === 'cancel' ? 'git command was cancelled' : `git failed to start: ${error.message}`, undefined)
    })
    child.once('exit', (code, killSignal) => startGrace(code, killSignal))
    child.once('close', (code, killSignal) => finish(code, killSignal))
  })
}

/**
 * Git subcommand of the arguments (skips `-C <dir>` and global options)
 */
function gitSubcommand(args: readonly string[]): string {
  let i = 0
  while (i < args.length && args[i]!.startsWith('-')) {
    i += args[i] === '-C' ? 2 : 1
  }
  return args[i] ?? ''
}

function posixOrWin32() {
  return process.platform === 'win32' ? win32 : posix
}

interface GitSetup {
  executable: string
}

/**
 * Creates the runner of the system git (see {@link GitRunner}).
 *
 * On first use, the runner (once, retried after a failure) finds git in the absolute directories of `PATH`
 * ({@link findGitExecutable}), never in the working directory, and checks its version ({@link MIN_GIT_VERSION}).
 * The probe runs with `GIT_DIR` pointing to a missing directory, so no repository is read.
 *
 * Every command: arguments as an array without a shell, standard input closed, environment {@link gitEnvironment}
 * with `GIT_CEILING_DIRECTORIES` set to the parent of the working directory, configuration {@link GIT_CONFIG_ARGS};
 * the process tree is killed on timeout, when the signal is aborted and when the Node process exits
 * (`process.on('exit')`). Signals do not run `exit` handlers and git runs in its own process group, so hosts
 * (CLI) must turn SIGINT/SIGTERM into `process.exit()`; the library installs no signal handlers.
 *
 * Prompts: POSIX git runs in its own session without a terminal, askpass programs are disabled
 * (`SSH_ASKPASS_REQUIRE=never`, no `GIT_ASKPASS`/`SSH_ASKPASS`, empty `core.askPass`), terminal prompts of git
 * are disabled. The ssh command of the user (`GIT_SSH_COMMAND`, `core.sshCommand`) is used as is:
 * on Windows, an ssh that asks for a passphrase may prompt in the terminal of the CLI.
 */
export function createGitRunner(options?: GitRunnerOptions): GitRunner {
  const baseEnv = options?.env ?? process.env
  const env = gitEnvironment(baseEnv, options?.allowProtocol ?? GIT_ALLOWED_PROTOCOLS)
  const timeout = options?.timeout ?? GIT_COMMAND_TIMEOUT
  const drainGrace = options?.drainGrace ?? DRAIN_GRACE
  let setup: Promise<GitSetup> | undefined

  const initialize = async (): Promise<GitSetup> => {
    const name = options?.git ?? 'git'
    const executable = await findGitExecutable({ name, env: baseEnv, platform: process.platform })
    if (!executable) {
      throw new GitCommandError(`git executable not found in PATH: ${JSON.stringify(name)}`, [], undefined, '')
    }
    // the probe reads no repository: GIT_DIR points to a missing directory in a fresh directory
    const cwd = await mkdtemp(posixOrWin32().join(tmpdir(), 'likec4-git-probe-'))
    let output: string
    try {
      output = await spawnGit({
        executable,
        args: ['version'],
        cwd,
        env: { ...env, GIT_DIR: posixOrWin32().join(cwd, 'missing', '.git') },
        timeout,
        drainGrace,
      })
    } finally {
      await rm(cwd, { recursive: true, force: true }).catch(() => {})
    }
    const version = parseGitVersion(output)
    if (!version || !isSupportedGitVersion(version)) {
      throw new GitCommandError(
        `git ${MIN_GIT_VERSION.join('.')} or newer is required for git dependencies, found: ${
          JSON.stringify(sanitizeGitOutput(output))
        }`,
        ['version'],
        undefined,
        '',
      )
    }
    return { executable }
  }

  return async (args, { cwd, signal }) => {
    setup ??= initialize().catch((error: unknown) => {
      setup = undefined
      throw error
    })
    const { executable } = await setup
    return spawnGit({ executable, args, cwd, env, timeout, drainGrace, signal })
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
 * Name of the remote of the repository of a git dependency (unlikely to be configured by the user)
 */
export const GIT_REMOTE_NAME = 'likec4-dependency'

/**
 * SSH command set on Windows when the user configured none: never prompts
 */
export const GIT_BATCH_SSH_COMMAND = 'ssh -o BatchMode=yes'

/**
 * Initializes an empty repository for a git dependency in `dir` (an empty directory) with the remote
 * {@link GIT_REMOTE_NAME} configured as a promisor (partial clone without blobs). `ls-remote` and `fetch` run inside
 * it, so the configuration of the user that depends on the remote (`includeIf "hasconfig:remote.*.url:..."`) applies.
 *
 * - the object format is always explicit (`init.defaultObjectFormat` of the user is ignored);
 * - the URL of the remote is verified (no other URL may come from the configuration of the user);
 * - Windows only: if no ssh command is configured (`GIT_SSH_COMMAND` or `GIT_SSH` in the environment,
 *   `core.sshCommand` in this repository with includes applied), {@link GIT_BATCH_SSH_COMMAND} is set locally,
 *   so ssh cannot prompt in a terminal. On POSIX, git runs without a terminal.
 *
 * @param params.remote URL passed to git (validated by the caller)
 * @param params.shaLength 64 for SHA-256 repositories
 * @param params.platform `process.platform` by default
 * @param params.env environment of git, `process.env` by default
 */
export async function initGitRepository(
  runGit: GitRunner,
  params: {
    remote: string
    dir: string
    shaLength?: number | undefined
    platform?: string | undefined
    env?: Env | undefined
  },
  options: GitCommandOptions,
): Promise<void> {
  const git = (...args: string[]) => runGit(['-C', params.dir, ...args], options)
  await git('init', '--quiet', `--object-format=${params.shaLength === 64 ? 'sha256' : 'sha1'}`)
  const remote = `remote.${GIT_REMOTE_NAME}`
  await git('config', '--end-of-options', `${remote}.url`, params.remote)
  await git('config', '--end-of-options', `${remote}.promisor`, 'true')
  await git('config', '--end-of-options', `${remote}.partialclonefilter`, 'blob:none')
  const urls = (await git('config', '--get-all', '--end-of-options', `${remote}.url`)).split('\n').filter(Boolean)
  if (urls.length !== 1 || urls[0] !== params.remote) {
    throw new GitCommandError(
      `Unexpected URL of the remote ${GIT_REMOTE_NAME} (check the git configuration)`,
      ['config'],
      undefined,
      '',
    )
  }
  const platform = params.platform ?? process.platform
  const env = params.env ?? process.env
  // GIT_SSH_COMMAND wins over core.sshCommand, which wins over GIT_SSH: do not shadow GIT_SSH
  const sshFromEnv = ['GIT_SSH_COMMAND', 'GIT_SSH'].some(name => !!envValue(env, name, platform)?.trim())
  if (platform === 'win32' && !sshFromEnv) {
    const configured = await git('config', '--get', 'core.sshCommand').catch(() => '')
    if (configured.trim() === '') {
      await git('config', '--end-of-options', 'core.sshCommand', GIT_BATCH_SSH_COMMAND)
    }
  }
}

/**
 * Resolves the ref in the remote {@link GIT_REMOTE_NAME} of the repository ({@link initGitRepository}) with `git ls-remote`
 * (no download). Returns undefined if the remote has no such ref.
 */
export async function lsRemoteRef(
  runGit: GitRunner,
  dir: string,
  ref: string,
  options: GitCommandOptions,
): Promise<{ name: string; sha: string } | undefined> {
  const output = await runGit(
    ['-C', dir, 'ls-remote', '--quiet', '--end-of-options', GIT_REMOTE_NAME, ...gitRefCandidates(ref)],
    options,
  )
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
 * JSON config file names of LikeC4 (`.likec4rc`, `likec4.config.json`, ...)
 */
const JSON_CONFIG_FILENAMES = ConfigFilenames.filter(name => isLikeC4JsonConfig(name))

/**
 * Patterns of the sparse checkout (non-cone mode) of a git dependency: `.c4` and `.likec4` files at any depth
 * of the subdirectory and JSON config files at its root. Only blobs of matching files are downloaded.
 *
 * @param subdir normalized subdirectory (`''` for the repository root)
 */
export function sparseCheckoutPatterns(subdir: string): string[] {
  const base = subdir ? `/${subdir}/` : '/'
  return [
    ...SOURCE_FILE_EXTENSIONS.map(ext => `${base}**/*${ext}`),
    ...JSON_CONFIG_FILENAMES.map(name => `${base}${name}`),
  ]
}

/**
 * Extensions of source files of git dependencies (case-sensitive, as in the workspace)
 */
export const SOURCE_FILE_EXTENSIONS = ['.c4', '.likec4'] as const

/**
 * Downloads one commit into the repository ({@link initGitRepository}) and checks out the sources of the subdirectory:
 * 1. shallow fetch (depth 1, no tags, no submodules) without blobs (`--filter=blob:none`;
 *    servers without filters send the whole commit);
 * 2. the subdirectory must exist in the commit with exactly this case;
 * 3. sparse checkout of {@link sparseCheckoutPatterns}: only blobs of these files are downloaded.
 *
 * Git runs in `options.cwd`, the repository is addressed with `-C`.
 *
 * @returns SHA of the checked out commit
 * @throws {GitPathNotFoundError} if the subdirectory is not in the commit
 */
export async function fetchGitCommit(
  runGit: GitRunner,
  params: {
    /**
     * Full ref name (`refs/...`, `HEAD`) or full commit SHA
     */
    what: string
    /**
     * Normalized subdirectory (`''` for the repository root)
     */
    subdir: string
    /**
     * Repository initialized with {@link initGitRepository}
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
  await git(
    'fetch',
    '--quiet',
    '--depth=1',
    '--no-tags',
    '--no-write-fetch-head',
    '--recurse-submodules=no',
    '--filter=blob:none',
    '--end-of-options',
    GIT_REMOTE_NAME,
    `+${what}:${FETCHED_REF}`,
  )
  const sha = (await git('rev-parse', '--verify', '--end-of-options', `${FETCHED_REF}^{commit}`)).trim().toLowerCase()
  if (!isFullGitSha(sha)) {
    throw new GitCommandError(
      `Unexpected commit SHA: ${JSON.stringify(sanitizeGitOutput(sha))}`,
      ['rev-parse'],
      undefined,
      '',
    )
  }
  if (subdir !== '') {
    // exact match: paths are case-sensitive in git, also on case-insensitive file systems
    const found = await git('--literal-pathspecs', 'ls-tree', '-d', '--name-only', '-z', sha, '--', subdir)
    if (!found.split('\0').includes(subdir)) {
      throw new GitPathNotFoundError(`Path ${JSON.stringify(subdir)} not found at ${sha} (paths are case-sensitive)`)
    }
  }
  await git('sparse-checkout', 'set', '--no-cone', '--', ...sparseCheckoutPatterns(subdir))
  await git('checkout', '--quiet', '--detach', sha)
  return sha
}

/**
 * Lists files of the checkout that are not regular files in git (symbolic links, submodules):
 * paths relative to the repository root (forward slashes).
 * They are checked out as plain files (`core.symlinks=false`) or empty folders and must not be read as sources.
 * Only files matching {@link sparseCheckoutPatterns} of the subdirectory are listed.
 */
export async function listGitSpecialFiles(
  runGit: GitRunner,
  dir: string,
  subdir: string,
  options: GitCommandOptions,
): Promise<Set<string>> {
  // only files that may be read (sources and JSON configs of the subdirectory): small output in large repositories
  const pathspecs = sparseCheckoutPatterns(subdir).map(pattern => `:(glob)${pattern.slice(1)}`)
  const output = await runGit(['-C', dir, 'ls-files', '--stage', '-z', '--', ...pathspecs], options)
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
