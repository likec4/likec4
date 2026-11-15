// Node-only entry of git dependencies: file system storage and git installer.
// Not re-exported from `./index.ts`: imported only from the Node entry (`src/index.ts`),
// never reachable from the browser entry (`src/browser`).
import { homedir } from 'node:os'
import { createStorage } from 'unstorage'
import fsLiteDriver from 'unstorage/drivers/fs-lite'
import { dependencyCacheDir } from './cache-dir'
import { createGitDependencyInstaller } from './install'
import { lazyDriver } from './lazy-driver'
import type { DependenciesModuleContext } from './types'

/**
 * Options of {@link WithNodeDependencies}
 */
export interface NodeDependenciesOptions {
  /**
   * Directory of the dependency storage.
   * Default: {@link dependencyCacheDir} of the process (`$LIKEC4_CACHE_DIR/dependencies`, or the user cache directory)
   */
  cacheDir?: string | undefined
}

/**
 * Dependencies context of Node hosts:
 * - storage: unstorage `fs-lite` driver in the cache directory.
 *   Lazy: the directory is resolved (and created by the driver on first write) only when the storage is used.
 * - installer: git installer (see `install.ts`)
 *
 * @example
 * ```ts
 * createLanguageServices({ ...WithFileSystem(), ...WithNodeDependencies() })
 * ```
 */
export function WithNodeDependencies(options?: NodeDependenciesOptions): DependenciesModuleContext {
  return {
    dependencyStorage: () =>
      createStorage({
        driver: lazyDriver('fs-lite', () =>
          fsLiteDriver({
            base: options?.cacheDir ?? dependencyCacheDir({
              env: process.env,
              platform: process.platform,
              homedir: homedir(),
              cwd: process.cwd(),
            }),
          })),
      }),
    dependencyInstaller: services => createGitDependencyInstaller(services),
  }
}
