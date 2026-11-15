// Contracts of git dependencies.
// Everything here is browser-safe: Node-only code (git, file system) is wired by Node hosts through the module context.
import { UnsupportedDependencyInstaller } from './DependencyInstaller'
import { createMemoryDependencyStorage } from './storage'
import type { DependenciesModuleContext } from './types'

export * from './cache-dir'
export * from './DependencyInstaller'
export * from './DependencyStates'
export * from './DependencyStorage'
export * from './storage'
export type * from './types'
export * from './version-index'

/**
 * Default dependencies context: in-memory storage, installing is not supported.
 */
export const NoDependencies: DependenciesModuleContext = {
  dependencyStorage: () => createMemoryDependencyStorage(),
  dependencyInstaller: () => new UnsupportedDependencyInstaller(),
}
