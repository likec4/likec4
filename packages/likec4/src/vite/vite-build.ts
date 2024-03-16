import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'

export const viteBuild = async (cfg?: LikeC4ViteConfig) => {
  const { isDev, ...config } = await viteConfig(cfg)
  // Static website
  await build({
    ...config,
    configFile: false,
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

  // // Script for embedding in other websites
  // await build(
  //   mergeConfig(config, {
  //     configFile: false,
  //     mode: 'production',
  //     build: {
  //       // Don't emptyOutDir on second run
  //       emptyOutDir: false,
  //       lib: {
  //         entry: `src/likec4-views.${isDev ? 'ts' : 'js'}`,
  //         name: 'LikeC4',
  //         fileName: () => 'likec4-views.js',
  //         formats: ['umd']
  //       }
  //     }
  //   } satisfies InlineConfig)
  // )
}
