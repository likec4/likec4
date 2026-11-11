import { describe, expect, it } from 'vitest'
import { resolveAppOptions } from '../app-options'
import { createAppConfigModule } from './app-config'

describe('createAppConfigModule', () => {
  describe('pageTitle', () => {
    it('defaults to "LikeC4" when title is not set', async () => {
      const mod = createAppConfigModule(resolveAppOptions({}))
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('defaults to "LikeC4" when only other options are set', async () => {
      const mod = createAppConfigModule(resolveAppOptions({ webcomponentPrefix: 'c4' }))
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('embeds a custom pageTitle from the CLI --title flag', async () => {
      const mod = createAppConfigModule(resolveAppOptions({ title: 'AspireC4 Test App' }))
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "AspireC4 Test App"')
    })

    it('JSON-encodes special characters in pageTitle', async () => {
      const mod = createAppConfigModule(resolveAppOptions({ title: 'My "App"' }))
      const code = await mod.load.call({} as any, {} as any)
      expect(code).toContain('export let pageTitle = "My \\"App\\""')
    })
  })

  describe('virtual module ids', () => {
    it('has the correct module id', () => {
      const mod = createAppConfigModule(resolveAppOptions({}))
      expect(mod.id).toBe('likec4:app-config')
    })

    it('has the correct virtual id', () => {
      const mod = createAppConfigModule(resolveAppOptions({}))
      expect(mod.virtualId).toBe('likec4:plugin/app-config.js')
    })
  })
})
