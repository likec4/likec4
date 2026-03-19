/**
 * likec4 gen leanix inventory
 * Fetches a read-only snapshot from the LeanIX API and writes leanix-inventory-snapshot.json.
 * Inbound only; no DSL generation.
 */

import { fetchLeanixInventorySnapshot } from '@likec4/leanix-bridge'
import { mkdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import { createLikeC4Logger, startTimer } from '../../logger'
import { requireLeanixClient } from '../bridge/leanix-client'

const SNAPSHOT_FILENAME = 'leanix-inventory-snapshot.json'

export type LeanixInventorySnapshotHandlerParams = {
  outdir: string
  /** Custom attribute key to read likec4Id from fact sheets (e.g. "likec4Id"). */
  likec4IdAttribute?: string
}

/**
 * Fetches LeanIX inventory snapshot via API and writes leanix-inventory-snapshot.json to outdir.
 * Requires LEANIX_API_TOKEN. Does not modify LikeC4 or DSL.
 *
 * @param params - outdir, optional likec4IdAttribute for fact sheet custom attribute
 * @returns Promise<void>
 * @throws when LEANIX_API_TOKEN is missing or API calls fail
 */
export async function leanixInventorySnapshotHandler(
  params: LeanixInventorySnapshotHandlerParams,
): Promise<void> {
  const logger = createLikeC4Logger('c4:gen:leanix:inventory')
  const timer = startTimer(logger)
  const { outdir, likec4IdAttribute } = params

  try {
    const client = requireLeanixClient()
    const opts: { likec4IdAttribute?: string } = {}
    if (
      typeof likec4IdAttribute === 'string' &&
      likec4IdAttribute.trim() !== ''
    ) {
      opts.likec4IdAttribute = likec4IdAttribute.trim()
    }
    const snapshot = await fetchLeanixInventorySnapshot(client, opts)

    await mkdir(outdir, { recursive: true })
    const snapshotPath = resolve(outdir, SNAPSHOT_FILENAME)
    await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2))
    logger.info(`${k.dim('generated')} ${relative(process.cwd(), snapshotPath)}`)
    logger.info(
      `${k.dim('snapshot')} ${snapshot.factSheets.length} fact sheets, ${snapshot.relations.length} relations`,
    )
  } finally {
    timer.stopAndLog()
  }
}
