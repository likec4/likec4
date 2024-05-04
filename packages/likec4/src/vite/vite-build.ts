import { viteConfig } from '@/vite/config'
import { viteWebcomponentConfig } from '@/vite/webcomponent'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'
import type { LikeC4ViteConfig } from './config.prod'
import { mkTempPublicDir } from './utils'

type Config = LikeC4ViteConfig & {
  buildWebcomponent?: boolean
}

export const Assets = ['favicon.ico', 'robots.txt']

export const viteBuild = async ({
  buildWebcomponent = true,
  ...cfg
}: Config) => {
  const { isDev, ...config } = await viteConfig(cfg)

  const publicDir = await mkTempPublicDir()

  for (const asset of Assets) {
    const origin = resolve(config.root, asset)
    if (existsSync(origin)) {
      copyFileSync(origin, resolve(publicDir, asset))
    }
  }

  if (buildWebcomponent) {
    const webcomponentConfig = await viteWebcomponentConfig({
      languageServices: config.languageServices,
      outDir: publicDir,
      base: config.base
    })
    await build(webcomponentConfig)
  }

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
