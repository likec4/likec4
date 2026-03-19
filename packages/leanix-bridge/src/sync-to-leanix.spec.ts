import { describe, expect, it } from 'vitest'
import type { BridgeManifest } from './contracts'
import { createFixtureModel } from './fixture-model'
import type { LeanixApiClient } from './leanix-api-client'
import { planSyncToLeanix, syncToLeanix } from './sync-to-leanix'
import { toBridgeManifest } from './to-bridge-manifest'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

/** Mock client: answers FindFactSheet with optional existing id per (name, type). */
function createMockClient(
  existingByKey: Map<string, string> = new Map(),
): LeanixApiClient {
  return {
    graphql: async (query: string, variables?: Record<string, unknown>) => {
      const fsName = variables?.['name']
      const fsType = variables?.['type']
      if (
        query.includes('FindFactSheet') &&
        typeof fsName === 'string' &&
        typeof fsType === 'string'
      ) {
        const key = `${fsName}|${fsType}`
        const id = existingByKey.get(key)
        return {
          allFactSheets: {
            edges: id ? [{ node: { id, name: fsName, type: fsType } }] : [],
          },
        }
      }
      throw new Error(`Unexpected GraphQL query in test: ${query}`)
    },
  } as LeanixApiClient
}

/** Mock client for syncToLeanix: FindFactSheet (name+type), CreateFactSheet, CreateRelation. */
function createSyncMockClient(existingByKey: Map<string, string> = new Map()) {
  const createdIds = new Map<string, string>()
  let relationCounter = 0
  return {
    client: {
      graphql: async (query: string, variables?: Record<string, unknown>) => {
        const fsName = variables?.['name']
        const fsType = variables?.['type']
        if (
          query.includes('FindFactSheet') &&
          !query.includes('FindFactSheetByAttribute') &&
          typeof fsName === 'string' &&
          typeof fsType === 'string'
        ) {
          const key = `${fsName}|${fsType}`
          const id = existingByKey.get(key)
          return {
            allFactSheets: {
              edges: id ? [{ node: { id, name: fsName, type: fsType } }] : [],
            },
          }
        }
        if (query.includes('createFactSheet')) {
          const input = variables?.['input'] as { name?: string; type?: string }
          const likec4Id = (variables?.['patches'] as Array<{ path?: string; value?: string }>)?.[0]?.value ??
            input?.name
          const id = `fs-${String(likec4Id)}-${Date.now()}`
          if (input?.name && input?.type) {
            existingByKey.set(`${input.name}|${input.type}`, id)
          }
          createdIds.set(String(likec4Id), id)
          return { createFactSheet: { factSheet: { id, name: input?.name, type: input?.type, rev: 1 } } }
        }
        if (query.includes('createRelation')) {
          const source = variables?.['source'] as string
          const target = variables?.['target'] as string
          const id = `rel-${++relationCounter}`
          return { createRelation: { relation: { id } } }
        }
        if (query.includes('updateFactSheet')) {
          return { updateFactSheet: { factSheet: { id: variables?.['id'] } } }
        }
        throw new Error(`Unexpected GraphQL in sync mock: ${query.slice(0, 80)}`)
      },
    } as LeanixApiClient,
    getCreatedId: (likec4Id: string) => createdIds.get(likec4Id),
  }
}

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createDefaultDryRun() {
  const model = createFixtureModel()
  const dryRun = toLeanixInventoryDryRun(model, {
    generatedAt: FIXED_DATE,
    mappingProfile: 'snapshot',
  })
  return { model, dryRun }
}

describe('planSyncToLeanix', () => {
  it('with no existing fact sheets plans all as create', async () => {
    const { dryRun } = createDefaultDryRun()
    const client = createMockClient()
    const plan = await planSyncToLeanix(dryRun, client, { generatedAt: FIXED_DATE, idempotent: true })

    expect(plan.generatedAt).toBe(FIXED_DATE)
    expect(plan.projectId).toBe('test-project')
    expect(plan.mappingProfile).toBe('snapshot')
    expect(plan.summary.factSheetsToCreate).toBe(3)
    expect(plan.summary.factSheetsToUpdate).toBe(0)
    expect(plan.summary.relationsToCreate).toBe(2)
    expect(plan.factSheetPlans).toHaveLength(3)
    expect(plan.factSheetPlans.every(p => p.action === 'create')).toBe(true)
    expect(plan.relationPlans).toHaveLength(2)
    expect(plan.relationPlans.every(p => p.action === 'create')).toBe(true)
    expect(plan.errors).toHaveLength(0)
  })

  it('with one existing fact sheet (name+type) plans one update and two create', async () => {
    const { dryRun } = createDefaultDryRun()
    const cloudFs = dryRun.factSheets.find(f => f.likec4Id === 'cloud')!
    const existingByKey = new Map<string, string>()
    existingByKey.set(`${String(cloudFs.name)}|${String(cloudFs.type)}`, 'existing-leanix-id-123')
    const client = createMockClient(existingByKey)

    const plan = await planSyncToLeanix(dryRun, client, { generatedAt: FIXED_DATE, idempotent: true })

    expect(plan.summary.factSheetsToCreate).toBe(2)
    expect(plan.summary.factSheetsToUpdate).toBe(1)
    const cloudPlan = plan.factSheetPlans.find(p => p.likec4Id === 'cloud')
    expect(cloudPlan?.action).toBe('update')
    expect(cloudPlan?.existingFactSheetId).toBe('existing-leanix-id-123')
    const others = plan.factSheetPlans.filter(p => p.likec4Id !== 'cloud')
    expect(others.every(p => p.action === 'create')).toBe(true)
  })

  it('with idempotent false plans all fact sheets as create', async () => {
    const { dryRun } = createDefaultDryRun()
    const cloudFs = dryRun.factSheets.find(f => f.likec4Id === 'cloud')!
    const existingByKey = new Map<string, string>()
    existingByKey.set(`${String(cloudFs.name)}|${String(cloudFs.type)}`, 'existing-leanix-id-123')
    const client = createMockClient(existingByKey)

    const plan = await planSyncToLeanix(dryRun, client, { generatedAt: FIXED_DATE, idempotent: false })

    expect(plan.summary.factSheetsToCreate).toBe(3)
    expect(plan.summary.factSheetsToUpdate).toBe(0)
    expect(plan.factSheetPlans.every(p => p.action === 'create')).toBe(true)
  })
})

describe('syncToLeanix', () => {
  function defaultManifestAndDryRun(): {
    manifest: BridgeManifest
    dryRun: ReturnType<typeof toLeanixInventoryDryRun>
  } {
    const model = createFixtureModel()
    const manifest = toBridgeManifest(model, { generatedAt: FIXED_DATE, mappingProfile: 'default' })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: FIXED_DATE, mappingProfile: 'default' })
    return { manifest, dryRun }
  }

  it('creates all fact sheets and relations when none exist (idempotent)', async () => {
    const { manifest, dryRun } = defaultManifestAndDryRun()
    const { client } = createSyncMockClient()

    const result = await syncToLeanix(manifest, dryRun, client, { idempotent: true })

    expect(result.factSheetsCreated).toBe(3)
    expect(result.factSheetsReused).toBe(0)
    expect(result.relationsCreated).toBe(2)
    expect(result.errors).toHaveLength(0)
    expect(Object.keys(result.manifest.entities)).toHaveLength(3)
    for (const [, entity] of Object.entries(result.manifest.entities)) {
      expect(entity.external?.['leanix']?.factSheetId).toBeDefined()
      expect(typeof entity.external?.['leanix']?.factSheetId).toBe('string')
    }
    expect(result.manifest.relations.filter(r => r.external?.['leanix']?.relationId)).toHaveLength(2)
  })

  it('reuses one fact sheet when found by name+type (idempotent)', async () => {
    const { manifest, dryRun } = defaultManifestAndDryRun()
    const cloudFs = dryRun.factSheets.find(f => f.likec4Id === 'cloud')!
    const existingByKey = new Map<string, string>()
    existingByKey.set(`${cloudFs.name}|${cloudFs.type}`, 'existing-cloud-id')
    const { client } = createSyncMockClient(existingByKey)

    const result = await syncToLeanix(manifest, dryRun, client, { idempotent: true })

    expect(result.factSheetsCreated).toBe(2)
    expect(result.factSheetsReused).toBe(1)
    expect(result.relationsCreated).toBe(2)
    expect(result.manifest.entities['cloud']?.external?.['leanix']?.factSheetId).toBe('existing-cloud-id')
  })
})
