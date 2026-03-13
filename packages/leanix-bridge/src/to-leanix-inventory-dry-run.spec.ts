import { describe, expect, it } from 'vitest'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'
import { createFixtureModel } from './fixture-model'

describe('toLeanixInventoryDryRun', () => {
  it('maps kinds to LeanIX fact sheet types and produces relations', () => {
    const model = createFixtureModel()
    const dryRun = toLeanixInventoryDryRun(model, {
      mappingProfile: 'test',
      generatedAt: '2025-01-15T12:00:00.000Z',
    })

    expect(dryRun.generatedAt).toBe('2025-01-15T12:00:00.000Z')
    expect(dryRun.projectId).toBe('test-project')
    expect(dryRun.mappingProfile).toBe('test')

    expect(dryRun.factSheets).toHaveLength(3)
    const cloud = dryRun.factSheets.find(f => f.likec4Id === 'cloud')
    expect(cloud?.type).toBe('Application')
    expect(cloud?.name).toBe('Cloud')

    const api = dryRun.factSheets.find(f => f.likec4Id === 'cloud.backend.api')
    expect(api?.type).toBe('ITComponent')
    expect(api?.technology).toBe('Node')
    expect(api?.tags).toEqual(['core'])

    expect(dryRun.relations).toHaveLength(2)
    expect(dryRun.relations[0].sourceLikec4Id).toBe('cloud')
    expect(dryRun.relations[0].targetLikec4Id).toBe('cloud.backend')
  })

  it('respects custom mapping for fact sheet types', () => {
    const model = createFixtureModel()
    const dryRun = toLeanixInventoryDryRun(model, {
      mapping: {
        factSheetTypes: {
          system: 'CustomApp',
          container: 'CustomComponent',
        },
      },
    })

    const cloud = dryRun.factSheets.find(f => f.likec4Id === 'cloud')
    expect(cloud?.type).toBe('CustomApp')
    const backend = dryRun.factSheets.find(f => f.likec4Id === 'cloud.backend')
    expect(backend?.type).toBe('CustomComponent')
  })
})
