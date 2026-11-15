/**
 * `likec4 install` / `likec4 update` and commands that read the workspace, with git dependencies
 * served from local repositories (fake ssh, see the fixture). Nothing goes to the network.
 */
import { InstallTargetNotFoundError } from '@likec4/language-services/node'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import yargs from 'yargs'
import buildCmd from '../build'
import exportCmd from '../export'
import { withWorkspaceHint } from '../update'
import { runValidate } from '../validate/handler'
import { createGitDependencyFixture } from './__fixtures__/git-dependency-fixture'
import { runInstall } from './handler'

// The suite runs with `--no-isolate`, and other spec files mock this module: use the actual implementation
vi.mock('@likec4/language-services/node', async importOriginal => await importOriginal())

const viteBuild = vi.hoisted(() => vi.fn<() => Promise<void>>(async () => {}))
vi.mock('../../vite/vite-build', () => ({ viteBuild }))
// `export png` starts the preview server after loading the workspace
const viteDev = vi.hoisted(() => vi.fn<() => Promise<never>>(async () => Promise.reject(new Error('preview server'))))
vi.mock('../../vite/vite-dev', () => ({ viteDev }))
vi.mock('../check-update/utils', () => ({ notifyAvailableUpdate: vi.fn<() => Promise<void>>(async () => {}) }))
vi.mock(
  '../ensure-libs',
  () => ({
    ensureReact: vi.fn<() => Promise<void>>(async () => {}),
    ensurePlaywright: vi.fn<() => Promise<void>>(async () => {}),
  }),
)
vi.mock('../support-message', () => ({ showSupportUsMessage: vi.fn<() => void>() }))

const { fromWorkspace } = await vi.importActual<typeof import('@likec4/language-services/node')>(
  '@likec4/language-services/node',
)

const repositoryFiles = (name: string, element: string) => ({
  'likec4.config.json': JSON.stringify({ name }),
  'model.c4': `
    specification {
      element component
    }
    model {
      component ${element}
    }
  `,
})

const NOT_INSTALLED = [
  'Dependencies are not installed:',
  `  - 'billing' of project 'cloud' (ssh://example.test/billing.git#main)`,
  `  - 'payments' of project 'cloud' (ssh://example.test/payments.git#main)`,
  'Run `likec4 install` to install them.',
].join('\n')

function setup(options?: { withoutDependencies?: boolean }) {
  const fixture = createGitDependencyFixture()
  onTestFinished(() => fixture[Symbol.dispose]())
  for (const [name, value] of Object.entries(fixture.env)) {
    vi.stubEnv(name, value)
  }
  const billing = fixture.repository('billing')
  const payments = fixture.repository('payments')
  const sha = {
    billing: billing.commit(repositoryFiles('billing', 'api')),
    payments: payments.commit(repositoryFiles('payments', 'gateway')),
  }
  if (options?.withoutDependencies) {
    fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({ name: 'cloud' }),
      'model.c4': `
        specification {
          element system
        }
        model {
          system cloud
        }
        views {
          view index {
            include *
          }
        }
      `,
    })
  } else {
    fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({
        name: 'cloud',
        dependencies: {
          billing: { git: billing.url, ref: 'main' },
          payments: { git: payments.url, ref: 'main' },
        },
      }),
      'model.c4': `
        import { api } from 'billing'
        import { gateway } from 'payments'
        specification {
          element system
        }
        model {
          system cloud
          cloud -> api
          cloud -> gateway
        }
        views {
          view index {
            include *
          }
        }
      `,
    })
  }

  const logs = { info: [] as string[], error: [] as string[] }
  const logger = {
    info: (msg: string) => void logs.info.push(stripVTControlCharacters(msg)),
    error: (msg: string) => void logs.error.push(stripVTControlCharacters(msg)),
  }
  const install = (opts?: { update?: boolean; name?: string; project?: string }) => {
    logs.info.length = 0
    logs.error.length = 0
    return runInstall({ path: fixture.workspace, update: false, ...opts }, logger)
  }
  /**
   * Adds the project 'other' (in the folder `other`) without git dependencies
   */
  const addOtherProject = () =>
    fixture.writeWorkspace({
      'other/likec4.config.json': JSON.stringify({ name: 'other' }),
      'other/model.c4': `
        specification {
          element system
        }
        model {
          system other
        }
        views {
          view index {
            include *
          }
        }
      `,
    })

  return { fixture, billing, payments, sha, logs, install, addOtherProject }
}

/**
 * Runs a CLI command in-process: the command throws instead of exiting
 */
async function runCli(cmd: (y: ReturnType<typeof yargs>) => ReturnType<typeof yargs>, ...args: string[]) {
  await cmd(yargs()).exitProcess(false).fail((msg, err) => {
    throw err ?? new Error(msg)
  }).strict(false).parseAsync(args)
}

// Each test stubs process.env, so they run one by one
describe.sequential('likec4 install / update', () => {
  beforeEach(() => {
    viteBuild.mockClear()
    viteDev.mockClear()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('install fills the cache, a repeated run downloads nothing', async () => {
    const t = setup()
    expect(t.fixture.cacheFiles()).toEqual([])

    const first = await t.install()
    expect(first.ok).toBe(true)
    expect(first.reports.map(r => [r.name, r.result])).toMatchObject([
      ['billing', { status: 'installed', cached: false, instance: { sha: t.sha.billing } }],
      ['payments', { status: 'installed', cached: false, instance: { sha: t.sha.payments } }],
    ])
    expect(t.logs.info).toEqual([
      expect.stringMatching(/^✓ billing of project 'cloud' .* installed at [0-9a-f]{12} \(2 files\)$/),
      expect.stringMatching(/^✓ payments of project 'cloud' .* installed at [0-9a-f]{12} \(2 files\)$/),
    ])
    const cache = t.fixture.cacheFiles()
    expect(cache.length).toBeGreaterThan(0)
    // LIKEC4_CACHE_DIR is the root of the cache, dependencies are in its `dependencies` folder
    expect(cache.every(file => file.startsWith('dependencies/'))).toBe(true)

    // the remotes are gone: a repeated run must not touch them
    rmSync(t.billing.bare, { recursive: true, force: true })
    rmSync(t.payments.bare, { recursive: true, force: true })
    const second = await t.install()
    expect(second.ok).toBe(true)
    expect(second.reports.map(r => [r.name, r.result])).toMatchObject([
      ['billing', { status: 'installed', cached: true, instance: { sha: t.sha.billing } }],
      ['payments', { status: 'installed', cached: true, instance: { sha: t.sha.payments } }],
    ])
    expect(t.logs.info).toEqual([
      expect.stringMatching(/^✓ billing of project 'cloud' .* already installed at [0-9a-f]{12}$/),
      expect.stringMatching(/^✓ payments of project 'cloud' .* already installed at [0-9a-f]{12}$/),
    ])
    expect(t.fixture.cacheFiles()).toEqual(cache)
  })

  it('install keeps resolved refs, update without a name moves all of them', async () => {
    const t = setup()
    await t.install()
    const billing2 = t.billing.commit({ 'more.c4': 'model { component billing2 }' })
    const payments2 = t.payments.commit({ 'more.c4': 'model { component payments2 }' })

    // install keeps the commits of the version index
    const install = await t.install()
    expect(install.reports.map(r => r.result)).toMatchObject([
      { status: 'installed', instance: { sha: t.sha.billing } },
      { status: 'installed', instance: { sha: t.sha.payments } },
    ])

    const update = await t.install({ update: true })
    expect(update.ok).toBe(true)
    expect(update.reports.map(r => [r.name, r.previousSha, r.result])).toMatchObject([
      ['billing', t.sha.billing, { status: 'installed', instance: { sha: billing2 } }],
      ['payments', t.sha.payments, { status: 'installed', instance: { sha: payments2 } }],
    ])
    expect(t.logs.info).toEqual([
      `✓ billing of project 'cloud' (ssh://example.test/billing.git#main) updated ${t.sha.billing.slice(0, 12)} → ${
        billing2.slice(0, 12)
      }`,
      `✓ payments of project 'cloud' (ssh://example.test/payments.git#main) updated ${t.sha.payments.slice(0, 12)} → ${
        payments2.slice(0, 12)
      }`,
    ])

    // nothing new: up to date
    await t.install({ update: true })
    expect(t.logs.info).toEqual([
      expect.stringMatching(/^✓ billing .* up to date at [0-9a-f]{12}$/),
      expect.stringMatching(/^✓ payments .* up to date at [0-9a-f]{12}$/),
    ])

    await using likec4 = await fromWorkspace(t.fixture.workspace, { printErrors: false })
    const model = await likec4.computedModel('cloud')
    expect([...model.elements()].map(e => e.id)).toEqual(expect.arrayContaining(['cloud']))
  })

  it('update with a name moves only that dependency', async () => {
    const t = setup()
    await t.install()
    const billing2 = t.billing.commit({ 'more.c4': 'model { component billing2 }' })
    t.payments.commit({ 'more.c4': 'model { component payments2 }' })

    const update = await t.install({ update: true, name: 'billing' })
    expect(update.ok).toBe(true)
    expect(update.reports.map(r => [r.name, r.result])).toMatchObject([
      ['billing', { status: 'installed', instance: { sha: billing2 } }],
    ])

    // payments stays at the old commit
    const install = await t.install()
    expect(install.reports.map(r => [r.name, r.result])).toMatchObject([
      ['billing', { status: 'installed', cached: true, instance: { sha: billing2 } }],
      ['payments', { status: 'installed', cached: true, instance: { sha: t.sha.payments } }],
    ])

    await expect(t.install({ update: true, name: 'unknown' })).rejects.toThrow(`Git dependency 'unknown' not found`)
  })

  it('reports failed installs', async () => {
    const t = setup()
    rmSync(t.payments.bare, { recursive: true, force: true })
    const result = await t.install()
    expect(result.ok).toBe(false)
    expect(t.logs.info).toEqual([expect.stringMatching(/^✓ billing .* installed at/)])
    expect(t.logs.error).toEqual([expect.stringMatching(/^✗ payments of project 'cloud' .* failed: /)])
  })

  it('LIKEC4_CACHE_DIR changes the cache directory', async () => {
    const t = setup()
    await t.install()
    expect(existsSync(join(t.fixture.cacheDir, 'dependencies'))).toBe(true)

    // another cache directory: nothing is installed there
    const other = join(t.fixture.root, 'other-cache')
    vi.stubEnv('LIKEC4_CACHE_DIR', other)
    await expect(fromWorkspace(t.fixture.workspace, { printErrors: false, requireInstalledDependencies: true }))
      .rejects.toThrow(NOT_INSTALLED)
    await t.install()
    expect(existsSync(join(other, 'dependencies'))).toBe(true)
    await using likec4 = await fromWorkspace(t.fixture.workspace, {
      printErrors: false,
      requireInstalledDependencies: true,
    })
    expect(likec4.getErrors()).toEqual([])
  })

  it('a workspace without git dependencies needs no install', async () => {
    const t = setup({ withoutDependencies: true })
    const result = await t.install()
    expect(result).toEqual({ ok: true, reports: [] })
    expect(t.logs.info).toEqual(['no git dependencies'])

    await runCli(buildCmd, 'build', t.fixture.workspace, '-o', join(t.fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()

    const outfile = join(t.fixture.root, 'model.json')
    await runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile)
    expect(existsSync(outfile)).toBe(true)
    expect(t.fixture.cacheFiles()).toEqual([])
  })

  it('rejects an unknown project or dependency with an expected error', async () => {
    const t = setup()
    await expect(t.install({ project: 'nope' })).rejects.toThrow(
      new InstallTargetNotFoundError('project', `Project 'nope' not found`),
    )
    const error = await t.install({ update: true, name: 'nope' }).then(() => undefined, (e: unknown) => e)
    expect(error).toBeInstanceOf(InstallTargetNotFoundError)
    // `likec4 update <path>` reads the path as a name: the message hints at --path
    expect(withWorkspaceHint(error, t.fixture.workspace)).toEqual(
      new InstallTargetNotFoundError(
        'dependency',
        `Git dependency 'nope' not found in the workspace ${t.fixture.workspace} (pass the workspace with --path)`,
      ),
    )
    expect(t.fixture.cacheFiles()).toEqual([])
  })

  it('install --project installs dependencies of that project only', async () => {
    const t = setup()
    t.addOtherProject()
    expect(await t.install({ project: 'other' })).toEqual({ ok: true, reports: [] })
    expect(t.fixture.cacheFiles()).toEqual([])
    const result = await t.install({ project: 'cloud' })
    expect(result.reports.map(r => [r.projectId, r.name])).toEqual([['cloud', 'billing'], ['cloud', 'payments']])
  })

  describe('commands that read the workspace', () => {
    it('with --project, require only dependencies of that project', async () => {
      const t = setup()
      t.addOtherProject()
      const outfile = join(t.fixture.root, 'model.json')
      // 'other' has no git dependencies
      await runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile, '--skip-layout', '-p', 'other')
      const json = JSON.parse(readFileSync(outfile, 'utf8')) as { projectId: string }
      expect(json.projectId).toBe('other')
      // 'cloud' and the whole workspace need the install
      await expect(
        runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile, '--skip-layout', '-p', 'cloud'),
      ).rejects.toThrow(NOT_INSTALLED)
      await expect(runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile, '--skip-layout'))
        .rejects.toThrow(NOT_INSTALLED)
      expect(t.fixture.cacheFiles()).toEqual([])
    })

    it('build fails without install, passes after install', async () => {
      const t = setup()
      const outdir = join(t.fixture.root, 'dist')
      await expect(runCli(buildCmd, 'build', t.fixture.workspace, '-o', outdir)).rejects.toThrow(NOT_INSTALLED)
      expect(viteBuild).not.toHaveBeenCalled()
      // nothing is downloaded
      expect(t.fixture.cacheFiles()).toEqual([])

      await t.install()
      await runCli(buildCmd, 'build', t.fixture.workspace, '-o', outdir)
      expect(viteBuild).toHaveBeenCalledOnce()
    })

    it('export json fails without install, passes after install', async () => {
      const t = setup()
      const outfile = join(t.fixture.root, 'model.json')
      await expect(runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile)).rejects.toThrow(
        NOT_INSTALLED,
      )
      expect(existsSync(outfile)).toBe(false)
      expect(t.fixture.cacheFiles()).toEqual([])

      await t.install()
      await runCli(exportCmd, 'export', 'json', t.fixture.workspace, '-o', outfile, '--skip-layout')
      // one model per project of the workspace
      const json: unknown = JSON.parse(readFileSync(outfile, 'utf8'))
      const models = (Array.isArray(json) ? json : [json]) as Array<{ projectId: string; relations: object }>
      expect(models.length).toBeGreaterThan(0)
      for (const model of models) {
        expect(model.projectId).toBe('cloud')
        expect(Object.keys(model.relations)).toHaveLength(2)
      }
    })

    it('export png fails without install, loads the workspace after install', async () => {
      const t = setup()
      const outdir = join(t.fixture.root, 'png')
      await expect(runCli(exportCmd, 'export', 'png', t.fixture.workspace, '-o', outdir)).rejects.toThrow(
        NOT_INSTALLED,
      )
      expect(viteDev).not.toHaveBeenCalled()

      await t.install()
      // the workspace is loaded, the export goes on to the preview server (mocked to fail)
      await expect(runCli(exportCmd, 'export', 'png', t.fixture.workspace, '-o', outdir)).rejects.toThrow(
        'preview server',
      )
      expect(viteDev).toHaveBeenCalledOnce()
    })

    it('validate fails without install, passes after install', async () => {
      const t = setup()
      const options = { path: t.fixture.workspace, layout: false, json: true }
      const logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
      const print = () => {}
      {
        await using likec4 = await fromWorkspace(t.fixture.workspace, { printErrors: false })
        const result = await runValidate(likec4, options, logger, print)
        expect(result.valid).toBe(false)
        expect(result.errors.map(e => e.message)).toEqual(expect.arrayContaining([
          `Dependency 'billing' is not installed. Run the quick fix or \`likec4 install\`.`,
          `Dependency 'payments' is not installed. Run the quick fix or \`likec4 install\`.`,
        ]))
      }
      expect(t.fixture.cacheFiles()).toEqual([])

      await t.install()
      await using likec4 = await fromWorkspace(t.fixture.workspace, { printErrors: false })
      const result = await runValidate(likec4, options, logger, print)
      expect(result.errors).toEqual([])
      expect(result.valid).toBe(true)
    })
  })
})
