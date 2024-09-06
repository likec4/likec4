import { viteConfig } from '@/vite/config-app'
import { viteWebcomponentConfig } from '@/vite/config-webcomponent'
import { copyFileSync, existsSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { SetOptional } from 'type-fest'
import { build } from 'vite'
import type { LikeC4ViteConfig } from './config-app.prod'
import { mkTempPublicDir } from './utils'

type Config = SetOptional<LikeC4ViteConfig, 'likec4AssetsDir'> & {
  buildWebcomponent?: boolean
}

export const Assets = ['favicon.ico', 'robots.txt']

export const viteBuild = async ({
  buildWebcomponent = true,
  webcomponentPrefix = 'likec4',
  languageServices,
  likec4AssetsDir,
  ...cfg
}: Config) => {
  likec4AssetsDir ??= await mkdtemp(join(tmpdir(), '.likec4-assets-'))

  const { isDev, ...config } = await viteConfig({
    ...cfg,
    languageServices,
    likec4AssetsDir,
    webcomponentPrefix
  })

  const publicDir = await mkTempPublicDir()

  for (const asset of Assets) {
    const origin = resolve(config.root, asset)
    if (existsSync(origin)) {
      copyFileSync(origin, resolve(publicDir, asset))
    }
  }

  const diagrams = await languageServices.diagrams()
  if (diagrams.length === 0) {
    process.exitCode = 1
    throw new Error('no views found')
  }

  diagrams.forEach(view => {
    if (view.hasLayoutDrift) {
      config.customLogger.warn(
        k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id)
      )
    }
  })

  if (buildWebcomponent) {
    const webcomponentConfig = await viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices,
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
