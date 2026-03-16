import { describe, expect, it } from 'vitest'
import { createFixtureModel } from './fixture-model'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

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
    expect(dryRun.relations[0]!.sourceLikec4Id).toBe('cloud')
    expect(dryRun.relations[0]!.targetLikec4Id).toBe('cloud.backend')
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

  it('empty model produces empty factSheets and relations', () => {
    const model = createFixtureModel({ elements: [], relations: [], views: [] })
    const dryRun = toLeanixInventoryDryRun(model)

    expect(dryRun.factSheets).toHaveLength(0)
    expect(dryRun.relations).toHaveLength(0)
    expect(dryRun.projectId).toBe('test-project')
  })

  it('single element produces one fact sheet and no relations', () => {
    const model = createFixtureModel({
      elements: [{ id: 'solo', kind: 'component', title: 'Solo', tags: [], metadata: {} }],
      relations: [],
      views: [{ id: 'v' }],
    })
    const dryRun = toLeanixInventoryDryRun(model)

    expect(dryRun.factSheets).toHaveLength(1)
    expect(dryRun.factSheets[0]!.likec4Id).toBe('solo')
    expect(dryRun.factSheets[0]!.type).toBe('ITComponent')
    expect(dryRun.relations).toHaveLength(0)
  })

  it('single relation produces one relation with correct source/target', () => {
    const model = createFixtureModel({
      elements: [
        { id: 'x', kind: 'system', title: 'X', tags: [], metadata: {} },
        { id: 'y', kind: 'system', title: 'Y', tags: [], metadata: {} },
      ],
      relations: [{ id: 'edge1', source: 'x', target: 'y', kind: null, title: 'Link' }],
      views: [],
    })
    const dryRun = toLeanixInventoryDryRun(model)

    expect(dryRun.relations).toHaveLength(1)
    expect(dryRun.relations[0]!.sourceLikec4Id).toBe('x')
    expect(dryRun.relations[0]!.targetLikec4Id).toBe('y')
    expect(dryRun.relations[0]!.title).toBe('Link')
  })
})
