/**
 * likec4 gen leanix reconcile [path]
 * Reads manifest.json and leanix-inventory-snapshot.json from outdir, reconciles, writes reconciliation-report.json.
 * Optional: use workspace to build dryRun for name+type matching and ambiguous detection.
 */

import { fromWorkspace } from '@likec4/language-services/node'
import type { BridgeManifest, LeanixInventoryDryRun, LeanixInventorySnapshot } from '@likec4/leanix-bridge'
import { isBridgeManifest, isLeanixInventorySnapshot, reconcileInventoryWithManifest } from '@likec4/leanix-bridge'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import { createLikeC4Logger, startTimer } from '../../logger'
import { LikeC4Model } from '../../model'
import { asBridgeModel, buildBridgeArtifacts } from '../bridge/shared'
import { ensureProject } from '../utils'

const RECONCILE_REPORT_FILENAME = 'reconciliation-report.json'
const ARTIFACT_MANIFEST = 'manifest.json'
const SNAPSHOT_FILENAME = 'leanix-inventory-snapshot.json'

/**
 * Reads and validates manifest.json and leanix-inventory-snapshot.json from outdir.
 * @throws when files are missing, invalid JSON, or fail type guards.
 */
export async function readManifestAndSnapshot(outdir: string): Promise<{
  manifest: BridgeManifest
  snapshot: LeanixInventorySnapshot
}> {
  const manifestPath = resolve(outdir, ARTIFACT_MANIFEST)
  const snapshotPath = resolve(outdir, SNAPSHOT_FILENAME)
  const [manifestRaw, snapshotRaw] = await Promise.all([
    readFile(manifestPath, 'utf-8'),
    readFile(snapshotPath, 'utf-8'),
  ])
  const parsedManifest: unknown = JSON.parse(manifestRaw)
  const parsedSnapshot: unknown = JSON.parse(snapshotRaw)
  if (!isBridgeManifest(parsedManifest)) {
    throw new Error('Invalid manifest format: missing manifestVersion, projectId, entities, relations, or views')
  }
  if (!isLeanixInventorySnapshot(parsedSnapshot)) {
    throw new Error('Invalid snapshot format: missing factSheets or relations arrays')
  }
  return { manifest: parsedManifest, snapshot: parsedSnapshot }
}

/**
 * Loads workspace and builds dry-run artifact for name+type matching. Returns undefined on any error (no workspace, empty model, etc).
 */
export async function loadDryRunFromWorkspace(
  workspacePath: string,
  project: string | undefined,
  useDotBin: boolean,
): Promise<LeanixInventoryDryRun | undefined> {
  await using likec4 = await fromWorkspace(workspacePath, {
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: false,
  })
  const { projectId } = ensureProject(likec4, project)
  const model = await likec4.layoutedModel(projectId)
  if (model === LikeC4Model.EMPTY) return undefined
  const artifacts = buildBridgeArtifacts(asBridgeModel(model))
  return artifacts.dryRun
}

export type LeanixReconcileHandlerParams = {
  path: string
  outdir: string
  project: string | undefined
  useDotBin: boolean
}

/**
 * Reads manifest and snapshot from outdir, reconciles them (optionally with workspace dryRun for matching), writes reconciliation-report.json.
 *
 * @param params - workspace path, outdir (containing manifest.json and leanix-inventory-snapshot.json), project, useDotBin
 * @returns Promise<void>
 */
export async function leanixReconcileHandler(params: LeanixReconcileHandlerParams): Promise<void> {
  const logger = createLikeC4Logger('c4:gen:leanix:reconcile')
  const timer = startTimer(logger)
  const { path: workspacePath, outdir, project, useDotBin } = params

  try {
    let manifest: BridgeManifest
    let snapshot: LeanixInventorySnapshot
    try {
      const read = await readManifestAndSnapshot(outdir)
      manifest = read.manifest
      snapshot = read.snapshot
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Failed to read ${ARTIFACT_MANIFEST} or ${SNAPSHOT_FILENAME} from ${outdir}: ${msg}`)
      throw err
    }

    let dryRun: LeanixInventoryDryRun | undefined
    try {
      dryRun = await loadDryRunFromWorkspace(workspacePath, project, useDotBin)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (project != null && project !== '') {
        logger.error(`Failed to load workspace for dryRun enrichment: ${msg}`)
        throw err
      }
      logger.warn(`Could not load workspace for dryRun enrichment; proceeding without it: ${msg}`)
      dryRun = undefined
    }

    const result = reconcileInventoryWithManifest(snapshot, manifest, {
      ...(dryRun != null ? { dryRun } : {}),
    })

    const reportPath = resolve(outdir, RECONCILE_REPORT_FILENAME)
    await writeFile(reportPath, JSON.stringify(result, null, 2))
    logger.info(`${k.dim('generated')} ${relative(process.cwd(), reportPath)}`)
    logger.info(
      `${
        k.dim('reconcile')
      } matched=${result.summary.matched} unmatchedLikec4=${result.summary.unmatchedInLikec4} unmatchedLeanix=${result.summary.unmatchedInLeanix} ambiguous=${result.summary.ambiguous}`,
    )
  } finally {
    timer.stopAndLog()
  }
}
