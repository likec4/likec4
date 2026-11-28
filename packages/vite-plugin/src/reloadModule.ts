import type { EnvironmentModuleNode, ViteDevServer } from 'vite'
import { createHash } from 'node:crypto'
import { loggable } from '@likec4/log'
import { logger } from './logger'

/**
 * Key of the plugin data in the `meta` of a module
 */
const META_KEY = 'likec4'

/**
 * Hash of the generated code of a virtual module
 */
export function codeHash(code: string): string {
  return createHash('sha1').update(code).digest('hex')
}

/**
 * Plugin data for the `meta` of a `load` result: the hash of the code served to the environment.
 * Vite keeps it in the module graph of each environment.
 */
export function codeHashMeta(code: string): Record<string, unknown> {
  return { [META_KEY]: { hash: codeHash(code) } }
}

/**
 * Returns the hash of the code that was served to the environment, see {@link codeHashMeta}
 */
export function servedCodeHash(md: EnvironmentModuleNode): string | undefined {
  const data: unknown = md.info?.meta?.[META_KEY]
  if (data && typeof data === 'object' && 'hash' in data && typeof data.hash === 'string') {
    return data.hash
  }
  return undefined
}

/**
 * Environments that import the module
 */
function importingModules(server: Pick<ViteDevServer, 'environments'>, id: string) {
  return Object.values(server.environments).flatMap(environment => {
    const md = environment.moduleGraph.getModuleById(id)
    return md && md.importers.size > 0 ? [{ environment, md }] : []
  })
}

/**
 * Checks whether any environment imports the module
 */
export function isModuleImported(server: Pick<ViteDevServer, 'environments'>, id: string): boolean {
  return importingModules(server, id).length > 0
}

/**
 * Reloads a virtual module in every environment that imports it.
 * `server.reloadModule` only updates the client copy, so SSR kept serving the old model.
 *
 * @param hash - hash of the new code (see {@link codeHash}): environments that were served
 *   the same code are skipped
 * @returns `true` if the module was reloaded in some environment
 */
export async function reloadModuleInEnvironments(
  server: Pick<ViteDevServer, 'environments'>,
  id: string,
  hash?: string,
): Promise<boolean> {
  let reloaded = false
  for (const { environment, md } of importingModules(server, id)) {
    if (hash !== undefined && servedCodeHash(md) === hash) {
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

/**
 * Checks whether some environment that imports the module was served code with another hash
 */
export function hasOutdatedModule(server: Pick<ViteDevServer, 'environments'>, id: string, hash: string): boolean {
  return importingModules(server, id).some(({ md }) => servedCodeHash(md) !== hash)
}
