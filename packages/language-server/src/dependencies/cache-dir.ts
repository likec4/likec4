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
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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
 * - `$LIKEC4_CACHE_DIR` if set
 * - Linux and others: `$XDG_CACHE_HOME/likec4` or `~/.cache/likec4`
 * - macOS: `~/Library/Caches/likec4`
 * - Windows: `%LOCALAPPDATA%\likec4\cache` or `~\AppData\Local\likec4\cache`
 *
 * Pure function (no `node:*` imports): Node hosts pass `process.env`, `process.platform` and `os.homedir()`.
 */
export function likec4CacheDir({ env, platform, homedir }: DependencyCacheDirParams): string {
  const override = nonEmpty(env[LIKEC4_CACHE_DIR_ENV])
  if (override) {
    return override
  }
  switch (true) {
    case platform === 'win32':
      return join(
        platform,
        nonEmpty(env['LOCALAPPDATA']) ?? join(platform, homedir, 'AppData', 'Local'),
        'likec4',
        'cache',
      )
    case platform === 'darwin':
      return join(platform, homedir, 'Library', 'Caches', 'likec4')
    default:
      return join(platform, nonEmpty(env['XDG_CACHE_HOME']) ?? join(platform, homedir, '.cache'), 'likec4')
  }
}

/**
 * Directory of the dependency storage of Node hosts (the unstorage `fs` driver base):
 * `<cache directory>/dependencies`, see {@link likec4CacheDir}.
 */
export function dependencyCacheDir(params: DependencyCacheDirParams): string {
  return join(params.platform, likec4CacheDir(params), DEPENDENCIES_CACHE_SUBDIR)
}
