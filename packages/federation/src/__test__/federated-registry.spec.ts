import type { FederationManifest } from '@likec4/core/types'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFederatedRegistry } from '../federated-registry'

function createTestManifest(name: string): FederationManifest {
  return {
    schema: 'likec4/federation/v1',
    name,
    specification: { elements: {} },
    elements: {
      [`${name}Root`]: {
        id: `${name}Root`,
        kind: 'service',
        title: `${name} Root`,
        style: {},
      },
    } as FederationManifest['elements'],
    relations: {},
    project: { id: name },
  } as FederationManifest
}

describe('createFederatedRegistry', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'federated-registry-test-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('publishes manifest and creates registry.json', async () => {
    const registry = createFederatedRegistry(tmpDir)
    const manifest = createTestManifest('auth-service')
    await registry.publishManifest('auth-service', manifest)

    // Verify manifest was written
    const manifestContent = await readFile(join(tmpDir, 'auth-service', 'manifest.json'), 'utf-8')
    const written = JSON.parse(manifestContent)
    expect(written.name).toBe('auth-service')
    expect(written.schema).toBe('likec4/federation/v1')

    // Verify registry.json was updated
    const registryContent = await readFile(join(tmpDir, 'registry.json'), 'utf-8')
    const reg = JSON.parse(registryContent)
    expect(reg.providers['auth-service']).toBeDefined()
    expect(reg.providers['auth-service'].lastPublished).toBeTruthy()
  })

  it('reads published manifest', async () => {
    const registry = createFederatedRegistry(tmpDir)
    const manifest = createTestManifest('auth-service')
    await registry.publishManifest('auth-service', manifest)

    const read = await registry.readManifest('auth-service')
    expect(read.name).toBe('auth-service')
    expect(read.elements['auth-serviceRoot']).toBeDefined()
  })

  it('reads registry with providers and consumers', async () => {
    const registry = createFederatedRegistry(tmpDir)
    await registry.publishManifest('auth-service', createTestManifest('auth-service'))
    await registry.syncConsumer('platform', { 'auth-service': ['auth-serviceRoot'] })

    const reg = await registry.readRegistry()
    expect(reg.schema).toBe('likec4/registry/v1')
    expect(reg.providers['auth-service']).toBeDefined()
    expect(reg.consumers['platform']).toBeDefined()
    expect(reg.consumers['platform']!.imports['auth-service']).toEqual(['auth-serviceRoot'])
  })

  it('returns empty registry when registry.json is missing', async () => {
    const registry = createFederatedRegistry(tmpDir)
    const reg = await registry.readRegistry()
    expect(reg.schema).toBe('likec4/registry/v1')
    expect(Object.keys(reg.providers)).toHaveLength(0)
    expect(Object.keys(reg.consumers)).toHaveLength(0)
  })

  it('throws when reading non-existent manifest', async () => {
    const registry = createFederatedRegistry(tmpDir)
    await expect(registry.readManifest('nonexistent')).rejects.toThrow()
  })

  it('syncs consumer contract', async () => {
    const registry = createFederatedRegistry(tmpDir)
    await registry.syncConsumer('platform', {
      'auth-service': ['authRoot', 'authApi'],
      'payments': ['payRoot'],
    })

    const reg = await registry.readRegistry()
    expect(reg.consumers['platform']!.imports).toEqual({
      'auth-service': ['authRoot', 'authApi'],
      'payments': ['payRoot'],
    })
  })

  it('updates existing provider entry on re-publish', async () => {
    const registry = createFederatedRegistry(tmpDir)
    await registry.publishManifest('auth-service', createTestManifest('auth-service'))

    const reg1 = await registry.readRegistry()
    const ts1 = reg1.providers['auth-service']!.lastPublished

    // Wait a bit to get a different timestamp
    await new Promise(resolve => setTimeout(resolve, 10))

    await registry.publishManifest('auth-service', createTestManifest('auth-service'))
    const reg2 = await registry.readRegistry()
    const ts2 = reg2.providers['auth-service']!.lastPublished

    expect(ts2).not.toBe(ts1)
  })
})
