/**
 * End-to-end: `likec4 install`, then `likec4 build` / `likec4 export json`, with git dependencies
 * served from local bare repositories (fake ssh, see the fixture). Nothing goes to the network.
 */
import type { LikeC4 } from '@likec4/language-services/node'
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import yargs from 'yargs'
import buildCmd from '../build'
import exportCmd from '../export'
import { createGitDependencyFixture } from './__fixtures__/git-dependency-fixture'
import { runInstall } from './handler'
import installCmd from './index'

// The suite runs with `--no-isolate`, and other spec files mock this module: use the actual implementation
vi.mock('@likec4/language-services/node', async importOriginal => await importOriginal())

/**
 * Element ids of each project, captured by the mocked vite build while the workspace is loaded
 */
const builtModels = new Map<string, string[]>()
/**
 * Titles of elements of each project (element id -> title), captured by the mocked vite build
 */
const builtTitles = new Map<string, Record<string, string>>()
const viteBuild = vi.hoisted(() => vi.fn<(options: { languageServices: LikeC4 }) => Promise<void>>())
vi.mock('../../vite/vite-build', () => ({ viteBuild }))
vi.mock('../check-update/utils', () => ({ notifyAvailableUpdate: vi.fn<() => Promise<void>>(async () => {}) }))
vi.mock('../ensure-libs', () => ({ ensureReact: vi.fn<() => Promise<void>>(async () => {}) }))
vi.mock('../support-message', () => ({ showSupportUsMessage: vi.fn<() => void>() }))

/**
 * Runs a CLI command in-process: the command throws instead of exiting
 */
async function runCli(cmd: (y: ReturnType<typeof yargs>) => ReturnType<typeof yargs>, ...args: string[]) {
  await cmd(yargs()).exitProcess(false).fail((msg, err) => {
    throw err ?? new Error(msg)
  }).strict(false).parseAsync(args)
}

function setup() {
  const fixture = createGitDependencyFixture()
  onTestFinished(() => fixture[Symbol.dispose]())
  for (const [name, value] of Object.entries(fixture.env)) {
    vi.stubEnv(name, value)
  }
  const tag = (bare: string, name: string, sha: string) => execFileSync('git', ['-C', bare, 'tag', name, sha])

  /**
   * Element ids of each project (own and imported), from `likec4 export json`
   */
  const exportJson = async (...args: string[]) => {
    const outfile = join(fixture.root, 'model.json')
    await runCli(exportCmd, 'export', 'json', fixture.workspace, '-o', outfile, '--skip-layout', ...args)
    const json: unknown = JSON.parse(readFileSync(outfile, 'utf8'))
    const models = (Array.isArray(json) ? json : [json]) as Array<{
      projectId: string
      elements: object
      imports: Record<string, Array<{ id: string }>>
    }>
    return new Map(models.map(model => [
      model.projectId,
      [
        ...Object.keys(model.elements),
        // imported elements are stored by the name of the dependency
        ...Object.entries(model.imports).flatMap(([name, elements]) => elements.map(e => `@${name}.${e.id}`)),
      ].sort(),
    ]))
  }

  return { fixture, tag, exportJson }
}

/**
 * Files of the billing repository: the title of each component names the version (e.g. 'api v1')
 */
const billingFiles = (version: string, ...components: string[]) => ({
  'likec4.config.json': JSON.stringify({ name: 'billing' }),
  'model.c4': `
    specification {
      element component
    }
    model {
      ${components.map(c => `component ${c} '${c} ${version}'`).join('\n')}
    }
  `,
})

/**
 * Runs `likec4 install` and checks that it did not report a failure
 */
async function install(workspace: string) {
  await runCli(installCmd, 'install', workspace)
  expect(process.exitCode).not.toBe(1)
}

// Each test stubs process.env, so they run one by one; git commands need time
describe.sequential('git dependencies end-to-end', { timeout: 30_000 }, () => {
  beforeEach(() => {
    builtModels.clear()
    builtTitles.clear()
    viteBuild.mockReset()
    viteBuild.mockImplementation(async ({ languageServices }) => {
      for (const project of languageServices.languageServices.projects()) {
        const model = await languageServices.computedModel(project.id)
        const elements = [...model.elements()]
        builtModels.set(project.id, elements.map(e => e.id).sort())
        builtTitles.set(project.id, Object.fromEntries(elements.map(e => [e.id, e.title])))
      }
    })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    process.exitCode = undefined
  })

  it('install, then build: the model contains elements of the git dependency', async () => {
    const { fixture, exportJson } = setup()
    const billing = fixture.repository('billing')
    billing.commit({
      ...billingFiles('main', 'api'),
      // a project in a subfolder of the repository
      'shared/likec4.config.json': JSON.stringify({ name: 'shared' }),
      'shared/model.c4': `
        specification {
          element queue
        }
        model {
          queue events
        }
      `,
    })
    fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({
        name: 'cloud',
        dependencies: {
          billing: { git: billing.url, ref: 'main' },
          shared: { git: billing.url, ref: 'main', path: 'shared' },
        },
      }),
      'model.c4': `
        import { api } from 'billing'
        import { events } from 'shared'
        specification {
          element system
        }
        model {
          system cloud
          cloud -> api
          cloud -> events
        }
        views {
          view index {
            include *
          }
        }
      `,
    })

    await install(fixture.workspace)
    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    expect(builtModels.get('cloud')).toEqual(['@billing.api', '@shared.events', 'cloud'])

    expect(await exportJson()).toEqual(new Map([['cloud', ['@billing.api', '@shared.events', 'cloud']]]))
  })

  it('two projects on different versions of one repository build in one workspace', async () => {
    const { fixture, tag, exportJson } = setup()
    const billing = fixture.repository('billing')
    const v1 = billing.commit(billingFiles('v1', 'api'))
    tag(billing.bare, 'v1', v1)
    const v2 = billing.commit(billingFiles('v2', 'api', 'invoices'))
    tag(billing.bare, 'v2', v2)
    // `main` moves on: the projects stay on their tags and the SHA
    billing.commit(billingFiles('main', 'api', 'invoices', 'refunds'))

    const project = (name: string, ref: string, imports: string[]) => ({
      [`${name}/likec4.config.json`]: JSON.stringify({
        name,
        dependencies: { billing: { git: billing.url, ref } },
      }),
      [`${name}/model.c4`]: `
        import { ${imports.join(', ')} } from 'billing'
        specification {
          element system
        }
        model {
          system ${name}
          ${imports.map(i => `${name} -> ${i}`).join('\n')}
        }
        views {
          view index {
            include *
          }
        }
      `,
    })
    fixture.writeWorkspace({
      ...project('legacy', 'v1', ['api']),
      ...project('modern', 'v2', ['api', 'invoices']),
      // a full commit SHA works as the ref too
      ...project('pinned', v1, ['api']),
    })

    await install(fixture.workspace)
    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    const expected = new Map([
      ['legacy', ['@billing.api', 'legacy']],
      ['modern', ['@billing.api', '@billing.invoices', 'modern']],
      ['pinned', ['@billing.api', 'pinned']],
    ])
    expect(builtModels).toEqual(expected)
    // titles tell the versions apart
    expect(builtTitles.get('legacy')).toMatchObject({ '@billing.api': 'api v1' })
    expect(builtTitles.get('modern')).toMatchObject({ '@billing.api': 'api v2', '@billing.invoices': 'invoices v2' })
    expect(builtTitles.get('pinned')).toMatchObject({ '@billing.api': 'api v1' })
    expect(await exportJson()).toEqual(expected)

    // each project sees only its version of the repository
    expect(await exportJson('-p', 'legacy')).toEqual(new Map([['legacy', ['@billing.api', 'legacy']]]))
  })

  it('one project uses two versions of one repository under different names', async () => {
    const { fixture, tag, exportJson } = setup()
    const billing = fixture.repository('billing')
    tag(billing.bare, 'v1', billing.commit(billingFiles('v1', 'api')))
    tag(billing.bare, 'v2', billing.commit(billingFiles('v2', 'api', 'invoices')))
    billing.commit(billingFiles('main', 'api', 'invoices'))
    fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({
        name: 'cloud',
        dependencies: {
          'billing-v1': { git: billing.url, ref: 'v1' },
          'billing-v2': { git: billing.url, ref: 'v2' },
        },
      }),
      'model.c4': `
        import { api } from 'billing-v1'
        import { invoices } from 'billing-v2'
        specification {
          element system
        }
        model {
          system cloud
          cloud -> api
          cloud -> invoices
        }
      `,
    })

    await install(fixture.workspace)
    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    expect(builtTitles.get('cloud')).toEqual({
      '@billing-v1.api': 'api v1',
      '@billing-v2.invoices': 'invoices v2',
      'cloud': 'cloud',
    })
    expect(await exportJson()).toEqual(new Map([['cloud', ['@billing-v1.api', '@billing-v2.invoices', 'cloud']]]))
  })

  it('git URL strings are identical to the object form, a URL without #ref follows the default branch', async () => {
    const { fixture, tag, exportJson } = setup()
    const billing = fixture.repository('billing')
    // each dependency imports its own element (an element can be imported under one name only)
    const components = ['api', 'invoices', 'refunds', 'ledger']
    const first = billing.commit(billingFiles('first', ...components))
    tag(billing.bare, 'v1', first)
    // https:// URLs are served by the fake ssh too: rewritten in the (isolated) global git configuration
    appendFileSync(
      fixture.env['GIT_CONFIG_GLOBAL']!,
      '[url "ssh://example.test/"]\n\tinsteadOf = https://git.example.test/\n',
    )
    const httpsUrl = 'https://git.example.test/billing.git'
    fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({
        name: 'cloud',
        dependencies: {
          'short': `${httpsUrl}#main`,
          'object': { git: httpsUrl, ref: 'main' },
          'pinned': `${httpsUrl}#v1`,
          // no #ref: the default branch of the repository
          'latest': billing.url,
        },
      }),
      'model.c4': `
        import { api } from 'short'
        import { invoices } from 'object'
        import { refunds } from 'pinned'
        import { ledger } from 'latest'
        specification {
          element system
        }
        model {
          system cloud
          cloud -> api
          cloud -> invoices
          cloud -> refunds
          cloud -> ledger
        }
      `,
    })
    const logs: string[] = []
    const logger = {
      info: (msg: string) => void logs.push(stripVTControlCharacters(msg)),
      error: (msg: string) => void logs.push(stripVTControlCharacters(msg)),
    }
    const runUpdate = async (update: boolean) => {
      logs.length = 0
      const result = await runInstall({ path: fixture.workspace, update }, logger)
      expect(result.ok).toBe(true)
      return new Map(result.reports.map(r => [r.name, r]))
    }

    const installed = await runUpdate(false)
    expect([...installed.values()].map(r => [r.name, r.source])).toEqual([
      ['short', { git: httpsUrl, ref: 'main' }],
      ['object', { git: httpsUrl, ref: 'main' }],
      ['pinned', { git: httpsUrl, ref: 'v1' }],
      ['latest', { git: billing.url, ref: 'HEAD' }],
    ])
    for (const report of installed.values()) {
      expect(report.result).toMatchObject({ status: 'installed', instance: { sha: first } })
    }
    // the string and the object share one instance (one SHA, one set of documents)
    expect(installed.get('short')?.result).toEqual(installed.get('object')?.result)
    expect(logs).toEqual([
      expect.stringMatching(
        /^✓ short of project 'cloud' \(https:\/\/git\.example\.test\/billing\.git#main\) installed/,
      ),
      expect.stringMatching(/^✓ object of project 'cloud' \(https:\/\/git\.example\.test\/billing\.git#main\) /),
      expect.stringMatching(/^✓ pinned of project 'cloud' \(https:\/\/git\.example\.test\/billing\.git#v1\) /),
      expect.stringMatching(/^✓ latest of project 'cloud' \(ssh:\/\/example\.test\/billing\.git#HEAD\) installed/),
    ])

    // the default branch moves on: install keeps the resolved commit, update moves it
    const second = billing.commit(billingFiles('second', ...components))
    const kept = await runUpdate(false)
    for (const report of kept.values()) {
      expect(report.result).toMatchObject({ status: 'installed', instance: { sha: first } })
    }
    const updated = await runUpdate(true)
    expect([...updated.values()].map(r => [r.name, r.previousSha, r.result])).toMatchObject([
      ['short', first, { status: 'installed', instance: { sha: second } }],
      ['object', first, { status: 'installed', instance: { sha: second } }],
      ['pinned', first, { status: 'installed', instance: { sha: first } }],
      ['latest', first, { status: 'installed', instance: { sha: second } }],
    ])
    expect(logs).toContain(
      `✓ latest of project 'cloud' (ssh://example.test/billing.git#HEAD) updated ${first.slice(0, 12)} → ${
        second.slice(0, 12)
      }`,
    )

    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    expect(builtTitles.get('cloud')).toEqual({
      '@short.api': 'api second',
      '@object.invoices': 'invoices second',
      '@pinned.refunds': 'refunds first',
      '@latest.ledger': 'ledger second',
      'cloud': 'cloud',
    })
    expect(await exportJson()).toEqual(
      new Map([['cloud', ['@latest.ledger', '@object.invoices', '@pinned.refunds', '@short.api', 'cloud']]]),
    )
  })
})
