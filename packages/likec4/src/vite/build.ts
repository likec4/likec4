import { build, mergeConfig, type InlineConfig } from 'vite'
import { viteConfig } from './config'

export const startBuild = async (_config?: InlineConfig) => {
  const config = await viteConfig(_config)
  await build(
    mergeConfig(config, {
      configFile: false,
      mode: 'production',
      build: {
        emptyOutDir: true
      }
    })
  )
}
