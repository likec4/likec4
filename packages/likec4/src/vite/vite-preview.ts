import type { LanguageServices } from '@/language-services'
import { viteConfig } from '@/vite/config-app'
import getPort, { portNumbers } from 'get-port'
import { preview } from 'vite'
import type { LikeC4 } from '../LikeC4'

type VitePreviewParams = {
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  open?: boolean
}

export async function vitePreview(cfg: VitePreviewParams) {
  const { isDev, ...config } = await viteConfig({
    ...cfg,
    likec4AssetsDir: '',
    webcomponentPrefix: undefined
  })
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
