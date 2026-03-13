import { describe, expect, it } from 'vitest'
import { toBridgeManifest } from './to-bridge-manifest'
import { toLeanixInventoryDryRun } from './to-leanix-inventory-dry-run'
import { toReport } from './report'
import { createFixtureModel } from './fixture-model'

describe('bridge artifacts (golden snapshot)', () => {
  const fixedDate = '2025-01-15T12:00:00.000Z'
  const model = createFixtureModel()

  it('manifest.json shape', () => {
    const manifest = toBridgeManifest(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    expect(manifest).toMatchSnapshot()
  })

  it('leanix-dry-run.json shape', () => {
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    expect(dryRun).toMatchSnapshot()
  })

  it('report.json shape', () => {
    const manifest = toBridgeManifest(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    const dryRun = toLeanixInventoryDryRun(model, { generatedAt: fixedDate, mappingProfile: 'snapshot' })
    const report = toReport(manifest, dryRun)
    expect(report).toMatchSnapshot()
  })
})
