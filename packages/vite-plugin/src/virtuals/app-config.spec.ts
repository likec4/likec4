import { describe, expect, it } from 'vitest'
import { createAppConfigModule } from './app-config'

describe('createAppConfigModule', () => {
  describe('pageTitle', () => {
    it('defaults to "LikeC4" when config is undefined', async () => {
      const mod = createAppConfigModule(undefined)
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('defaults to "LikeC4" when config omits pageTitle', async () => {
      const mod = createAppConfigModule({ webcomponentPrefix: 'c4' })
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('embeds a custom pageTitle from the CLI --title flag', async () => {
      const mod = createAppConfigModule({ pageTitle: 'AspireC4 Test App' })
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "AspireC4 Test App"')
    })

    it('JSON-encodes special characters in pageTitle', async () => {
      const mod = createAppConfigModule({ pageTitle: 'My "App"' })
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "My \\"App\\""')
    })
  })

  describe('virtual module ids', () => {
    it('has the correct module id', () => {
      const mod = createAppConfigModule(undefined)
      expect(mod.id).toBe('likec4:app-config')
    })

    it('has the correct virtual id', () => {
      const mod = createAppConfigModule(undefined)
      expect(mod.virtualId).toBe('likec4:plugin/app-config.js')
    })
  })
})
