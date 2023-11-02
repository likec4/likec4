import { build, mergeConfig, type InlineConfig } from 'vite'
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

  // Script for embedding in other websites
  await build(
    mergeConfig(config, {
      configFile: false,
      mode: 'production',
      build: {
        // Don't emptyOutDir on second run
        emptyOutDir: false,
        lib: {
          entry: `src/likec4-views.${isDev ? 'ts' : 'js'}`,
          name: 'LikeC4',
          fileName: () => 'likec4-views.js',
          formats: ['umd']
        }
      }
    } satisfies InlineConfig)
  )
}
