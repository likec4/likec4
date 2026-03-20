import { describe, expect, it } from 'vitest'
import { createFixtureModel } from './fixture-model'
import { buildBridgeReport } from './report'
import { toBridgeManifest } from './to-bridge-manifest'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

describe('bridge artifacts (golden snapshot)', () => {
  const fixedDate = '2025-01-15T12:00:00.000Z'
  const model = createFixtureModel()

  it('manifest.json shape', () => {
    const manifest = toBridgeManifest(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    // Remove version, as it varies on release
    delete (manifest as any).bridgeVersion
    expect(manifest).toMatchSnapshot()
  })

  it('leanix-dry-run.json shape', () => {
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    // Remove version, as it varies on release
    delete (dryRun as any).bridgeVersion
    expect(dryRun).toMatchSnapshot()
  })

  it('report.json shape', () => {
    const manifest = toBridgeManifest(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    const report = buildBridgeReport(manifest, dryRun)
    // Remove version, as it varies on release
    delete (report as any).bridgeVersion
    expect(report).toMatchSnapshot()
  })

  it('buildBridgeReport throws with precise mismatch when projectId or mappingProfile differ', () => {
    const manifest = toBridgeManifest(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: fixedDate, mappingProfile: 'other' })
    expect(() => buildBridgeReport(manifest, dryRun)).toThrow(/Mismatch:.*mappingProfile/)
    const dryRunWrongProject = toLeanixInventoryDryRun(createFixtureModel({ projectId: 'other-project' }), {
      generatedAt: fixedDate,
      mappingProfile: 'snapshot',
    })
    expect(() => buildBridgeReport(manifest, dryRunWrongProject)).toThrow(/Mismatch:.*projectId/)
  })
})
