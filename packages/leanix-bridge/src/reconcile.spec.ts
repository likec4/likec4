import { describe, expect, it } from 'vitest'
import type { BridgeManifest } from './contracts'
import { createFixtureModel } from './fixture-model'
import type { LeanixInventorySnapshot } from './leanix-inventory-snapshot'
import { reconcileInventoryWithManifest } from './reconcile'
import { toBridgeManifest } from './to-bridge-manifest'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

const FIXED_DATE = '2025-01-15T12:00:00.000Z'

function createMinimalManifest(
  overrides: Partial<{ entities: BridgeManifest['entities']; projectId: string }> = {},
): BridgeManifest {
  const model = createFixtureModel()
  const manifest = toBridgeManifest(model, { generatedAt: FIXED_DATE })
  return {
    ...manifest,
    ...overrides,
    entities: overrides.entities ?? manifest.entities,
  }
}

function createMinimalSnapshot(
  factSheets: LeanixInventorySnapshot['factSheets'],
  relations: LeanixInventorySnapshot['relations'] = [],
): LeanixInventorySnapshot {
  return {
    generatedAt: FIXED_DATE,
    factSheets,
    relations,
  }
}

describe('reconcileInventoryWithManifest', () => {
  it('matches by manifest external factSheetId', () => {
    const manifest = createMinimalManifest({
      entities: {
        cloud: {
          canonicalId: 'cloud',
          external: { leanix: { factSheetId: 'fs-1', externalId: 'fs-1' } },
        },
        'cloud.backend': { canonicalId: 'cloud.backend', external: {} },
        'cloud.backend.api': { canonicalId: 'cloud.backend.api', external: {} },
      },
    })
    const snapshot = createMinimalSnapshot([
      { id: 'fs-1', name: 'Cloud', type: 'Application' },
      { id: 'fs-2', name: 'Backend', type: 'ITComponent' },
      { id: 'fs-3', name: 'API', type: 'ITComponent' },
    ])
    const result = reconcileInventoryWithManifest(snapshot, manifest)

    expect(result.summary.matched).toBe(1)
    expect(result.matched[0]).toEqual({
      canonicalId: 'cloud',
      factSheetId: 'fs-1',
      name: 'Cloud',
      type: 'Application',
    })
    expect(result.summary.unmatchedInLikec4).toBe(2)
    expect(result.summary.unmatchedInLeanix).toBe(2)
    expect(result.summary.ambiguous).toBe(0)
  })

  it('matches by snapshot likec4Id when no external in manifest', () => {
    const manifest = createMinimalManifest()
    const snapshot = createMinimalSnapshot([
      { id: 'fs-1', name: 'Cloud', type: 'Application', likec4Id: 'cloud' },
      { id: 'fs-2', name: 'Backend', type: 'ITComponent', likec4Id: 'cloud.backend' },
      { id: 'fs-3', name: 'API', type: 'ITComponent', likec4Id: 'cloud.backend.api' },
    ])
    const result = reconcileInventoryWithManifest(snapshot, manifest)

    expect(result.summary.matched).toBe(3)
    expect(result.summary.unmatchedInLikec4).toBe(0)
    expect(result.summary.unmatchedInLeanix).toBe(0)
    expect(result.summary.ambiguous).toBe(0)
  })

  it('reports unmatched in LikeC4 when snapshot has no match', () => {
    const manifest = createMinimalManifest()
    const snapshot = createMinimalSnapshot([])
    const result = reconcileInventoryWithManifest(snapshot, manifest)

    expect(result.summary.matched).toBe(0)
    expect(result.summary.unmatchedInLikec4).toBe(3)
    expect(result.unmatchedInLikec4.map(u => u.canonicalId)).toEqual(['cloud', 'cloud.backend', 'cloud.backend.api'])
  })

  it('reports unmatched in LeanIX when manifest has no match for snapshot fact sheet', () => {
    const manifest = createMinimalManifest({
      entities: { cloud: { canonicalId: 'cloud', external: {} } },
    })
    const snapshot = createMinimalSnapshot([
      { id: 'fs-1', name: 'Cloud', type: 'Application' },
      { id: 'fs-orphan', name: 'Orphan', type: 'Application' },
    ])
    const result = reconcileInventoryWithManifest(snapshot, manifest)

    expect(result.summary.matched).toBe(0)
    expect(result.summary.unmatchedInLikec4).toBe(1)
    expect(result.summary.unmatchedInLeanix).toBe(2)
    expect(result.unmatchedInLeanix.map(u => u.factSheetId)).toContain('fs-orphan')
  })

  it('reports ambiguous when multiple snapshot fact sheets match same name+type (with dryRun)', () => {
    const model = createFixtureModel()
    const manifest = toBridgeManifest(model, { generatedAt: FIXED_DATE })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: FIXED_DATE })
    const snapshot = createMinimalSnapshot([
      { id: 'fs-1', name: 'Cloud', type: 'Application' },
      { id: 'fs-2', name: 'Cloud', type: 'Application' },
    ])
    const result = reconcileInventoryWithManifest(snapshot, manifest, { dryRun })

    expect(result.summary.ambiguous).toBe(1)
    expect(result.ambiguous[0]!.canonicalId).toBe('cloud')
    expect(result.ambiguous[0]!.candidateFactSheetIds).toHaveLength(2)
  })

  it('single match by name+type when dryRun provided and one candidate', () => {
    const model = createFixtureModel()
    const manifest = toBridgeManifest(model, { generatedAt: FIXED_DATE })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: FIXED_DATE })
    const cloudFs = dryRun.factSheets.find(f => f.likec4Id === 'cloud')!
    const snapshot = createMinimalSnapshot([
      { id: 'fs-cloud', name: cloudFs.name, type: cloudFs.type },
    ])
    const result = reconcileInventoryWithManifest(snapshot, manifest, { dryRun })

    expect(result.summary.matched).toBe(1)
    expect(result.matched[0]!.canonicalId).toBe('cloud')
    expect(result.matched[0]!.factSheetId).toBe('fs-cloud')
  })
})
