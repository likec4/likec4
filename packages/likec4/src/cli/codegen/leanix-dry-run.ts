/**
 * Built-in generator: LeanIX bridge dry-run.
 * likec4 gen leanix dry-run [path]
 * Writes manifest.json, leanix-dry-run.json, report.json to out/bridge (or -o/--outdir).
 */

import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import k from 'tinyrainbow'
import { createLikeC4Logger, startTimer } from '../../logger'
import { LikeC4Model } from '../../model'
import {
  asBridgeModel,
  buildBridgeArtifacts,
  ERR_EMPTY_MODEL,
  writeBridgeArtifacts,
} from '../bridge/shared'
import { ensureProject } from '../utils'

export type LeanixDryRunHandlerParams = {
  path: string
  outdir: string
  project: string | undefined
  useDotBin: boolean
}

/**
 * Builds bridge artifacts (manifest, leanix-dry-run, report) from the workspace model and writes them to outdir.
 *
 * @param params - workspace path, outdir, project, useDotBin
 * @returns Promise<void>
 * @throws Error when workspace has no project or empty model
 */
export async function leanixDryRunHandler(params: LeanixDryRunHandlerParams): Promise<void> {
  const logger = createLikeC4Logger('c4:gen:leanix:dry-run')
  const timer = startTimer(logger)
  const { path: workspacePath, outdir, project, useDotBin } = params

  try {
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
  } finally {
    timer.stopAndLog()
  }
}
