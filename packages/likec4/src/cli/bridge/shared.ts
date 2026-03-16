/**
 * Shared bridge CLI: model adapter, artifact building and writing.
 * Used by gen leanix-dry-run and sync leanix.
 */

import type { AnyLikeC4Model } from '@likec4/core/model'
import {
  toBridgeManifest,
  toLeanixInventoryDryRun,
  toReport,
} from '@likec4/leanix-bridge'
import type {
  BridgeManifest,
  BridgeModelInput,
  BridgeReport,
  LeanixInventoryDryRun,
} from '@likec4/leanix-bridge'
import { mkdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import k from 'tinyrainbow'

export const ERR_EMPTY_MODEL = 'No project or empty model'
export const ERR_LEANIX_TOKEN_REQUIRED = 'LEANIX_API_TOKEN is required for likec4 sync leanix --apply'

const DEFAULT_MAPPING_PROFILE = 'default' as const
const ARTIFACT_MANIFEST = 'manifest.json'
const ARTIFACT_DRY_RUN = 'leanix-dry-run.json'
const ARTIFACT_REPORT = 'report.json'

/**
 * Adapts an AnyLikeC4Model to BridgeModelInput for toBridgeManifest / toLeanixInventoryDryRun.
 */
export function asBridgeModel(model: AnyLikeC4Model): BridgeModelInput {
  return {
    projectId: String(model.projectId),
    elements: () => model.elements(),
    relationships: () => model.relationships(),
    views: () => model.views(),
  }
}

export type BridgeArtifacts = {
  manifest: BridgeManifest
  dryRun: LeanixInventoryDryRun
  report: BridgeReport
}

/**
 * Builds manifest, dry-run inventory and report from a bridge model (no live API).
 */
export function buildBridgeArtifacts(bridgeModel: BridgeModelInput): BridgeArtifacts {
  const manifest = toBridgeManifest(bridgeModel, { mappingProfile: DEFAULT_MAPPING_PROFILE })
  const dryRun = toLeanixInventoryDryRun(bridgeModel, { mappingProfile: DEFAULT_MAPPING_PROFILE })
  const report = toReport(manifest, dryRun)
  return { manifest, dryRun, report }
}

export type BridgeLogger = { info: (msg: string) => void }

/**
 * Writes manifest.json, leanix-dry-run.json and report.json to outdir.
 */
export async function writeBridgeArtifacts(
  outdir: string,
  artifacts: BridgeArtifacts,
  logger: BridgeLogger,
  cwd: string = process.cwd(),
): Promise<void> {
  await mkdir(outdir, { recursive: true })
  const manifestPath = resolve(outdir, ARTIFACT_MANIFEST)
  const dryRunPath = resolve(outdir, ARTIFACT_DRY_RUN)
  const reportPath = resolve(outdir, ARTIFACT_REPORT)
  await writeFile(manifestPath, JSON.stringify(artifacts.manifest, null, 2))
  await writeFile(dryRunPath, JSON.stringify(artifacts.dryRun, null, 2))
  await writeFile(reportPath, JSON.stringify(artifacts.report, null, 2))
  logger.info(`${k.dim('generated')} ${relative(cwd, manifestPath)}`)
  logger.info(`${k.dim('generated')} ${relative(cwd, dryRunPath)}`)
  logger.info(`${k.dim('generated')} ${relative(cwd, reportPath)}`)
}

export const BRIDGE_ARTIFACT_NAMES = {
  manifest: ARTIFACT_MANIFEST,
  dryRun: ARTIFACT_DRY_RUN,
  report: ARTIFACT_REPORT,
} as const
