import type { BridgeManifest } from './contracts'
import type { LeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

/** Summary report for the bridge run (no live sync) */
export interface BridgeReport {
  generatedAt: string
  projectId: string
  manifestVersion: string
  bridgeVersion: string
  mappingProfile: string
  counts: {
    entities: number
    views: number
    relations: number
    factSheets: number
    leanixRelations: number
  }
  artifacts: {
    manifest: string
    leanixDryRun: string
  }
}

export function toReport(
  manifest: BridgeManifest,
  leanixDryRun: LeanixInventoryDryRun,
): BridgeReport {
  if (
    manifest.projectId !== leanixDryRun.projectId ||
    manifest.mappingProfile !== leanixDryRun.mappingProfile
  ) {
    throw new Error(
      'Manifest and LeanIX dry-run artifacts must belong to the same project/profile',
    )
  }

  return {
    generatedAt: manifest.generatedAt,
    projectId: manifest.projectId,
    manifestVersion: manifest.manifestVersion,
    bridgeVersion: manifest.bridgeVersion,
    mappingProfile: manifest.mappingProfile,
    counts: {
      entities: Object.keys(manifest.entities).length,
      views: Object.keys(manifest.views).length,
      relations: manifest.relations.length,
      factSheets: leanixDryRun.factSheets.length,
      leanixRelations: leanixDryRun.relations.length,
    },
    artifacts: {
      manifest: 'manifest.json',
      leanixDryRun: 'leanix-dry-run.json',
    },
  }
}
