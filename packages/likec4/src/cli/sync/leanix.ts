/**
 * likec4 sync leanix --dry-run | --apply
 * Writes bridge artifacts to out/bridge; with --apply runs live sync when LEANIX_API_TOKEN is set.
 */

import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { planSyncToLeanix, syncToLeanix } from '@likec4/leanix-bridge'
import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import { createLikeC4Logger, startTimer } from '../../logger'
import { LikeC4Model } from '../../model'
import { createLeanixClientFromEnv } from '../bridge/leanix-client'
import {
  asBridgeModel,
  BRIDGE_ARTIFACT_NAMES,
  buildBridgeArtifacts,
  ERR_EMPTY_MODEL,
  ERR_LEANIX_TOKEN_REQUIRED,
  writeBridgeArtifacts,
} from '../bridge/shared'
import { ensureProject } from '../utils'

const SYNC_PLAN_FILENAME = 'sync-plan.json'

export type SyncLeanixArgs = {
  path: string
  outdir: string
  project: string | undefined
  useDotBin: boolean
  dryRun: boolean
  apply: boolean
}

/**
 * Executes LeanIX sync workflow: builds bridge artifacts, optionally plans or applies sync.
 * Requires LEANIX_API_TOKEN for --apply mode.
 *
 * @param args - path/workspacePath, outdir, project, useDotBin, dryRun, apply
 * @returns Promise<void>
 * @throws Error with ERR_EMPTY_MODEL when the workspace has no model; throws with ERR_LEANIX_TOKEN_REQUIRED when --apply is set but LEANIX_API_TOKEN is missing
 */
export async function runSyncLeanix(args: SyncLeanixArgs): Promise<void> {
  const logger = createLikeC4Logger('c4:sync:leanix')
  const timer = startTimer(logger)
  const { path: workspacePath, outdir, project, useDotBin, dryRun, apply } = args

  try {
    if (dryRun && apply) {
      throw new Error('Choose either dryRun or apply, not both')
    }
    await using likec4 = await fromWorkspace(workspacePath, {
      graphviz: useDotBin ? 'binary' : 'wasm',
      watch: false,
    })
    const { projectId } = ensureProject(likec4, project)
    if (project) {
      logger.info(`${k.dim('project')} ${k.green(projectId)}`)
    }

    const model = await likec4.layoutedModel(projectId)
    if (model === LikeC4Model.EMPTY) {
      logger.error(ERR_EMPTY_MODEL)
      throw new Error(ERR_EMPTY_MODEL)
    }

    const bridgeModel = asBridgeModel(model)
    const artifacts = buildBridgeArtifacts(bridgeModel)
    await writeBridgeArtifacts(outdir, artifacts, logger)

    const client = createLeanixClientFromEnv()

    if (dryRun || !apply) {
      if (client) {
        const plan = await planSyncToLeanix(artifacts.dryRun, client, { idempotent: true })
        const planPath = resolve(outdir, SYNC_PLAN_FILENAME)
        await writeFile(planPath, JSON.stringify(plan, null, 2))
        logger.info(`${k.dim('generated')} ${relative(process.cwd(), planPath)}`)
        if (plan.errors.length > 0) {
          const message = `${plan.errors.length} plan error(s): ${plan.errors.join('; ')}`
          logger.error(message)
          throw new Error(message)
        }
      } else {
        logger.info(`${k.dim('skip')} sync-plan (set LEANIX_API_TOKEN to include plan)`)
      }
    }

    if (apply) {
      if (!client) {
        logger.error(ERR_LEANIX_TOKEN_REQUIRED)
        throw new Error(ERR_LEANIX_TOKEN_REQUIRED)
      }
      const result = await syncToLeanix(artifacts.manifest, artifacts.dryRun, client, {
        idempotent: true,
      })
      const manifestPath = resolve(outdir, BRIDGE_ARTIFACT_NAMES.manifest)
      await writeFile(manifestPath, JSON.stringify(result.manifest, null, 2))
      logger.info(`${k.dim('generated')} ${relative(process.cwd(), manifestPath)} (after sync)`)
      if (result.errors.length > 0) {
        const message = `${result.errors.length} sync error(s): ${result.errors.join('; ')}`
        logger.error(message)
        throw new Error(message)
      }
    }
  } finally {
    timer.stopAndLog()
  }
}
