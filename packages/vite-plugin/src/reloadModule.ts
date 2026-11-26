import { loggable } from '@likec4/log'
import type { ViteDevServer } from 'vite'
import { logger } from './logger'

/**
 * Reloads a virtual module in every environment that imports it.
 * `server.reloadModule` only updates the client copy, so SSR kept serving the old model.
 */
export async function reloadModuleInEnvironments(
  server: Pick<ViteDevServer, 'environments'>,
  id: string,
): Promise<boolean> {
  let reloaded = false
  for (const environment of Object.values(server.environments)) {
    const md = environment.moduleGraph.getModuleById(id)
    if (!md || md.importers.size === 0) {
      continue
    }
    try {
      await environment.reloadModule(md)
      reloaded = true
    } catch (err) {
      logger.error(loggable(err))
    }
  }
  return reloaded
}
