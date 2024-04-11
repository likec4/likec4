import { viteConfig } from '@/vite/config'
import { viteWebcomponentConfig } from '@/vite/webcomponent'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { mkTempPublicDir } from './utils'

export const viteBuild = async (cfg?: LikeC4ViteConfig) => {
  const { isDev, ...config } = await viteConfig(cfg)

  const publicDir = await mkTempPublicDir()

  const webcomponentConfig = await viteWebcomponentConfig({
    languageServices: config.languageServices,
    outDir: publicDir,
    base: config.base
  })
  await build(webcomponentConfig)

  // Static website
  await build({
    ...config,
    publicDir,
    mode: 'production'
  })

  // Copy index.html to 404.html
  const indexHtml = resolve(config.build.outDir, 'index.html')
  if (existsSync(indexHtml)) {
    copyFileSync(
      indexHtml,
      resolve(config.build.outDir, '404.html')
    )
  }
}
