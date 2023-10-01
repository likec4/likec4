import getPort from 'get-port'
import type { ViteDevServer } from 'vite'
import { createServer, searchForWorkspaceRoot, type InlineConfig, mergeConfig } from 'vite'
import { viteConfig } from './config'

export const startViteDev = async (_config?: InlineConfig): Promise<ViteDevServer> => {
  const config = await viteConfig(_config)
  const port = await getPort({
    port: [config.server?.port ?? 61001, 62002, 62003, 62004, 62005]
  })
  const hmrPort = await getPort({
    port: [24678, 24679, 24680, 24681, 24682, 24683, 24684, 24685]
  })

  const server = await createServer(
    mergeConfig(config, {
      configFile: false,
      mode: config.mode ?? 'development',
      server: {
        host: '0.0.0.0',
        port,
        hmr: {
          // needed for hmr to work over network aka WSL2
          host: 'localhost',
          port: hmrPort
        },
        fs: {
          allow: [searchForWorkspaceRoot(process.cwd())]
        },
        open: true
      }
    })
  )

  await server.listen()

  server.config.logger.info(`Server running at http://localhost:${port}`, {
    timestamp: true
  })

  return server
}
