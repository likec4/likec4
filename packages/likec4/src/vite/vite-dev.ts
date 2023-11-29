import getPort, { portNumbers } from 'get-port'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer, mergeConfig, searchForWorkspaceRoot } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'
import k from 'picocolors'

export const viteDev = async (cfg?: LikeC4ViteConfig): Promise<ViteDevServer> => {
  const { isDev, ...config } = await viteConfig(cfg)
  const port = await getPort({
    port: [5173, 61000, 61001, ...portNumbers(62002, 62010)]
  })
  const hmrPort = await getPort({
    port: portNumbers(24678, 24690)
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
          overlay: true,
          // needed for hmr to work over network aka WSL2
          host: 'localhost',
          port: hmrPort
        },
        fs: {
          allow: [
            isDev ? searchForWorkspaceRoot(process.cwd()) : process.cwd(),
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
    server.config.logger.info(`${k.dim('`add to watcher')} ${pattern}`)
    server.watcher.add(pattern)
  }

  await server.listen()

  server.config.logger.clearScreen('info')

  return server
}
