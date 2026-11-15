// Node-only: installer of git dependencies (system git, shallow fetch, sparse checkout).
// Imported only from `node.ts` (Node entry), never from the browser entry.
import { type GitRepositoryUrl, isLikeC4JsonConfig, parseGitRepositoryUrl } from '@likec4/config'
import type { Cancellation } from 'langium'
import { lstat, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { logger as rootLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { type GitDependencyInstance, normalizeGitSubdir } from '../workspace/dependency-uri'
import {
  type GitRunner,
  createGitRunner,
  fetchGitCommit,
  isValidGitRef,
  listGitSpecialFiles,
  refAsFullSha,
} from './git'
import type {
  DependencyCacheEntry,
  DependencyInstaller,
  DependencyInstallOptions,
  DependencyInstallResult,
  GitDependencySource,
} from './types'
import { createDependencyVersionRecord, knownDependencyVersion, resolveDependencyVersion } from './versions'

const logger = rootLogger.getChild(['dependencies', 'install'])

/**
 * Maximum number of files of one instance
 */
export const MAX_DEPENDENCY_FILES = 10_000

/**
 * Maximum total size of files of one instance (bytes)
 */
export const MAX_DEPENDENCY_SIZE = 64 * 1024 * 1024

/**
 * Default deadline of one install, all git commands included (milliseconds)
 */
export const DEPENDENCY_INSTALL_DEADLINE = 10 * 60 * 1000

/**
 * Prefix of temporary checkout directories
 */
export const TEMP_DIR_PREFIX = 'likec4-git-'

/**
 * Temporary directories older than this are removed when the installer starts (milliseconds)
 */
const STALE_TEMP_DIR_AGE = 24 * 60 * 60 * 1000

const SOURCE_EXTENSIONS = ['.c4', '.likec4']

// Characters of a subdirectory that would change the meaning of a sparse checkout pattern
// eslint-disable-next-line no-control-regex
const UNSAFE_SUBDIR_REGEX = /[*?[\]\\!#\x00-\x1f\x7f]/

const CANCELLED = 'Installation was cancelled'

/**
 * Options of {@link GitDependencyInstaller}
 */
export interface GitDependencyInstallerOptions {
  /**
   * Runs git commands. Default: the system git ({@link createGitRunner})
   */
  runGit?: GitRunner | undefined
  /**
   * Maps the validated repository URL to the URL passed to git.
   * Default: {@link gitRemoteUrl}, the URL rebuilt from its parsed parts.
   */
  remoteUrl?: ((url: GitRepositoryUrl, source: GitDependencySource) => string) | undefined
  /**
   * Parent directory of temporary checkouts
   * @default os.tmpdir()
   */
  tempDir?: string | undefined
  /**
   * Deadline of one install (milliseconds)
   * @default DEPENDENCY_INSTALL_DEADLINE
   */
  deadline?: number | undefined
  /**
   * Current time (for `resolvedAt` of the version index)
   */
  now?: (() => Date) | undefined
}

/**
 * Validated git source, see {@link validateGitDependencySource}
 */
export interface ValidatedGitDependencySource {
  source: GitDependencySource
  url: GitRepositoryUrl
  /**
   * Ref without surrounding whitespace, full SHAs in lower case
   */
  ref: string
  /**
   * Normalized subdirectory (`''` for the repository root)
   */
  subdir: string
}

const SCHEME_USERINFO_REGEX = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#]*)@/i

/**
 * Removes the password (token) from a URL: `https://user:token@host/...` -> `https://user@host/...`.
 * URLs without credentials are returned as is (trimmed).
 */
export function stripGitUrlCredentials(url: string): string {
  return url.trim().replace(SCHEME_USERINFO_REGEX, (_, scheme: string, userinfo: string) => {
    const colon = userinfo.indexOf(':')
    return colon < 0 ? `${scheme}${userinfo}@` : `${scheme}${userinfo.slice(0, colon)}@`
  })
}

/**
 * Removes the user information from a URL for messages and logs:
 * `https://user:token@host/...` -> `https://***@host/...`.
 */
export function redactGitUrl(url: string): string {
  return url.replace(SCHEME_USERINFO_REGEX, '$1***@')
}

/**
 * URL passed to git: rebuilt from the parsed parts (protocol, user, host, port, path),
 * so the host git connects to is always the host of the repository identity (`url.id`).
 * The `.git` suffix is kept as written, passwords are never included.
 *
 * @param raw the URL as written in the config (accepted by `parseGitRepositoryUrl`)
 */
export function gitRemoteUrl(url: GitRepositoryUrl, raw: string): string {
  const value = raw.trim()
  const suffix = value.replace(/\/+$/, '').toLowerCase().endsWith('.git') ? '.git' : ''
  const port = url.port !== undefined ? `:${url.port}` : ''
  switch (url.protocol) {
    case 'scp': {
      const user = /^([^@/:\s]+)@/.exec(value)?.[1]
      return `${user ? `${user}@` : ''}${url.host}:${url.path}${suffix}`
    }
    case 'https':
    case 'ssh': {
      const user = new URL(value).username
      const path = url.path.split('/').map(encodeURIComponent).join('/')
      return `${url.protocol}://${user ? `${user}@` : ''}${url.host}${port}/${path}${suffix}`
    }
  }
}

/**
 * Validates the git source again, independently of the validation of the config:
 * the URL must be `https://`, `ssh://` or scp-like without credentials (`parseGitRepositoryUrl`),
 * the ref must be safe for git ({@link isValidGitRef}), the path must be a relative subdirectory.
 *
 * Returns the error message if the source is invalid.
 */
export function validateGitDependencySource(source: GitDependencySource): ValidatedGitDependencySource | string {
  if (typeof source.git !== 'string' || typeof source.ref !== 'string') {
    return 'Invalid git dependency source'
  }
  const url = parseGitRepositoryUrl(source.git)
  if (!url) {
    return `Invalid git repository URL ${
      JSON.stringify(redactGitUrl(source.git))
    }: only https://, ssh:// and git@host:org/repo.git without credentials are allowed`
  }
  const trimmed = source.ref.trim()
  if (!isValidGitRef(trimmed)) {
    return `Invalid git ref ${JSON.stringify(source.ref)}`
  }
  const ref = refAsFullSha(trimmed) ?? trimmed
  let subdir: string
  try {
    subdir = normalizeGitSubdir(source.path)
  } catch {
    return `Invalid path ${JSON.stringify(source.path)}: must be a subdirectory of the repository`
  }
  if (UNSAFE_SUBDIR_REGEX.test(subdir) || subdir.split('/').some(s => s.startsWith('-'))) {
    return `Invalid path ${JSON.stringify(source.path)}: unsupported characters`
  }
  return { source, url, ref, subdir }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isSourceFile(name: string): boolean {
  const lower = name.toLowerCase()
  return SOURCE_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/**
 * Reads files of the instance from the checkout: `.c4` and `.likec4` documents at any depth,
 * JSON config files (`isLikeC4JsonConfig`) at the root of the instance only.
 * Executable configs, images and other files are skipped; symbolic links are never followed.
 * Sizes are checked before files are read.
 *
 * @param root folder of the instance
 * @param skip paths relative to `root` to skip (e.g. symbolic links checked out as plain files)
 * @returns files by path relative to `root` (forward slashes)
 * @throws if there are more than {@link MAX_DEPENDENCY_FILES} files or {@link MAX_DEPENDENCY_SIZE} bytes
 */
export async function collectDependencyFiles(
  root: string,
  skip: ReadonlySet<string> = new Set(),
): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  let count = 0
  let size = 0
  const walk = async (dir: string, prefix: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const path = join(dir, entry.name)
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      switch (true) {
        case entry.isDirectory(): {
          if (entry.name !== '.git') {
            await walk(path, relative)
          }
          break
        }
        // symbolic links, sockets, ...
        case !entry.isFile() || skip.has(relative):
          break
        case isSourceFile(entry.name) || (prefix === '' && isLikeC4JsonConfig(entry.name)): {
          const stats = await lstat(path)
          if (!stats.isFile()) {
            break
          }
          count++
          size += stats.size
          if (count > MAX_DEPENDENCY_FILES || size > MAX_DEPENDENCY_SIZE) {
            throw new Error(
              `Dependency is too large (more than ${MAX_DEPENDENCY_FILES} files or ${MAX_DEPENDENCY_SIZE} bytes)`,
            )
          }
          files[relative] = await readFile(path, 'utf8')
          break
        }
      }
    }
  }
  await walk(root, '')
  return files
}

/**
 * Removes temporary checkouts left by killed processes (older than a day). Best effort.
 */
async function removeStaleTempDirs(parent: string): Promise<void> {
  const entries = await readdir(parent, { withFileTypes: true }).catch(() => [])
  const now = Date.now()
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(TEMP_DIR_PREFIX)) {
      continue
    }
    const path = join(parent, entry.name)
    try {
      const stats = await lstat(path)
      if (now - stats.mtimeMs > STALE_TEMP_DIR_AGE) {
        await rm(path, { recursive: true, force: true, maxRetries: 3 })
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Run of an install shared by concurrent callers with the same source
 */
interface InstallRun {
  readonly update: boolean
  readonly controller: AbortController
  /**
   * Callers that can still cancel (have a cancellation token and did not cancel yet)
   */
  cancellable: number
  /**
   * Callers without a cancellation token: the run is never aborted while they wait
   */
  pinned: number
  promise: Promise<DependencyInstallResult>
}

/**
 * Installer of git dependencies for Node hosts.
 *
 * `install`:
 * 1. validates the source again ({@link validateGitDependencySource}), before git is run;
 * 2. resolves the ref to a commit SHA: the version index, a full SHA as is, or `git ls-remote`
 *    (always with `update`), see `resolveDependencyVersion`;
 * 3. if the instance is in the storage, only the version index is written (git is not run at all
 *    when the SHA is known without the remote);
 * 4. otherwise downloads the commit into a temporary directory (shallow partial fetch, sparse checkout of the path),
 *    writes `.c4`, `.likec4` files and the JSON config to the storage with one write,
 *    then writes the version index; the temporary directory is removed in any case.
 *
 * Failures leave the storage and the version index unchanged.
 * Installs of the same source (repository, ref, path) are serialized: concurrent calls join the running install,
 * an `update` waits for a running install and then runs. A caller that cancels gets `failed` at once;
 * the shared run is aborted only when all its callers cancelled. Each run has a deadline.
 */
export class GitDependencyInstaller implements DependencyInstaller {
  readonly supported: boolean = true

  readonly #runGit: GitRunner
  readonly #remoteUrl: (url: GitRepositoryUrl, source: GitDependencySource) => string
  readonly #tempDir: string | undefined
  readonly #deadline: number
  readonly #now: () => Date
  readonly #runs = new Map<string, InstallRun>()
  #sweep: Promise<void> | undefined

  constructor(protected services: LikeC4SharedServices, options?: GitDependencyInstallerOptions) {
    this.#runGit = options?.runGit ?? createGitRunner()
    this.#remoteUrl = options?.remoteUrl ?? ((url, source) => gitRemoteUrl(url, source.git))
    this.#tempDir = options?.tempDir
    this.#deadline = options?.deadline ?? DEPENDENCY_INSTALL_DEADLINE
    this.#now = options?.now ?? (() => new Date())
  }

  /**
   * Installs the git source. Never throws: errors are returned as `failed`.
   */
  install(source: GitDependencySource, options?: DependencyInstallOptions): Promise<DependencyInstallResult> {
    const validated = validateGitDependencySource(source)
    if (typeof validated === 'string') {
      logger.warn(validated)
      return Promise.resolve({ status: 'failed', error: validated })
    }
    const update = options?.update === true
    const key = JSON.stringify([validated.url.id, validated.ref, validated.subdir])
    let run = this.#runs.get(key)
    // join a running install, unless this is an update and the running one is not, or it was aborted
    if (!run || (update && !run.update) || run.controller.signal.aborted) {
      run = this.#startRun(key, validated, update, run?.promise)
    }
    return this.#wait(run, options?.cancelToken)
  }

  #startRun(
    key: string,
    validated: ValidatedGitDependencySource,
    update: boolean,
    previous: Promise<DependencyInstallResult> | undefined,
  ): InstallRun {
    const controller = new AbortController()
    const run: InstallRun = {
      update,
      controller,
      cancellable: 0,
      pinned: 0,
      promise: Promise.resolve({ status: 'unsupported' }),
    }
    run.promise = (async (): Promise<DependencyInstallResult> => {
      if (previous) {
        await previous
      }
      if (controller.signal.aborted) {
        return { status: 'failed', error: CANCELLED }
      }
      this.#sweep ??= removeStaleTempDirs(this.#tempDir ?? tmpdir())
      await this.#sweep
      return await this.#withDeadline(controller, signal => this.#install(validated, update, signal))
    })()
      .catch((error: unknown): DependencyInstallResult => {
        const message = errorMessage(error)
        logger.warn(`Failed to install ${validated.url.id}#${validated.ref}: ${message}`)
        return { status: 'failed', error: message }
      })
      .finally(() => {
        if (this.#runs.get(key) === run) {
          this.#runs.delete(key)
        }
      })
    this.#runs.set(key, run)
    return run
  }

  async #withDeadline<T>(controller: AbortController, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, this.#deadline)
    try {
      return await fn(controller.signal)
    } catch (error) {
      if (timedOut) {
        throw new Error(`Installation timed out after ${Math.round(this.#deadline / 1000)}s`)
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  #wait(run: InstallRun, token: Cancellation.CancellationToken | undefined): Promise<DependencyInstallResult> {
    if (!token) {
      run.pinned++
      return run.promise
    }
    if (token.isCancellationRequested) {
      this.#cancelWaiter(run, false)
      return Promise.resolve({ status: 'failed', error: CANCELLED })
    }
    run.cancellable++
    return new Promise<DependencyInstallResult>(resolve => {
      let done = false
      const listener = token.onCancellationRequested(() => {
        if (done) {
          return
        }
        done = true
        listener.dispose()
        resolve({ status: 'failed', error: CANCELLED })
        this.#cancelWaiter(run, true)
      })
      void run.promise.then(result => {
        if (done) {
          return
        }
        done = true
        listener.dispose()
        resolve(result)
      })
    })
  }

  #cancelWaiter(run: InstallRun, counted: boolean): void {
    if (counted) {
      run.cancellable--
    }
    if (run.cancellable <= 0 && run.pinned === 0) {
      run.controller.abort()
    }
  }

  async #install(
    { source, url, ref, subdir }: ValidatedGitDependencySource,
    update: boolean,
    signal: AbortSignal,
  ): Promise<DependencyInstallResult> {
    const storage = this.services.dependencies.Storage
    const repository = url.id
    // never store credentials
    const storedUrl = stripGitUrlCredentials(source.git)
    const writeVersion = (sha: string) =>
      storage.writeVersion(createDependencyVersionRecord({
        repository,
        url: storedUrl,
        ref,
        sha,
        resolvedAt: this.#now(),
      }))
    const throwIfAborted = () => {
      if (signal.aborted) {
        throw new Error(CANCELLED)
      }
    }

    // SHA known without the remote and the instance is installed: git is not run
    if (!update || refAsFullSha(ref)) {
      const known = await knownDependencyVersion(storage, repository, ref)
      if (known) {
        const instance: GitDependencyInstance = { repository, sha: known.sha, subdir }
        const entry = await storage.readEntry(instance)
        if (entry) {
          if (known.source === 'sha') {
            await writeVersion(known.sha)
          }
          return { status: 'installed', instance, files: Object.keys(entry.files).length, cached: true }
        }
      }
    }

    throwIfAborted()
    const remote = this.#remoteUrl(url, source)
    const temp = await mkdtemp(join(this.#tempDir ?? tmpdir(), TEMP_DIR_PREFIX))
    // git runs in the temporary directory, never in the checkout
    const gitOptions = { cwd: temp, signal }
    try {
      const resolved = await resolveDependencyVersion({
        storage,
        runGit: this.#runGit,
        repository,
        remote,
        ref,
        update,
        ...gitOptions,
      })
      const existing = await storage.readEntry({ repository, sha: resolved.sha, subdir })
      if (existing) {
        if (resolved.source !== 'index') {
          await writeVersion(resolved.sha)
        }
        return {
          status: 'installed',
          instance: { repository, sha: resolved.sha, subdir },
          files: Object.keys(existing.files).length,
          cached: true,
        }
      }

      const checkout = join(temp, 'repo')
      await mkdir(checkout)
      logger.debug`fetching ${repository} at ${resolved.sha}`
      // the ref may move between ls-remote and fetch: the fetched commit wins
      const sha = await fetchGitCommit(this.#runGit, {
        remote,
        what: resolved.refName ?? resolved.sha,
        shaLength: resolved.sha.length,
        subdir,
        dir: checkout,
      }, gitOptions)

      const root = subdir ? join(checkout, ...subdir.split('/')) : checkout
      const stats = await lstat(root).catch(() => undefined)
      if (!stats?.isDirectory()) {
        throw new Error(`Path ${JSON.stringify(subdir)} not found at ${sha}`)
      }
      const prefix = subdir ? `${subdir}/` : ''
      const special = await listGitSpecialFiles(this.#runGit, checkout, gitOptions)
      const skip = new Set([...special].filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length)))
      const files = await collectDependencyFiles(root, skip)
      const count = Object.keys(files).length
      if (!Object.keys(files).some(isSourceFile)) {
        throw new Error(
          `No .c4 or .likec4 files in ${repository}${subdir ? ` (path ${JSON.stringify(subdir)})` : ''} at ${sha}`,
        )
      }
      throwIfAborted()
      const entry: DependencyCacheEntry = {
        format: 1,
        repository,
        url: storedUrl,
        sha,
        subdir,
        files,
      }
      // one write: the instance is either installed completely or not at all
      await storage.writeEntry(entry)
      if (resolved.source !== 'index' || sha !== resolved.sha) {
        await writeVersion(sha)
      }
      logger.info`installed ${repository}#${ref} at ${sha} (${count} files)`
      return { status: 'installed', instance: { repository, sha, subdir }, files: count, cached: false }
    } finally {
      await rm(temp, { recursive: true, force: true, maxRetries: 3 }).catch((error: unknown) => {
        logger.warn(`Failed to remove temporary directory ${temp}: ${errorMessage(error)}`)
      })
    }
  }
}

/**
 * Creates the installer of git dependencies for Node hosts
 * (`dependencyInstaller` of {@link WithNodeDependencies}).
 */
export function createGitDependencyInstaller(
  services: LikeC4SharedServices,
  options?: GitDependencyInstallerOptions,
): DependencyInstaller {
  return new GitDependencyInstaller(services, options)
}
