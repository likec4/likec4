import type { FederationManifest, FederationRegistry } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { checkComposition } from '../composition-check'

function createManifest(name: string, elements: string[]): FederationManifest {
  const elemRecord: Record<string, any> = {}
  for (const fqn of elements) {
    elemRecord[fqn] = { id: fqn, kind: 'service', title: fqn, style: {} }
  }
  return {
    schema: 'likec4/federation/v1',
    name,
    specification: { elements: {} },
    elements: elemRecord,
    relations: {},
    project: { id: name },
  }
}

function createRegistry(consumers: Record<string, Record<string, string[]>>): FederationRegistry {
  const consumerEntries: Record<string, { imports: Record<string, string[]> }> = {}
  for (const [name, imports] of Object.entries(consumers)) {
    consumerEntries[name] = { imports }
  }
  return {
    schema: 'likec4/registry/v1',
    providers: {},
    consumers: consumerEntries,
  }
}

describe('checkComposition', () => {
  it('passes when all imported FQNs are present', () => {
    const manifest = createManifest('auth', ['authRoot', 'authApi', 'authDb'])
    const registry = createRegistry({
      platform: { auth: ['authRoot', 'authApi'] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(true)
    expect(result.breakingChanges).toHaveLength(0)
  })

  it('fails when a consumer depends on missing FQN', () => {
    const manifest = createManifest('auth', ['authRoot'])
    const registry = createRegistry({
      platform: { auth: ['authRoot', 'authApi'] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(false)
    expect(result.breakingChanges).toHaveLength(1)
    expect(result.breakingChanges[0]!.consumer).toBe('platform')
    expect(result.breakingChanges[0]!.missingFqns).toEqual(['authApi'])
  })

  it('reports breaking changes for multiple consumers', () => {
    const manifest = createManifest('auth', ['authRoot'])
    const registry = createRegistry({
      platform: { auth: ['authRoot', 'authApi'] },
      payments: { auth: ['authRoot', 'authDb'] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(false)
    expect(result.breakingChanges).toHaveLength(2)

    const consumers = result.breakingChanges.map(c => c.consumer).sort()
    expect(consumers).toEqual(['payments', 'platform'])
  })

  it('passes when no consumers import from this provider', () => {
    const manifest = createManifest('auth', ['authRoot'])
    const registry = createRegistry({
      platform: { payments: ['payRoot'] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(true)
    expect(result.breakingChanges).toHaveLength(0)
  })

  it('passes when consumer has empty imports for this provider', () => {
    const manifest = createManifest('auth', ['authRoot'])
    const registry = createRegistry({
      platform: { auth: [] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(true)
    expect(result.breakingChanges).toHaveLength(0)
  })

  it('passes with no consumers at all', () => {
    const manifest = createManifest('auth', ['authRoot'])
    const registry = createRegistry({})

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(true)
  })

  it('partial break: one consumer ok, one broken', () => {
    const manifest = createManifest('auth', ['authRoot', 'authApi'])
    const registry = createRegistry({
      platform: { auth: ['authRoot', 'authApi'] },
      payments: { auth: ['authRoot', 'authDb'] },
    })

    const result = checkComposition('auth', manifest, registry)
    expect(result.ok).toBe(false)
    expect(result.breakingChanges).toHaveLength(1)
    expect(result.breakingChanges[0]!.consumer).toBe('payments')
    expect(result.breakingChanges[0]!.missingFqns).toEqual(['authDb'])
  })
})
