/**
 * End-to-end: `likec4 install`, then `likec4 build` / `likec4 export json`, with git dependencies
 * served from local bare repositories (fake ssh, see the fixture). Nothing goes to the network.
 */
import type { LikeC4 } from '@likec4/language-services/node'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import yargs from 'yargs'
import buildCmd from '../build'
import exportCmd from '../export'
import { createGitDependencyFixture } from './__fixtures__/git-dependency-fixture'
import installCmd from './index'

// The suite runs with `--no-isolate`, and other spec files mock this module: use the actual implementation
vi.mock('@likec4/language-services/node', async importOriginal => await importOriginal())

/**
 * Element ids of each project, captured by the mocked vite build while the workspace is loaded
 */
const builtModels = new Map<string, string[]>()
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

const billingFiles = (...components: string[]) => ({
  'likec4.config.json': JSON.stringify({ name: 'billing' }),
  'model.c4': `
    specification {
      element component
    }
    model {
      ${components.map(c => `component ${c}`).join('\n')}
    }
  `,
})

describe.sequential('git dependencies end-to-end', () => {
  beforeEach(() => {
    builtModels.clear()
    viteBuild.mockReset()
    viteBuild.mockImplementation(async ({ languageServices }) => {
      for (const project of languageServices.languageServices.projects()) {
        const model = await languageServices.computedModel(project.id)
        builtModels.set(project.id, [...model.elements()].map(e => e.id).sort())
      }
    })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('install, then build: the model contains elements of the git dependency', async () => {
    const { fixture, exportJson } = setup()
    const billing = fixture.repository('billing')
    billing.commit({
      ...billingFiles('api'),
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

    await runCli(installCmd, 'install', fixture.workspace)
    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    expect(builtModels.get('cloud')).toEqual(['@billing.api', '@shared.events', 'cloud'])

    expect(await exportJson()).toEqual(new Map([['cloud', ['@billing.api', '@shared.events', 'cloud']]]))
  })

  it('two projects on different versions of one repository build in one workspace', async () => {
    const { fixture, tag, exportJson } = setup()
    const billing = fixture.repository('billing')
    const v1 = billing.commit(billingFiles('api'))
    tag(billing.bare, 'v1', v1)
    const v2 = billing.commit(billingFiles('api', 'invoices'))
    tag(billing.bare, 'v2', v2)
    // `main` moves on: the projects stay on their tags
    billing.commit(billingFiles('api', 'invoices', 'refunds'))

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

    await runCli(installCmd, 'install', fixture.workspace)
    await runCli(buildCmd, 'build', fixture.workspace, '-o', join(fixture.root, 'dist'))
    expect(viteBuild).toHaveBeenCalledOnce()
    const expected = new Map([
      ['legacy', ['@billing.api', 'legacy']],
      ['modern', ['@billing.api', '@billing.invoices', 'modern']],
      ['pinned', ['@billing.api', 'pinned']],
    ])
    expect(builtModels).toEqual(expected)
    expect(await exportJson()).toEqual(expected)

    // each project sees only its version of the repository
    expect(await exportJson('-p', 'legacy')).toEqual(new Map([['legacy', ['@billing.api', 'legacy']]]))
  })

  it('one project uses two versions of one repository under different names', async () => {
    const { fixture, tag, exportJson } = setup()
    const billing = fixture.repository('billing')
    tag(billing.bare, 'v1', billing.commit(billingFiles('api')))
    tag(billing.bare, 'v2', billing.commit(billingFiles('api', 'invoices')))
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

    await runCli(installCmd, 'install', fixture.workspace)
    expect(await exportJson()).toEqual(new Map([['cloud', ['@billing-v1.api', '@billing-v2.invoices', 'cloud']]]))
  })
})
