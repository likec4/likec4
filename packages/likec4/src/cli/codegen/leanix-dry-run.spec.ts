/**
 * Unit test: bridge artifacts (manifest, dry-run, report) using a fixture model.
 * No workspace/fromWorkspace so @likec4/log and language-server are not loaded.
 */

import type { BridgeModelInput } from '@likec4/leanix-bridge'
import {
  buildBridgeReport,
  toBridgeManifest,
  toLeanixInventoryDryRun,
} from '@likec4/leanix-bridge'
import { describe, expect, it } from 'vitest'
import { buildBridgeArtifacts } from '../bridge/shared'

function createFixtureModel(): BridgeModelInput {
  const elements = [
    { id: 'cloud', kind: 'system', title: 'Cloud', tags: [] as string[], getMetadata: () => ({}) },
    { id: 'cloud.api', kind: 'component', title: 'API', tags: [], getMetadata: () => ({}) },
  ]
  const relations = [
    { id: 'r1', source: { id: 'cloud' }, target: { id: 'cloud.api' }, kind: 'contains' as const, title: null },
  ]
  const views = [{ id: 'index' }]
  return {
    projectId: 'test-project',
    elements: () => elements,
    relationships: () => relations,
    views: () => views,
  }
}

describe('LeanIX bridge dry-run', () => {
  const bridgeModel = createFixtureModel()

  it('produces manifest with projectId, entities, relations, views', () => {
    const manifest = toBridgeManifest(bridgeModel, { mappingProfile: 'default' })
    expect(manifest).toHaveProperty('manifestVersion')
    expect(manifest.projectId).toBe('test-project')
    expect(manifest).toHaveProperty('entities')
    expect(manifest).toHaveProperty('relations')
    expect(manifest).toHaveProperty('views')
    expect(Object.keys(manifest.entities)).toHaveLength(2)
    expect(manifest.entities).toHaveProperty('cloud')
    expect(manifest.entities).toHaveProperty('cloud.api')
    expect(manifest.entities['cloud']!.canonicalId).toBe('cloud')
    expect(manifest.relations).toHaveLength(1)
    expect(manifest.relations[0]!.relationId).toBeDefined()
    expect(manifest.relations[0]!.sourceFqn).toBe('cloud')
    expect(manifest.relations[0]!.targetFqn).toBe('cloud.api')
    expect(Object.keys(manifest.views)).toHaveLength(1)
    expect(manifest.views).toHaveProperty('index')
  })

  it('produces leanix dry-run with factSheets and relations arrays', () => {
    const dryRun = toLeanixInventoryDryRun(bridgeModel, { mappingProfile: 'default' })
    expect(dryRun.projectId).toBe('test-project')
    expect(dryRun.mappingProfile).toBeDefined()
    expect(Array.isArray(dryRun.factSheets)).toBe(true)
    expect(Array.isArray(dryRun.relations)).toBe(true)
    expect(dryRun.factSheets).toHaveLength(2)
    expect(dryRun.relations).toHaveLength(1)
    const fsIds = dryRun.factSheets.map(f => f.likec4Id)
    expect(fsIds).toContain('cloud')
    expect(fsIds).toContain('cloud.api')
    expect(dryRun.factSheets.some(f => f.name === 'Cloud')).toBe(true)
    expect(dryRun.factSheets.some(f => f.name === 'API')).toBe(true)
  })

  it('produces report consistent with manifest and dry-run', () => {
    const manifest = toBridgeManifest(bridgeModel, { mappingProfile: 'default' })
    const dryRun = toLeanixInventoryDryRun(bridgeModel, { mappingProfile: 'default' })
    const report = buildBridgeReport(manifest, dryRun)
    expect(report.counts.factSheets).toBe(2)
    expect(report.counts.leanixRelations).toBe(1)
  })

  it('buildBridgeArtifacts produces same counts as individual to* calls', () => {
    const artifacts = buildBridgeArtifacts(bridgeModel)
    expect(artifacts.manifest.projectId).toBe('test-project')
    expect(artifacts.dryRun.factSheets).toHaveLength(2)
    expect(artifacts.dryRun.relations).toHaveLength(1)
    expect(artifacts.report.counts.factSheets).toBe(2)
    expect(artifacts.report.counts.leanixRelations).toBe(1)
  })
})
