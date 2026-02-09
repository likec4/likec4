import type { FederationManifest } from '@likec4/core/types'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalRegistry } from '../registry'
import { parseRange, parseSemVer } from '../version'

function createTestManifest(name: string, version: string): FederationManifest {
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

describe('createLocalRegistry', () => {
  let registryDir: string

  beforeEach(async () => {
    registryDir = join(tmpdir(), `likec4-registry-test-${Date.now()}`)
    await mkdir(join(registryDir, 'test-project'), { recursive: true })
    await writeFile(
      join(registryDir, 'test-project', '1.0.0.json'),
      JSON.stringify(createTestManifest('test-project', '1.0.0')),
    )
    await writeFile(
      join(registryDir, 'test-project', '1.1.0.json'),
      JSON.stringify(createTestManifest('test-project', '1.1.0')),
    )
    await writeFile(
      join(registryDir, 'test-project', '2.0.0.json'),
      JSON.stringify(createTestManifest('test-project', '2.0.0')),
    )
  })

  afterEach(async () => {
    await rm(registryDir, { recursive: true, force: true })
  })

  describe('listVersions', () => {
    it('lists available versions', async () => {
      const registry = createLocalRegistry(registryDir)
      const versions = await registry.listVersions('test-project')
      expect(versions).toHaveLength(3)
      expect(versions).toContainEqual(parseSemVer('1.0.0'))
      expect(versions).toContainEqual(parseSemVer('1.1.0'))
      expect(versions).toContainEqual(parseSemVer('2.0.0'))
    })

    it('returns empty array for non-existent project', async () => {
      const registry = createLocalRegistry(registryDir)
      const versions = await registry.listVersions('non-existent')
      expect(versions).toEqual([])
    })
  })

  describe('readManifest', () => {
    it('reads a valid manifest', async () => {
      const registry = createLocalRegistry(registryDir)
      const manifest = await registry.readManifest('test-project', parseSemVer('1.0.0')!)
      expect(manifest.schema).toBe('likec4/federation/v1')
      expect(manifest.name).toBe('test-project')
      expect(manifest.version).toBe('1.0.0')
    })

    it('throws for unsupported schema version', async () => {
      await writeFile(
        join(registryDir, 'test-project', '3.0.0.json'),
        JSON.stringify({ ...createTestManifest('test-project', '3.0.0'), schema: 'likec4/federation/v99' }),
      )
      const registry = createLocalRegistry(registryDir)
      await expect(registry.readManifest('test-project', parseSemVer('3.0.0')!))
        .rejects.toThrow('Unsupported manifest schema')
    })
  })

  describe('findMatch', () => {
    it('finds best match for caret range', async () => {
      const registry = createLocalRegistry(registryDir)
      const manifest = await registry.findMatch('test-project', parseRange('^1.0.0')!)
      expect(manifest).not.toBeNull()
      expect(manifest!.version).toBe('1.1.0')
    })

    it('finds best match for exact version', async () => {
      const registry = createLocalRegistry(registryDir)
      const manifest = await registry.findMatch('test-project', parseRange('2.0.0')!)
      expect(manifest).not.toBeNull()
      expect(manifest!.version).toBe('2.0.0')
    })

    it('returns null when no match found', async () => {
      const registry = createLocalRegistry(registryDir)
      const manifest = await registry.findMatch('test-project', parseRange('^3.0.0')!)
      expect(manifest).toBeNull()
    })
  })
})
