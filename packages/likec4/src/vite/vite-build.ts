import type { InlineConfig } from 'vite'
import { build, mergeConfig } from 'vite'
import type { LikeC4ViteConfig } from './config'
import { viteConfig } from './config'

export const viteBuild = async (cfg?: LikeC4ViteConfig) => {
  const config = await viteConfig(cfg)
  return await build(
    mergeConfig(config, {
      configFile: false,
      mode: 'production'
    } satisfies InlineConfig)
  )
}
