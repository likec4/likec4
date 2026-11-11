import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import yargs from 'yargs'

type MockLikeC4 = {
  workspace: string
  languageServices: { projects: () => never[] }
  [Symbol.asyncDispose]: () => Promise<void>
}

const fromWorkspace = vi.hoisted(() => vi.fn<(path: string, options: Record<string, unknown>) => Promise<MockLikeC4>>())
const viteDev = vi.hoisted(() => vi.fn<(config: Record<string, unknown>) => Promise<{ close: () => Promise<void> }>>())

vi.mock('@likec4/language-services/node', () => ({ fromWorkspace }))
vi.mock('../../../vite/vite-dev', () => ({ viteDev }))
vi.mock('../../../vite/printServerUrls', () => ({ resolveServerUrl: () => 'http://localhost:5173/' }))
vi.mock('../../ensure-libs', () => ({
  ensureReact: vi.fn<() => Promise<void>>(),
  ensurePlaywright: vi.fn<() => Promise<void>>(),
}))

describe('export png and jpg commands', () => {
  let cwd: string

  beforeEach(async () => {
    vi.clearAllMocks()
    cwd = await realpath(await mkdtemp(join(tmpdir(), 'likec4-export-cmd-')))
    vi.spyOn(process, 'cwd').mockReturnValue(cwd)
    vi.stubEnv('LIKEC4_WORKSPACE', '')
    // No projects: the export starts the server and has nothing to capture
    fromWorkspace.mockImplementation(async workspace => ({
      workspace,
      languageServices: { projects: () => [] },
      [Symbol.asyncDispose]: async () => {},
    }))
    viteDev.mockResolvedValue({ close: async () => {} })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    await rm(cwd, { recursive: true, force: true })
  })

  const writeAppConfig = async (config: object) => {
    await writeFile(join(cwd, 'likec4.app.config.mjs'), `export default ${JSON.stringify(config)}`)
  }

  const run = async (format: 'png' | 'jpg', ...argv: string[]) => {
    const { pngCmd } = await import('./handler')
    const { jpgCmd } = await import('../jpg/handler')
    await jpgCmd(pngCmd(yargs([format, ...argv]))).exitProcess(false).fail(false).parseAsync()
  }

  describe.each(['png', 'jpg'] as const)('export %s', (format) => {
    it('uses defaults without the app config', async () => {
      await run(format)

      expect(fromWorkspace).toHaveBeenCalledOnce()
      expect(fromWorkspace.mock.calls[0]![0]).toBe(cwd)
      expect(viteDev).toHaveBeenCalledOnce()
      expect(viteDev.mock.calls[0]![0]).toMatchObject({ customization: undefined })
    })

    it('takes workspace, graphviz and customization from the app config', async () => {
      await writeAppConfig({
        workspace: './src',
        graphviz: 'binary',
        customization: './likec4.customization.tsx',
      })

      await run(format)

      expect(fromWorkspace.mock.calls[0]![0]).toBe(join(cwd, 'src'))
      expect(fromWorkspace.mock.calls[0]![1]).toMatchObject({ graphviz: 'binary' })
      expect(viteDev.mock.calls[0]![0]).toMatchObject({
        customization: join(cwd, 'likec4.customization.tsx'),
      })
    })

    it('prefers flags over the app config', async () => {
      await writeAppConfig({
        workspace: './src',
        graphviz: 'binary',
        customization: './likec4.customization.tsx',
      })

      await run(format, './other', '--no-use-dot', '--customization', './flag.tsx')

      expect(fromWorkspace.mock.calls[0]![0]).toBe(join(cwd, 'other'))
      expect(fromWorkspace.mock.calls[0]![1]).toMatchObject({ graphviz: 'wasm' })
      expect(viteDev.mock.calls[0]![0]).toMatchObject({ customization: join(cwd, 'flag.tsx') })
    })

    it('ignores the app config with --no-app-config', async () => {
      await writeAppConfig({ workspace: './src', customization: './likec4.customization.tsx' })

      await run(format, '--no-app-config')

      expect(fromWorkspace.mock.calls[0]![0]).toBe(cwd)
      expect(viteDev.mock.calls[0]![0]).toMatchObject({ customization: undefined })
    })

    it('does not start the server with --server-url', async () => {
      await writeAppConfig({ customization: './likec4.customization.tsx' })

      await run(format, '--server-url', 'http://localhost:5173')

      expect(fromWorkspace).toHaveBeenCalledOnce()
      expect(viteDev).not.toHaveBeenCalled()
    })
  })
})
