import type { PreviewServer } from 'vite'
import type { AppViteOptions } from './config-app'
import getPort, { portNumbers } from 'get-port'
import { preview } from 'vite'
import { appViteConfig } from './config-app'

export type StartPreviewOptions = Pick<AppViteOptions, 'app' | 'likec4' | 'outputDir' | 'base' | 'customLogger'> & {
  open?: boolean
  listen?: string | undefined
}

/**
 * Serves the build of the LikeC4 app (`likec4 preview`)
 */
export async function startPreview({ open = false, listen, ...cfg }: StartPreviewOptions): Promise<PreviewServer> {
  const { config } = appViteConfig(cfg)
  const port = await getPort({
    port: portNumbers(62001, 62010),
  })

  return await preview({
    ...config,
    mode: 'production',
    preview: {
      host: listen ?? '127.0.0.1',
      // TODO: temprorary enable access to any host
      // This is not recommended as it can be a security risk - https://vite.dev/config/server-options#server-allowedhosts
      // Enabled after request in discord support just to check if it solves the problem
      allowedHosts: true,
      port,
      open,
    },
  })
}
