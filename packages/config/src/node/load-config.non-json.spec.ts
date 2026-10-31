import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadConfig } from './load-config'

describe('loadConfig - non-JSON branch', () => {
  let root: string
  let projectDir: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'likec4-load-config-'))
    projectDir = join(root, 'my-project')
    await mkdir(projectDir)
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  const write = async (relativePath: string, content: string) => {
    const filepath = join(projectDir, relativePath)
    await mkdir(dirname(filepath), { recursive: true })
    await writeFile(filepath, content)
    return filepath
  }

  it('should load TypeScript config with local imports and TS-only syntax', async () => {
    await write(
      'shared/colors.ts',
      `
      export enum Kind { Primary = 'primary' }
      export const brand: string = '#ff0000'
      `,
    )
    const filepath = await write(
      'likec4.config.ts',
      `
      import { defineConfig, defineStyle } from 'likec4/config'
      import type { Unknown } from './does-not-exist'
      import { brand, Kind } from './shared/colors'

      interface Extra { title: string }
      const extra: Extra = await Promise.resolve({ title: 'Project Title' })

      export default defineConfig({
        name: 'ts-project-' + Kind.Primary,
        title: extra.title,
        styles: defineStyle({
          theme: {
            colors: {
              primary: brand,
            },
          },
        }),
      })
      `,
    )

    const config = await loadConfig(filepath)
    expect(config.name).toBe('ts-project-primary')
    expect(config.title).toBe('Project Title')
    expect(config.styles?.theme?.colors?.['primary']).toMatchObject({
      elements: { fill: '#ff0000' },
    })
  })

  it('should resolve @likec4/config without installed package', async () => {
    const filepath = await write(
      'likec4.config.mts',
      `
      import { defineConfig, defineGenerators } from '@likec4/config'
      export default defineConfig({
        name: 'with-generators',
        generators: defineGenerators({
          hello: async () => {},
        }),
      })
      `,
    )

    const config = await loadConfig(filepath)
    expect(config.name).toBe('with-generators')
    expect(config.generators?.['hello']).toBeTypeOf('function')
  })

  it('should use directory name as implicit project name', async () => {
    const filepath = await write('likec4.config.mjs', `export default { title: 'No name' }`)

    const config = await loadConfig(filepath)
    expect(config.name).toBe('my-project')
    expect(config.title).toBe('No name')
  })

  it('should load CommonJS config', async () => {
    const filepath = await write('likec4.config.cjs', `module.exports = { name: 'cjs-project' }`)

    const config = await loadConfig(filepath)
    expect(config.name).toBe('cjs-project')
  })

  it('should provide import.meta of the config file', async () => {
    const filepath = await write(
      'likec4.config.ts',
      `export default { name: import.meta.dirname.split(/[\\\\/]/).pop() + '-meta' }`,
    )

    const config = await loadConfig(filepath)
    expect(config.name).toBe('my-project-meta')
  })

  it('should reload config and its imports after changes', async () => {
    await write('name.ts', `export const name = 'first'`)
    const filepath = await write(
      'likec4.config.ts',
      `
      import { name } from './name'
      export default { name }
      `,
    )
    expect((await loadConfig(filepath)).name).toBe('first')

    await write('name.ts', `export const name = 'second'`)
    expect((await loadConfig(filepath)).name).toBe('second')
  })

  it('should not leave any files next to the config', async () => {
    const filepath = await write('likec4.config.ts', `export default { name: 'clean' }`)

    await loadConfig(filepath)
    expect(await readdir(projectDir)).toEqual(['likec4.config.ts'])
  })

  it('should reject on syntax errors with config path', async () => {
    const filepath = await write(
      'likec4.config.ts',
      `
      export default {
        name: 'broken',
        styles: { ,
      }
      `,
    )

    await expect(loadConfig(filepath)).rejects.toThrow(filepath)
  })

  it('should reject invalid config', async () => {
    const filepath = await write('likec4.config.ts', `export default { name: 'invalid', exclude: 123 }`)

    await expect(loadConfig(filepath)).rejects.toThrow(/exclude/)
  })
})
