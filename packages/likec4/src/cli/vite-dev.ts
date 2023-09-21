import getPort from 'get-port'
import type { ViteDevServer } from 'vite'
import { createServer, type InlineConfig } from 'vite'
import { debug } from './debug'
import { viteConfig } from './vite-config'

export const viteDev = async (_config?: InlineConfig): Promise<ViteDevServer> => {
  const config = await viteConfig(_config)
  const port = await getPort({
    port: [config.server?.port ?? 61001, 62002, 62003, 62004, 62005]
  })
  const hmrPort = await getPort({
    port: [24678, 24679, 24680, 24681, 24682, 24683, 24684, 24685]
  })
  debug(`Port set to: ${port}`)

  const server = await createServer({
    ...config,
    mode: config.mode ?? 'development',
    server: {
      port,
      hmr: {
        // needed for hmr to work over network aka WSL2
        host: 'localhost',
        port: hmrPort
      }
      // fs: {
      //   allow: [process.cwd()],
      // },
    }
  })

  await server.listen()

  return server
}
