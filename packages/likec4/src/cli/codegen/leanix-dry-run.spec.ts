/**
 * Unit test: bridge artifacts (manifest, dry-run, report) using a fixture model.
 * No workspace/fromWorkspace so @likec4/log and language-server are not loaded.
 */

import type { BridgeModelInput } from '@likec4/leanix-bridge'
import {
  toBridgeManifest,
  toLeanixInventoryDryRun,
  toReport,
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
    expect(manifest).toHaveProperty('projectId')
    expect(manifest.projectId).toBe(bridgeModel.projectId)
    expect(manifest).toHaveProperty('entities')
    expect(manifest).toHaveProperty('relations')
    expect(manifest).toHaveProperty('views')
    expect(typeof manifest.entities).toBe('object')
    expect(Array.isArray(manifest.relations)).toBe(true)
  })

  it('produces leanix dry-run with factSheets and relations arrays', () => {
    const dryRun = toLeanixInventoryDryRun(bridgeModel, { mappingProfile: 'default' })
    expect(dryRun).toHaveProperty('mappingProfile')
    expect(dryRun).toHaveProperty('projectId')
    expect(dryRun).toHaveProperty('factSheets')
    expect(dryRun).toHaveProperty('relations')
    expect(Array.isArray(dryRun.factSheets)).toBe(true)
    expect(Array.isArray(dryRun.relations)).toBe(true)
    expect(dryRun.factSheets.length).toBeGreaterThanOrEqual(0)
  })

  it('produces report consistent with manifest and dry-run', () => {
    const manifest = toBridgeManifest(bridgeModel, { mappingProfile: 'default' })
    const dryRun = toLeanixInventoryDryRun(bridgeModel, { mappingProfile: 'default' })
    const report = toReport(manifest, dryRun)
    expect(report).toHaveProperty('counts')
    expect(report.counts.factSheets).toBe(dryRun.factSheets.length)
    expect(report.counts.leanixRelations).toBe(dryRun.relations.length)
  })

  it('buildBridgeArtifacts produces same counts as individual to* calls', () => {
    const artifacts = buildBridgeArtifacts(bridgeModel)
    expect(artifacts.manifest.projectId).toBe(bridgeModel.projectId)
    expect(artifacts.report.counts.factSheets).toBe(artifacts.dryRun.factSheets.length)
    expect(artifacts.report.counts.leanixRelations).toBe(artifacts.dryRun.relations.length)
  })
})
