import { viteConfig } from '@/vite/config'
import getPort, { portNumbers } from 'get-port'
import { preview } from 'vite'
import type { LikeC4ViteConfig } from './config'

type VitePreviewParams = LikeC4ViteConfig & {
  open?: boolean
}

export async function vitePreview(cfg?: VitePreviewParams) {
  const { isDev, ...config } = await viteConfig(cfg)
  const port = await getPort({
    port: portNumbers(62001, 62010)
  })
  const open = cfg?.open ?? false

  const previewServer = await preview({
    ...config,
    mode: 'production',
    preview: {
      host: '0.0.0.0',
      port,
      open
    }
  })

  return previewServer
}
