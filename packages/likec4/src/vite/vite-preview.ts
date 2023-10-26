import getPort, { portNumbers } from 'get-port'
import type { InlineConfig } from 'vite'
import { mergeConfig, preview } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'

type VitePreviewParams = LikeC4ViteConfig & {
  open?: boolean
}

export async function vitePreview(cfg?: VitePreviewParams) {
  const { isDev, ...config } = await viteConfig(cfg)
  const port = await getPort({
    port: portNumbers(62001, 62020)
  })
  const open = cfg?.open ?? false

  const previewServer = await preview(
    mergeConfig(config, {
      configFile: false,
      mode: 'production',
      preview: {
        host: '0.0.0.0',
        port,
        open
      }
    } satisfies InlineConfig)
  )

  return previewServer
}
