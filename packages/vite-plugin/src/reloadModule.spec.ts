import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Plugin, createServer } from 'vite'
import { describe, expect, it } from 'vitest'
import {
  codeHash,
  codeHashMeta,
  hasOutdatedModule,
  reloadModuleInEnvironments,
  servedCodeHash,
} from './reloadModule'

const virtualId = '\0virtual:counter'

/**
 * Virtual module that exports how many times it was loaded.
 * With `withHash`, the code (without the counter) is hashed into `meta`, as the LikeC4 plugin does.
 */
function counterPlugin({ withHash = false } = {}): Plugin {
  let loads = 0
  return {
    name: 'counter',
    resolveId: id => id === 'virtual:counter' ? virtualId : null,
    load: id => {
      if (id !== virtualId) {
        return null
      }
      const code = `export default ${++loads}`
      return withHash ? { code, meta: codeHashMeta(servedCode) } : code
    },
  }
}

/**
 * Code the hash is computed from in the counter plugin
 */
const servedCode = 'export default counter'

/**
 * Dev server with `entry.js` importing the counter; each test gets its own, as tests run concurrently
 */
async function startServer({ withHash = false } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'likec4-reload-')))
  await writeFile(join(root, 'entry.js'), `import counter from 'virtual:counter'\nexport default counter\n`)
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, ws: false },
    plugins: [counterPlugin({ withHash })],
  })
  return {
    server,
    ssrCounter: async () => (await server.ssrLoadModule('/entry.js'))['default'],
    [Symbol.asyncDispose]: async () => {
      await server.close()
      await rm(root, { recursive: true, force: true })
    },
  }
}

describe('reloadModuleInEnvironments', () => {
  it('reloads the module for SSR, not only for the client', async () => {
    await using ctx = await startServer()
    await ctx.server.environments.client.transformRequest('/entry.js')
    const before = await ctx.ssrCounter()

    await expect(reloadModuleInEnvironments(ctx.server, virtualId)).resolves.toBe(true)

    expect(await ctx.ssrCounter()).toBeGreaterThan(before)
    expect(ctx.server.environments.client.moduleGraph.getModuleById(virtualId)?.lastHMRTimestamp).toBeGreaterThan(0)
  })

  it('does nothing when no environment imports the module', async () => {
    await using ctx = await startServer()
    await expect(reloadModuleInEnvironments(ctx.server, virtualId)).resolves.toBe(false)
  })

  it('keeps the hash of the served code in the module graph of each environment', async () => {
    await using ctx = await startServer({ withHash: true })
    await ctx.server.environments.client.transformRequest('/entry.js')
    await ctx.ssrCounter()

    for (const environment of Object.values(ctx.server.environments)) {
      const md = environment.moduleGraph.getModuleById(virtualId)
      expect(md && servedCodeHash(md)).toBe(codeHash(servedCode))
    }
  })

  it('skips environments that were served the same code', async () => {
    await using ctx = await startServer({ withHash: true })
    await ctx.server.environments.client.transformRequest('/entry.js')
    const before = await ctx.ssrCounter()
    const hash = codeHash(servedCode)

    expect(hasOutdatedModule(ctx.server, virtualId, hash)).toBe(false)
    await expect(reloadModuleInEnvironments(ctx.server, virtualId, hash)).resolves.toBe(false)
    expect(await ctx.ssrCounter()).toBe(before)

    const changed = codeHash('export default changed')
    expect(hasOutdatedModule(ctx.server, virtualId, changed)).toBe(true)
    await expect(reloadModuleInEnvironments(ctx.server, virtualId, changed)).resolves.toBe(true)
    expect(await ctx.ssrCounter()).toBeGreaterThan(before)
  })
})
