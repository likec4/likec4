import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import yargs from 'yargs'

const reactHandler = vi.hoisted(() => vi.fn<(params: Record<string, unknown>) => Promise<void>>())
const webcomponentHandler = vi.hoisted(() => vi.fn<(params: Record<string, unknown>) => Promise<void>>())
const modelHandler = vi.hoisted(() => vi.fn<(params: Record<string, unknown>) => Promise<void>>())
const customHandler = vi.hoisted(() => vi.fn<(params: Record<string, unknown>) => Promise<void>>())

// Every handler is mocked: the spec is about the wiring of the commands,
// and the real handlers must not be evaluated here (specs share the module cache)
vi.mock('./react', () => ({ reactHandler }))
vi.mock('./webcomponent/handler', () => ({ webcomponentHandler }))
vi.mock('./model', () => ({ modelHandler }))
vi.mock('./custom', () => ({ customHandler }))
vi.mock('./handler', () => ({ legacyHandler: vi.fn<() => Promise<void>>() }))
vi.mock('./leanix-dry-run', () => ({ leanixDryRunHandler: vi.fn<() => Promise<void>>() }))
vi.mock('./leanix-inventory-snapshot', () => ({ leanixInventorySnapshotHandler: vi.fn<() => Promise<void>>() }))
vi.mock('./leanix-reconcile', () => ({ leanixReconcileHandler: vi.fn<() => Promise<void>>() }))
vi.mock('../support-message', () => ({ showSupportUsMessage: vi.fn<() => void>() }))

describe('codegen command', () => {
  let cwd: string

  beforeEach(async () => {
    vi.clearAllMocks()
    cwd = await realpath(await mkdtemp(join(tmpdir(), 'likec4-codegen-cmd-')))
    vi.spyOn(process, 'cwd').mockReturnValue(cwd)
    vi.stubEnv('LIKEC4_WORKSPACE', '')
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    await rm(cwd, { recursive: true, force: true })
  })

  const writeAppConfig = async (config: object, folder = cwd) => {
    await mkdir(folder, { recursive: true })
    await writeFile(join(folder, 'likec4.app.config.mjs'), `export default ${JSON.stringify(config)}`)
  }

  const run = async (...argv: string[]) => {
    const { default: codegenCmd } = await import('./index')
    await codegenCmd(yargs(['gen', ...argv])).exitProcess(false).fail(false).parseAsync()
  }

  describe('react', () => {
    it('uses defaults without the app config', async () => {
      await run('react')

      expect(reactHandler).toHaveBeenCalledOnce()
      expect(reactHandler.mock.calls[0]![0]).toMatchObject({
        path: cwd,
        customization: undefined,
      })
    })

    it('takes workspace, graphviz and customization from the app config', async () => {
      await writeAppConfig({
        workspace: './src',
        graphviz: 'binary',
        customization: './likec4.customization.tsx',
      })

      await run('react')

      expect(reactHandler.mock.calls[0]![0]).toMatchObject({
        path: join(cwd, 'src'),
        useDotBin: true,
        customization: join(cwd, 'likec4.customization.tsx'),
      })
    })

    it('prefers flags over the app config', async () => {
      await writeAppConfig({
        workspace: './src',
        graphviz: 'binary',
        customization: './likec4.customization.tsx',
      })

      await run('react', './other', '--no-use-dot', '--customization', './flag.tsx', '-o', 'out/views.mjs')

      expect(reactHandler.mock.calls[0]![0]).toMatchObject({
        path: join(cwd, 'other'),
        useDotBin: false,
        customization: join(cwd, 'flag.tsx'),
        outfile: join(cwd, 'out/views.mjs'),
      })
    })

    it('finds the app config in the given path', async () => {
      const workspace = join(cwd, 'docs')
      await writeAppConfig({ customization: './custom.tsx' }, workspace)

      await run('react', './docs')

      expect(reactHandler.mock.calls[0]![0]).toMatchObject({
        path: workspace,
        customization: join(workspace, 'custom.tsx'),
      })
    })

    it('ignores the app config with --no-app-config', async () => {
      await writeAppConfig({ workspace: './src', customization: './likec4.customization.tsx' })

      await run('react', '--no-app-config')

      expect(reactHandler.mock.calls[0]![0]).toMatchObject({
        path: cwd,
        customization: undefined,
      })
    })
  })

  describe('webcomponent', () => {
    it('uses defaults without the app config', async () => {
      await run('webcomponent')

      expect(webcomponentHandler).toHaveBeenCalledOnce()
      expect(webcomponentHandler.mock.calls[0]![0]).toMatchObject({
        path: cwd,
        webcomponentPrefix: 'likec4',
        customization: undefined,
      })
    })

    it('takes the prefix and customization from the app config', async () => {
      await writeAppConfig({
        workspace: './src',
        webcomponentPrefix: 'acme',
        customization: './likec4.customization.tsx',
      })

      await run('webcomponent')

      expect(webcomponentHandler.mock.calls[0]![0]).toMatchObject({
        path: join(cwd, 'src'),
        webcomponentPrefix: 'acme',
        customization: join(cwd, 'likec4.customization.tsx'),
      })
    })

    it('prefers the prefix from the flag', async () => {
      await writeAppConfig({ webcomponentPrefix: 'acme' })

      await run('webcomponent', '-w', 'c4')

      expect(webcomponentHandler.mock.calls[0]![0]).toMatchObject({ webcomponentPrefix: 'c4' })
    })
  })

  describe('commands that do not read the app config', () => {
    it('model keeps the current directory as the default path', async () => {
      await writeAppConfig({ workspace: './src' })

      await run('model')

      expect(modelHandler).toHaveBeenCalledOnce()
      expect(modelHandler.mock.calls[0]![0]).toMatchObject({ path: cwd })
    })

    it('custom generator keeps the current directory as the default path', async () => {
      await run('my-generator')

      expect(customHandler).toHaveBeenCalledOnce()
      expect(customHandler.mock.calls[0]![0]).toMatchObject({ path: cwd })
    })
  })
})
