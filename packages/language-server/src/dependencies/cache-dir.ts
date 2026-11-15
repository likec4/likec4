/**
 * Environment variable that overrides the cache directory of LikeC4.
 * Git dependencies are stored in its `dependencies` subdirectory (see {@link dependencyCacheDir}).
 */
export const LIKEC4_CACHE_DIR_ENV = 'LIKEC4_CACHE_DIR'

/**
 * Name of the subdirectory of the cache directory with git dependencies
 */
export const DEPENDENCIES_CACHE_SUBDIR = 'dependencies'

/**
 * Parameters of {@link dependencyCacheDir}: the environment of the Node process.
 */
export interface DependencyCacheDirParams {
  /**
   * `process.env`
   */
  env: Readonly<Record<string, string | undefined>>
  /**
   * `process.platform`
   */
  platform: string
  /**
   * `os.homedir()`
   */
  homedir: string
  /**
   * `process.cwd()`: base of a relative `LIKEC4_CACHE_DIR`.
   * Without it, a relative `LIKEC4_CACHE_DIR` is rejected.
   */
  cwd?: string | undefined
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isAbsolutePath(platform: string, path: string): boolean {
  return platform === 'win32'
    ? /^[A-Za-z]:[\\/]/.test(path) || /^[\\/]{2}/.test(path)
    : path.startsWith('/')
}

/**
 * Value of an environment variable with an absolute path, undefined if it is not set or relative
 * (relative values are ignored, as the XDG Base Directory specification requires for `XDG_CACHE_HOME`).
 */
function absoluteEnv(platform: string, value: string | undefined): string | undefined {
  const path = nonEmpty(value)
  return path && isAbsolutePath(platform, path) ? path : undefined
}

function join(platform: string, ...segments: string[]): string {
  const separator = platform === 'win32' ? '\\' : '/'
  return segments
    .map((segment, index) => index === 0 ? segment.replace(/[\\/]+$/, '') : segment.replace(/^[\\/]+|[\\/]+$/g, ''))
    .filter(segment => segment.length > 0)
    .join(separator)
}

/**
 * Cache directory of LikeC4:
 * - `$LIKEC4_CACHE_DIR` if set; a relative value is resolved against `cwd` (rejected without `cwd`)
 * - Linux and others: `$XDG_CACHE_HOME/likec4` or `~/.cache/likec4`
 * - macOS: `~/Library/Caches/likec4`
 * - Windows: `%LOCALAPPDATA%\likec4\cache` or `~\AppData\Local\likec4\cache`
 *
 * Relative `XDG_CACHE_HOME` and `LOCALAPPDATA` are ignored.
 *
 * @throws if there is no override and the home directory is needed but empty (instead of returning a relative path),
 * or if `LIKEC4_CACHE_DIR` is relative and there is no `cwd`
 *
 * Pure function (no `node:*` imports): Node hosts pass `process.env`, `process.platform` and `os.homedir()`.
 */
export function likec4CacheDir({ env, platform, homedir, cwd }: DependencyCacheDirParams): string {
  const override = nonEmpty(env[LIKEC4_CACHE_DIR_ENV])
  if (override) {
    if (isAbsolutePath(platform, override)) {
      return override
    }
    const base = nonEmpty(cwd)
    if (!base || !isAbsolutePath(platform, base)) {
      throw new Error(`${LIKEC4_CACHE_DIR_ENV} must be an absolute path: ${override}`)
    }
    return join(platform, base, override)
  }
  const home = (): string => {
    const value = nonEmpty(homedir)
    if (!value) {
      throw new Error(
        `Cannot determine the LikeC4 cache directory: home directory is unknown, set ${LIKEC4_CACHE_DIR_ENV}`,
      )
    }
    return value
  }
  switch (true) {
    case platform === 'win32':
      return join(
        platform,
        absoluteEnv(platform, env['LOCALAPPDATA']) ?? join(platform, home(), 'AppData', 'Local'),
        'likec4',
        'cache',
      )
    case platform === 'darwin':
      return join(platform, home(), 'Library', 'Caches', 'likec4')
    default:
      return join(platform, absoluteEnv(platform, env['XDG_CACHE_HOME']) ?? join(platform, home(), '.cache'), 'likec4')
  }
}

/**
 * Directory of the dependency storage of Node hosts (the unstorage `fs` driver base):
 * `<cache directory>/dependencies`, see {@link likec4CacheDir}.
 */
export function dependencyCacheDir(params: DependencyCacheDirParams): string {
  return join(params.platform, likec4CacheDir(params), DEPENDENCIES_CACHE_SUBDIR)
}
