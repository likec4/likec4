import { describe, expect, it } from 'vitest'
import { resolveAppOptions } from '../app-options'
import { createAppConfigModule } from './app-config'

async function loadCode(options: Parameters<typeof resolveAppOptions>[0]): Promise<string> {
  const mod = createAppConfigModule(resolveAppOptions(options))
  const result = await mod.load.call({} as any, {} as any)
  return typeof result === 'string' ? result : result.code
}

describe('createAppConfigModule', () => {
  describe('pageTitle', () => {
    it('defaults to "LikeC4" when title is not set', async () => {
      const code = await loadCode({})
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('defaults to "LikeC4" when only other options are set', async () => {
      const code = await loadCode({ webcomponentPrefix: 'c4' })
      expect(code).toContain('export let pageTitle = "LikeC4"')
    })

    it('embeds a custom pageTitle from the CLI --title flag', async () => {
      const code = await loadCode({ title: 'AspireC4 Test App' })
      expect(code).toContain('export let pageTitle = "AspireC4 Test App"')
    })

    it('JSON-encodes special characters in pageTitle', async () => {
      const code = await loadCode({ title: 'My "App"' })
      expect(code).toContain('export let pageTitle = "My \\"App\\""')
    })
  })
})
