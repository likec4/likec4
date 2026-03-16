import { describe, expect, it } from 'vitest'
import { createFixtureModel } from './fixture-model'
import type { LeanixApiClient } from './leanix-api-client'
import { planSyncToLeanix } from './sync-to-leanix'
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
