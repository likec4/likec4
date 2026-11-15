import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import {
  DependenciesNotInstalledError,
  fromWorkspace,
  installWorkspaceDependencies,
} from '../node'
import { createGitDependencyFixture } from './git-dependency-fixture'

const billingFiles = {
  'likec4.config.json': JSON.stringify({ name: 'billing' }),
  'model.c4': `
    specification {
      element component
    }
    model {
      component api
    }
  `,
}

function setup() {
  const fixture = createGitDependencyFixture()
  onTestFinished(() => fixture[Symbol.dispose]())
  for (const [name, value] of Object.entries(fixture.env)) {
    vi.stubEnv(name, value)
  }
  const billing = fixture.repository('billing')
  const sha = billing.commit(billingFiles)
  fixture.writeWorkspace({
    'likec4.config.json': JSON.stringify({
      name: 'cloud',
      dependencies: {
        billing: { git: billing.url, ref: 'main' },
      },
    }),
    'model.c4': `
      import { api } from 'billing'
      specification {
        element system
      }
      model {
        system cloud
        cloud -> api
      }
    `,
  })
  return { fixture, billing, sha }
}

const options = { printErrors: false, configureLogger: false } as const

// Each test stubs process.env, so they run one by one
describe.sequential('fromWorkspace with git dependencies', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports a dependency that is not installed in getErrors()', async () => {
    const t = setup()
    await using likec4 = await fromWorkspace(t.fixture.workspace, options)
    expect(likec4.getErrors().map(e => e.message)).toContain(
      `Dependency 'billing' is not installed. Run the quick fix or \`likec4 install\`.`,
    )
    // nothing is downloaded
    expect(t.fixture.cacheFiles()).toEqual([])
  })

  it('throws with throwIfInvalid', async () => {
    const t = setup()
    await expect(fromWorkspace(t.fixture.workspace, { ...options, throwIfInvalid: true })).rejects.toThrow(
      /Dependency 'billing' is not installed/,
    )
  })

  it('throws DependenciesNotInstalledError with requireInstalledDependencies', async () => {
    const t = setup()
    const error = await fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: true })
      .then(() => undefined, (e: unknown) => e)
    expect(error).toBeInstanceOf(DependenciesNotInstalledError)
    expect((error as DependenciesNotInstalledError).message).toBe([
      'Dependency is not installed:',
      `  - 'billing' of project 'cloud' (${t.billing.url}#main)`,
      'Run `likec4 install` to install it.',
    ].join('\n'))
    expect(t.fixture.cacheFiles()).toEqual([])
  })

  it('requireInstalledDependencies with a project checks only dependencies of that project', async () => {
    const t = setup()
    t.fixture.writeWorkspace({
      'other/likec4.config.json': JSON.stringify({ name: 'other' }),
      'other/model.c4': `
        specification {
          element system
        }
        model {
          system other
        }
      `,
    })
    {
      await using likec4 = await fromWorkspace(t.fixture.workspace, {
        ...options,
        requireInstalledDependencies: { project: 'other' },
      })
      expect(likec4.projects()).toEqual(expect.arrayContaining(['cloud', 'other']))
    }
    await expect(fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: { project: 'cloud' } }))
      .rejects.toThrow(DependenciesNotInstalledError)
    // not a project id (e.g. a path): all projects are checked
    await expect(
      fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: { project: './other' } }),
    )
      .rejects.toThrow(DependenciesNotInstalledError)
    await expect(fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: {} }))
      .rejects.toThrow(DependenciesNotInstalledError)
  })

  it('loads the dependency after install, into the cache directory from LIKEC4_CACHE_DIR', async () => {
    const t = setup()
    const results = await installWorkspaceDependencies(t.fixture.workspace)
    expect(results).toMatchObject([
      {
        projectId: 'cloud',
        name: 'billing',
        previousSha: undefined,
        result: { status: 'installed', cached: false, instance: { sha: t.sha } },
      },
    ])
    const files = t.fixture.cacheFiles()
    expect(files.length).toBeGreaterThan(0)
    expect(files.every(file => file.startsWith('dependencies/'))).toBe(true)

    await using likec4 = await fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: true })
    expect(likec4.getErrors()).toEqual([])
    const model = await likec4.computedModel('cloud')
    expect([...model.elements()].map(e => e.id)).toContain('cloud')
    expect([...model.relationships()]).toHaveLength(1)
  })

  it('does not require installation without git dependencies', async () => {
    const t = setup()
    t.fixture.writeWorkspace({
      'likec4.config.json': JSON.stringify({ name: 'cloud' }),
      'model.c4': `
        specification {
          element system
        }
        model {
          system cloud
        }
      `,
    })
    await using likec4 = await fromWorkspace(t.fixture.workspace, { ...options, requireInstalledDependencies: true })
    expect(likec4.getErrors()).toEqual([])
    expect(await installWorkspaceDependencies(t.fixture.workspace)).toEqual([])
    expect(t.fixture.cacheFiles()).toEqual([])
  })

  it('rejects an unknown dependency name', async () => {
    const t = setup()
    await expect(installWorkspaceDependencies(t.fixture.workspace, { name: 'unknown' })).rejects.toThrow(
      `Git dependency 'unknown' not found`,
    )
    expect(t.fixture.cacheFiles()).toEqual([])
  })
})
