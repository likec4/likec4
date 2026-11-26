import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Plugin, createServer } from 'vite'
import { describe, expect, it } from 'vitest'
import { reloadModuleInEnvironments } from './reloadModule'

const virtualId = '\0virtual:counter'

/**
 * Virtual module that exports how many times it was loaded
 */
function counterPlugin(): Plugin {
  let loads = 0
  return {
    name: 'counter',
    resolveId: id => id === 'virtual:counter' ? virtualId : null,
    load: id => id === virtualId ? `export default ${++loads}` : null,
  }
}

/**
 * Dev server with `entry.js` importing the counter; each test gets its own, as tests run concurrently
 */
async function startServer() {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'likec4-reload-')))
  await writeFile(join(root, 'entry.js'), `import counter from 'virtual:counter'\nexport default counter\n`)
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, ws: false },
    plugins: [counterPlugin()],
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
})
