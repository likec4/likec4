import { describe, expect, it, vi } from 'vitest'
import type { LikeC4 } from '../LikeC4'

const LikeC4VitePlugin = vi.hoisted(() => vi.fn<(options: Record<string, unknown>) => unknown[]>(() => []))

vi.mock('../vite-plugin', () => ({ LikeC4VitePlugin }))
vi.mock('./utils', () => ({
  viteAppRoot: () => '/likec4/__app__',
  findPkgRoot: () => '/likec4',
  relativeToCwd: (path: string) => path,
}))

describe('viteReactConfig', () => {
  const languageServices = { languageServices: {} } as LikeC4

  it('passes the customization file to the plugin and resolves React from the app', async () => {
    const { viteReactConfig } = await import('./config-react')

    const config = await viteReactConfig({
      languageServices,
      outDir: '/out',
      customization: '/workspace/likec4.customization.tsx',
    })

    expect(LikeC4VitePlugin).toHaveBeenCalledWith(
      expect.objectContaining({ customization: '/workspace/likec4.customization.tsx' }),
    )
    expect(config.resolve?.dedupe).toEqual(['react', 'react-dom'])
  })

  it('has no customization by default', async () => {
    LikeC4VitePlugin.mockClear()
    const { viteReactConfig } = await import('./config-react')

    await viteReactConfig({ languageServices, outDir: '/out' })

    expect(LikeC4VitePlugin).toHaveBeenCalledWith(expect.objectContaining({ customization: undefined }))
  })
})
