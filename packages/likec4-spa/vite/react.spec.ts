import type { LikeC4 } from '@likec4/language-services/node'
import type { AppSource } from './app-source'
import { describe, expect, it, vi } from 'vitest'

const LikeC4VitePlugin = vi.hoisted(() => vi.fn<(options: Record<string, unknown>) => unknown[]>(() => []))

vi.mock('@likec4/vite-plugin', () => ({ LikeC4VitePlugin }))

const app: AppSource = {
  root: '/likec4/__app__',
  assetsDir: '/likec4/__app__',
  entries: {
    app: ['index.html'],
    react: 'codegen/react.mjs',
    webcomponent: 'codegen/webcomponent.mjs',
  },
  config: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  },
  plugins: [],
}

describe('reactViteConfig', () => {
  const likec4 = {} as LikeC4

  it('passes the customization file to the plugin and resolves React from the app', async () => {
    const { reactViteConfig } = await import('./react')

    const config = reactViteConfig({
      app,
      likec4,
      outDir: '/out',
      customization: '/workspace/likec4.customization.tsx',
    })

    expect(LikeC4VitePlugin).toHaveBeenCalledWith(
      expect.objectContaining({ customization: '/workspace/likec4.customization.tsx' }),
    )
    expect(config.resolve?.dedupe).toEqual(['react', 'react-dom'])
    expect(config.root).toBe('/likec4/__app__')
    expect(config.build?.lib).toMatchObject({ entry: 'codegen/react.mjs' })
  })

  it('has no customization by default', async () => {
    LikeC4VitePlugin.mockClear()
    const { reactViteConfig } = await import('./react')

    reactViteConfig({ app, likec4, outDir: '/out' })

    expect(LikeC4VitePlugin).toHaveBeenCalledWith(expect.objectContaining({ customization: undefined }))
  })
})
