import getPort from 'get-port'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer, mergeConfig, searchForWorkspaceRoot } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'

export const viteDev = async (cfg?: LikeC4ViteConfig): Promise<ViteDevServer> => {
  const config = await viteConfig(cfg)
  const port = await getPort({
    port: [5173, 61000, 61001, 62002, 62003, 62004, 62005]
  })
  const hmrPort = await getPort({
    port: [24678, 24679, 24680, 24681, 24682, 24683, 24684, 24685]
  })

  const server = await createServer(
    mergeConfig(config, {
      configFile: false,
      mode: 'development',
      // cacheDir: resolve(config.languageServices.workspace, '.cache'),
      server: {
        host: '0.0.0.0',
        port,
        hmr: {
          // needed for hmr to work over network aka WSL2
          host: 'localhost',
          port: hmrPort
        },
        fs: {
          allow: [
            searchForWorkspaceRoot(process.cwd()),
            config.root,
            config.languageServices.workspace
          ]
        },
        open: true
      }
    } satisfies InlineConfig)
  )

  if (!config.languageServices.workspace.startsWith(config.root)) {
    const pattern = config.languageServices.workspace
    server.config.logger.info(`add to watcher: ${pattern}`)
    server.watcher.add(pattern)
  }

  await server.listen()

  server.config.logger.clearScreen('info')

  return server
}
