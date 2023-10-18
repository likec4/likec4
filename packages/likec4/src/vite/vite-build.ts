import { build, mergeConfig } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'

export const viteBuild = async (cfg?: LikeC4ViteConfig) => {
  const config = await viteConfig(cfg)
  await build(
    mergeConfig(config, {
      configFile: false,
      mode: 'production'
    })
  )

  await build(
    mergeConfig(config, {
      configFile: false,
      mode: 'production',
      build: {
        lib: {
          entry: 'src/likec4-views.ts',
          name: 'LikeC4',
          fileName: () => 'likec4-views.js',
          formats: ['umd']
        }
      }
    })
  )
}
