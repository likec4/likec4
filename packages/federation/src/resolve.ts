import type { FederationConfig } from '@likec4/config'
import type { FederationManifest } from '@likec4/core/types'
import { createFederatedRegistry } from './federated-registry'
import { type RegistryReader, createLocalRegistry } from './registry'
import { parseRange } from './version'

export interface ResolvedDependencies {
  [projectName: string]: FederationManifest
}

export interface ResolveOptions {
  /** Override the registry reader (for testing) */
  registry?: (source: string) => RegistryReader
  /** Override the federated registry reader (for testing) */
  federatedRegistry?: (source: string) => { readManifest(name: string): Promise<FederationManifest> }
}

/**
 * Resolve all federation dependencies from config.
 * Supports both semver-based (version present) and federated registry (no version) resolution.
 */
export async function resolveDependencies(
  config: FederationConfig,
  options?: ResolveOptions,
): Promise<ResolvedDependencies> {
  const deps = config.dependencies
  if (!deps) return {}

  const createSemverRegistry = options?.registry ?? createLocalRegistry
  const resolved: ResolvedDependencies = {}

  for (const [name, dep] of Object.entries(deps)) {
    if (dep.version) {
      // Semver-based resolution
      const range = parseRange(dep.version)
      if (!range) {
        throw new Error(`Invalid semver range "${dep.version}" for dependency "${name}"`)
      }

      const registry = createSemverRegistry(dep.source)
      const manifest = await registry.findMatch(name, range)

      if (!manifest) {
        const versions = await registry.listVersions(name)
        const available = versions.length > 0
          ? `Available versions: ${versions.map(v => `${v.major}.${v.minor}.${v.patch}`).join(', ')}`
          : 'No versions found'
        throw new Error(
          `No matching version found for "${name}@${dep.version}" in ${dep.source}. ${available}`,
        )
      }

      if (manifest.name !== name) {
        throw new Error(
          `Manifest name mismatch: expected "${name}" but got "${manifest.name}" from ${dep.source}`,
        )
      }

      resolved[name] = manifest
    } else {
      // Federated registry resolution — always read latest manifest
      const registry = options?.federatedRegistry
        ? options.federatedRegistry(dep.source)
        : createFederatedRegistry(dep.source)
      const manifest = await registry.readManifest(name)

      if (manifest.name !== name) {
        throw new Error(
          `Manifest name mismatch: expected "${name}" but got "${manifest.name}" from ${dep.source}`,
        )
      }

      resolved[name] = manifest
    }
  }

  return resolved
}
