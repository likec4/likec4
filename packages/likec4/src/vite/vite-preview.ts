import { viteConfig } from '@/vite/config-app'
import getPort, { portNumbers } from 'get-port'
import { preview } from 'vite'
import type { LikeC4 } from '../LikeC4'

type VitePreviewParams = {
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  open?: boolean
  listen?: string | undefined
}

export async function vitePreview(cfg: VitePreviewParams) {
  const { isDev, ...config } = await viteConfig({
    ...cfg,
    likec4AssetsDir: '',
    webcomponentPrefix: undefined,
  })
  const port = await getPort({
    port: portNumbers(62001, 62010),
  })
  const open = cfg?.open ?? false

  const previewServer = await preview({
    ...config,
    mode: 'production',
    preview: {
      host: cfg.listen ?? '127.0.0.1',
      // TODO: temprorary enable access to any host
      // This is not recommended as it can be a security risk - https://vite.dev/config/server-options#server-allowedhosts
      // Enabled after request in discord support just to check if it solves the problem
      allowedHosts: true,
      port,
      open,
    },
  })

  return previewServer
}
