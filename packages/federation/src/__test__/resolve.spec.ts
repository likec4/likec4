import type { FederationConfig } from '@likec4/config'
import type { FederationManifest } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { RegistryReader } from '../registry'
import { resolveDependencies } from '../resolve'
import { parseSemVer } from '../version'

function createMockManifest(name: string, version: string): FederationManifest {
  return {
    schema: 'likec4/federation/v1',
    name,
    version,
    specification: { elements: {} },
    elements: {},
    relations: {},
    project: { id: name },
  }
}

function createMockRegistry(manifests: Record<string, FederationManifest[]>): (source: string) => RegistryReader {
  return (_source: string) => ({
    async listVersions(projectName: string) {
      const list = manifests[projectName] ?? []
      return list.map(m => parseSemVer(m.version ?? '')!).filter(Boolean)
    },
    async readManifest(projectName: string, version) {
      const list = manifests[projectName] ?? []
      const found = list.find(m => m.version === `${version.major}.${version.minor}.${version.patch}`)
      if (!found) {
        throw new Error(`Manifest not found: ${projectName}@${version.major}.${version.minor}.${version.patch}`)
      }
      return found
    },
    async findMatch(projectName: string, range) {
      const versions = await this.listVersions(projectName)
      const { findBestMatch } = await import('../version')
      const best = findBestMatch(versions, range)
      if (!best) return null
      return this.readManifest(projectName, best)
    },
  })
}

describe('resolveDependencies', () => {
  it('resolves dependencies from config', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
          version: '^1.0.0',
        },
      },
    }

    const registry = createMockRegistry({
      'auth-service': [
        createMockManifest('auth-service', '1.0.0'),
        createMockManifest('auth-service', '1.1.0'),
      ],
    })

    const result = await resolveDependencies(config, { registry })
    expect(result['auth-service']).toBeDefined()
    expect(result['auth-service']!.version).toBe('1.1.0')
  })

  it('returns empty object when no dependencies', async () => {
    const config: FederationConfig = {}
    const result = await resolveDependencies(config)
    expect(result).toEqual({})
  })

  it('throws for invalid semver range', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
          version: 'invalid',
        },
      },
    }

    await expect(resolveDependencies(config)).rejects.toThrow('Invalid semver range')
  })

  it('throws when no matching version found', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
          version: '^3.0.0',
        },
      },
    }

    const registry = createMockRegistry({
      'auth-service': [
        createMockManifest('auth-service', '1.0.0'),
      ],
    })

    await expect(resolveDependencies(config, { registry }))
      .rejects.toThrow('No matching version found')
  })

  it('throws on manifest name mismatch', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
          version: '^1.0.0',
        },
      },
    }

    const registry = createMockRegistry({
      'auth-service': [
        createMockManifest('wrong-name', '1.0.0'),
      ],
    })

    await expect(resolveDependencies(config, { registry }))
      .rejects.toThrow('Manifest name mismatch')
  })

  it('resolves multiple dependencies', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/registry',
          version: '^1.0.0',
        },
        'payments': {
          source: '/registry',
          version: '~2.0.0',
        },
      },
    }

    const registry = createMockRegistry({
      'auth-service': [
        createMockManifest('auth-service', '1.0.0'),
        createMockManifest('auth-service', '1.2.0'),
      ],
      'payments': [
        createMockManifest('payments', '2.0.0'),
        createMockManifest('payments', '2.0.5'),
        createMockManifest('payments', '2.1.0'),
      ],
    })

    const result = await resolveDependencies(config, { registry })
    expect(result['auth-service']!.version).toBe('1.2.0')
    expect(result['payments']!.version).toBe('2.0.5')
  })

  it('resolves versionless dependencies (no version)', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
        },
      },
    }

    const mockManifest = createMockManifest('auth-service', '1.0.0')
    const federatedRegistry = (_source: string) => ({
      async readManifest(name: string) {
        if (name === 'auth-service') return mockManifest
        throw new Error('Not found')
      },
    })

    const result = await resolveDependencies(config, { federatedRegistry })
    expect(result['auth-service']).toBeDefined()
    expect(result['auth-service']!.name).toBe('auth-service')
  })

  it('throws on name mismatch in versionless resolution', async () => {
    const config: FederationConfig = {
      dependencies: {
        'auth-service': {
          source: '/some/registry',
        },
      },
    }

    const federatedRegistry = (_source: string) => ({
      async readManifest(_name: string) {
        return createMockManifest('wrong-name', '1.0.0')
      },
    })

    await expect(resolveDependencies(config, { federatedRegistry }))
      .rejects.toThrow('Manifest name mismatch')
  })
})
