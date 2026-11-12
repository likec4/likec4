import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findAppConfig, loadAppConfig } from './load'

describe('app config', () => {
  let folder: string

  beforeEach(async () => {
    folder = await realpath(await mkdtemp(join(tmpdir(), 'likec4-app-config-')))
  })

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true })
  })

  const write = async (content: string, filename = 'likec4.app.config.ts') => {
    const file = join(folder, filename)
    await writeFile(file, content)
    return file
  }

  describe('findAppConfig', () => {
    it('returns undefined when there is no config', () => {
      expect(findAppConfig([folder])).toBeUndefined()
    })

    it('finds the config in the first directory that has one', async () => {
      const nested = join(folder, 'nested')
      await mkdir(nested)
      const file = await write('export default {}')
      await writeFile(join(nested, 'likec4.app.config.mjs'), 'export default {}')

      expect(findAppConfig([join(folder, 'missing'), folder, nested])).toBe(file)
      expect(findAppConfig([nested, folder])).toBe(join(nested, 'likec4.app.config.mjs'))
    })

    it('ignores the project config', async () => {
      await write('export default {}', 'likec4.config.ts')

      expect(findAppConfig([folder])).toBeUndefined()
    })
  })

  describe('loadAppConfig', () => {
    it('applies defaults to an empty config', async () => {
      const file = await write('export default {}')

      expect(await loadAppConfig(file)).toEqual({
        title: 'LikeC4',
        useHashHistory: false,
        webcomponentPrefix: 'likec4',
        build: { singleFile: false, webcomponent: true },
        server: {},
      })
    })

    it('loads a typescript config that uses defineAppConfig', async () => {
      const file = await write(`
        import { defineAppConfig } from 'likec4/config'

        const port: number = 5000

        export default defineAppConfig({
          title: 'ACME',
          theme: 'dark',
          graphviz: 'binary',
          base: '/docs/',
          build: { singleFile: true },
          server: { port, allowedHosts: ['docs.acme.dev'] },
        })
      `)

      expect(await loadAppConfig(file)).toMatchObject({
        title: 'ACME',
        theme: 'dark',
        graphviz: 'binary',
        base: '/docs/',
        build: { singleFile: true, webcomponent: true },
        server: { port: 5000, allowedHosts: ['docs.acme.dev'] },
      })
    })

    it('resolves paths relative to the config file', async () => {
      const file = await write(
        `
        export default {
          workspace: './architecture',
          customization: './likec4.customization.tsx',
          publicDir: 'public',
          build: { outDir: '../site' },
        }
      `,
        'likec4.app.config.mjs',
      )

      expect(await loadAppConfig(file)).toMatchObject({
        workspace: join(folder, 'architecture'),
        customization: join(folder, 'likec4.customization.tsx'),
        publicDir: join(folder, 'public'),
        build: { outDir: join(folder, '..', 'site') },
      })
    })

    it('rejects unknown options and names the file', async () => {
      const file = await write(`export default { webcomponentPrefx: 'acme' }`)

      await expect(loadAppConfig(file)).rejects.toThrow(file)
      await expect(loadAppConfig(file)).rejects.toThrow('webcomponentPrefx')
    })

    it('rejects unknown options in sections', async () => {
      const file = await write(`export default { server: { listen: '0.0.0.0' } }`)

      await expect(loadAppConfig(file)).rejects.toThrow('listen')
    })

    it('rejects invalid values', async () => {
      const file = await write(`export default { server: { port: 70000 } }`)

      await expect(loadAppConfig(file)).rejects.toThrow('port')
    })

    it('reports syntax errors with the file location', async () => {
      const file = await write(`export default {`)

      await expect(loadAppConfig(file)).rejects.toThrow(file)
    })
  })
})
