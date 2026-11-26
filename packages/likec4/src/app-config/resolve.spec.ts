import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveAppConfig } from './resolve'

vi.mock('is-inside-container', () => ({ default: () => false }))

describe('resolveAppConfig', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await realpath(await mkdtemp(join(tmpdir(), 'likec4-app-config-')))
  })

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  const writeConfig = async (folder: string, config: object, filename = 'likec4.app.config.mjs') => {
    await mkdir(folder, { recursive: true })
    const file = join(folder, filename)
    await writeFile(file, `export default ${JSON.stringify(config)}`)
    return file
  }

  it('uses defaults without flags and config', async () => {
    expect(await resolveAppConfig({}, { cwd, env: {} })).toEqual({
      configFile: undefined,
      workspace: cwd,
      graphviz: 'wasm',
      title: 'LikeC4',
      theme: undefined,
      useHashHistory: false,
      webcomponentPrefix: 'likec4',
      customization: undefined,
      base: undefined,
      publicDir: undefined,
      build: { outDir: undefined, singleFile: false, webcomponent: true },
      server: { host: undefined, port: undefined, hmrPort: undefined, allowedHosts: undefined },
    })
  })

  describe('locating the config', () => {
    it('finds the config in the current directory', async () => {
      const configFile = await writeConfig(cwd, { title: 'From cwd', workspace: './src' })

      expect(await resolveAppConfig({}, { cwd, env: {} })).toMatchObject({
        configFile,
        title: 'From cwd',
        workspace: join(cwd, 'src'),
      })
    })

    it('prefers the config in the explicit workspace over the current directory', async () => {
      await writeConfig(cwd, { title: 'From cwd' })
      const workspace = join(cwd, 'src')
      const configFile = await writeConfig(workspace, { title: 'From workspace' })

      expect(await resolveAppConfig({ path: workspace }, { cwd, env: {} })).toMatchObject({
        configFile,
        title: 'From workspace',
        workspace,
      })
    })

    it('uses the file from --app-config', async () => {
      await writeConfig(cwd, { title: 'From cwd' })
      const configFile = await writeConfig(join(cwd, 'configs'), { title: 'Explicit' }, 'docs.config.mjs')

      expect(await resolveAppConfig({ appConfig: 'configs/docs.config.mjs' }, { cwd, env: {} })).toMatchObject({
        configFile,
        title: 'Explicit',
      })
    })

    it('fails when the file from --app-config does not exist', async () => {
      await expect(resolveAppConfig({ appConfig: 'missing.ts' }, { cwd, env: {} })).rejects.toThrow(
        join(cwd, 'missing.ts'),
      )
    })

    it('does not look for the config with --no-app-config', async () => {
      await writeConfig(cwd, { title: 'From cwd' })

      expect(await resolveAppConfig({ appConfig: false }, { cwd, env: {} })).toMatchObject({
        configFile: undefined,
        title: 'LikeC4',
      })
    })
  })

  describe('precedence', () => {
    it('explicit path wins over the workspace from the config', async () => {
      await writeConfig(cwd, { workspace: './from-config' })
      const path = join(cwd, 'from-flag')

      expect(await resolveAppConfig({ path }, { cwd, env: {} })).toMatchObject({ workspace: path })
    })

    it('LIKEC4_WORKSPACE wins over the workspace from the config', async () => {
      await writeConfig(cwd, { workspace: './from-config' })

      expect(await resolveAppConfig({}, { cwd, env: { LIKEC4_WORKSPACE: 'from-env' } })).toMatchObject({
        workspace: join(cwd, 'from-env'),
      })
    })

    it('flags win over the config', async () => {
      await writeConfig(cwd, {
        title: 'Config',
        theme: 'dark',
        useHashHistory: true,
        webcomponentPrefix: 'config',
        customization: './config.tsx',
        graphviz: 'binary',
        base: '/config/',
        publicDir: './config-public',
        build: { outDir: './config-dist', singleFile: true, webcomponent: false },
        server: { host: '0.0.0.0', port: 5000, hmrPort: 5001, allowedHosts: ['config.dev'] },
      })

      const resolved = await resolveAppConfig({
        title: 'Flag',
        theme: 'light',
        useHashHistory: false,
        webcomponentPrefix: 'flag',
        customization: '/flag.tsx',
        useDot: false,
        base: '/flag/',
        publicDir: '/flag-public',
        output: '/flag-dist',
        outputSingleFile: false,
        buildWebcomponent: true,
        listen: '127.0.0.1',
        port: 6000,
        hmrPort: 6001,
        allowedHosts: ['flag.dev'],
      }, { cwd, env: {} })

      expect(resolved).toMatchObject({
        title: 'Flag',
        theme: 'light',
        useHashHistory: false,
        webcomponentPrefix: 'flag',
        customization: '/flag.tsx',
        graphviz: 'wasm',
        base: '/flag/',
        publicDir: '/flag-public',
        build: { outDir: '/flag-dist', singleFile: false, webcomponent: true },
        server: { host: '127.0.0.1', port: 6000, hmrPort: 6001, allowedHosts: ['flag.dev'] },
      })
    })

    it('the config wins over defaults', async () => {
      await writeConfig(cwd, {
        graphviz: 'binary',
        build: { webcomponent: false },
        server: { port: 5000, hmrPort: 5001 },
      })

      expect(await resolveAppConfig({}, { cwd, env: {} })).toMatchObject({
        graphviz: 'binary',
        build: { singleFile: false, webcomponent: false },
        server: { port: 5000, hmrPort: 5001 },
      })
    })

    it('ports: flag, then environment, then the config', async () => {
      await writeConfig(cwd, { server: { port: 5000, hmrPort: 5001 } })
      const env = { PORT: '7000', HMR_PORT: '7001' }

      expect(await resolveAppConfig({}, { cwd, env })).toMatchObject({
        server: { port: 7000, hmrPort: 7001 },
      })
      expect(await resolveAppConfig({ port: 8000 }, { cwd, env })).toMatchObject({
        server: { port: 8000, hmrPort: 7001 },
      })
    })
  })
})
