import { viteConfig } from '@/vite/config'
import type { LikeC4ViteConfig } from '@/vite/config'
import getPort, { portNumbers } from 'get-port'
import type { InlineConfig, ViteDevServer } from 'vite'
import { createServer, mergeConfig } from 'vite'

export const viteDev = async (cfg?: LikeC4ViteConfig): Promise<ViteDevServer> => {
  const { isDev, ...config } = await viteConfig(cfg)
  const port = await getPort({
    port: [5173, 61000, 61001, ...portNumbers(62002, 62010)]
  })
  const hmrPort = await getPort({
    port: portNumbers(24678, 24690)
  })

  const server = await createServer({
    ...config,
    mode: 'development',
    optimizeDeps: {
      force: true
    },
    server: {
      host: '0.0.0.0',
      port,
      hmr: {
        overlay: true,
        // needed for hmr to work over network aka WSL2
        // host: 'localhost',
        port: hmrPort
      },
      fs: {
        strict: false
      },
      open: !isDev
    }
  })

  await server.listen()

  server.config.logger.clearScreen('info')

  return server
}
