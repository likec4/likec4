import type { FederationManifest } from '@likec4/core/types'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type SemVer, type SemVerRange, findBestMatch, parseSemVer, semVerToString } from './version'

export interface RegistryReader {
  /** List all available versions for a project */
  listVersions(projectName: string): Promise<SemVer[]>
  /** Read a specific version manifest */
  readManifest(projectName: string, version: SemVer): Promise<FederationManifest>
  /** Find the best matching version for a semver range */
  findMatch(projectName: string, range: SemVerRange): Promise<FederationManifest | null>
}

/**
 * Read manifests from a local directory structure:
 * ```
 * <registryDir>/
 *   <project-name>/
 *     1.0.0.json
 *     1.1.0.json
 * ```
 */
export function createLocalRegistry(registryDir: string): RegistryReader {
  return {
    async listVersions(projectName: string): Promise<SemVer[]> {
      const projectDir = join(registryDir, projectName)
      let entries: string[]
      try {
        entries = await readdir(projectDir)
      } catch {
        return []
      }
      const versions: SemVer[] = []
      for (const entry of entries) {
        if (!entry.endsWith('.json')) continue
        const versionStr = entry.slice(0, -5) // remove .json
        const parsed = parseSemVer(versionStr)
        if (parsed) {
          versions.push(parsed)
        }
      }
      return versions
    },

    async readManifest(projectName: string, version: SemVer): Promise<FederationManifest> {
      const filePath = join(registryDir, projectName, `${semVerToString(version)}.json`)
      const content = await readFile(filePath, 'utf-8')
      const manifest = JSON.parse(content) as FederationManifest
      if (manifest.schema !== 'likec4/federation/v1') {
        throw new Error(
          `Unsupported manifest schema "${manifest.schema}" in ${filePath}. Expected "likec4/federation/v1".`,
        )
      }
      return manifest
    },

    async findMatch(projectName: string, range: SemVerRange): Promise<FederationManifest | null> {
      const versions = await this.listVersions(projectName)
      const best = findBestMatch(versions, range)
      if (!best) return null
      return this.readManifest(projectName, best)
    },
  }
}
