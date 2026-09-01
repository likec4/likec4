/**
 * Unlike `handler.spec.ts`, this suite runs against **real** language services and real
 * fixture workspaces on disk. Only `git` and the network are faked.
 *
 * It exists because every other layer is tested against a fake of the layer below, which is
 * how the synthetic `default` project and the dead empty-project guard slipped through.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearLogs, createGitRunner, logs, useRealWorkspace } from './__doubles__'
import { publishHandler } from './handler'
import type { PublishPayload } from './payload'

// The doubles live in `./__doubles__` because this suite runs with `--no-isolate` and shares
// its module registry with `handler.spec.ts` - see that module's header. `fromWorkspace` is
// mocked here too, but only so the double defaults to the real implementation no matter which
// file registers the mock first: this suite always runs against real language services.
vi.mock('@likec4/language-services/node', async importOriginal => {
  const actual = await importOriginal<typeof import('@likec4/language-services/node')>()
  const doubles = await import('./__doubles__')
  doubles.rememberRealWorkspace(actual.fromWorkspace)
  return { ...actual, fromWorkspace: doubles.fromWorkspace }
})

// only spawning `git` is faked, `readGitProvenance` and friends stay real
vi.mock('./git', async importOriginal => {
  const actual = await importOriginal<typeof import('./git')>()
  const doubles = await import('./__doubles__')
  return { ...actual, createGitRunner: doubles.createGitRunner }
})

vi.mock('../../logger', async importOriginal => {
  const actual = await importOriginal<typeof import('../../logger')>()
  const doubles = await import('./__doubles__')
  return { ...actual, createLikeC4Logger: doubles.fakeLogger }
})

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__')

/** Answers just enough git to look like a clean checkout rooted at `root`. */
function gitRunnerFor(root: string) {
  const answers: Record<string, string> = {
    'rev-parse --show-toplevel': root,
    'remote get-url origin': 'git@github.com:acme/architecture.git',
    'rev-parse HEAD': 'abc123',
    'log -1 --format=%an%x00%ae%x00%aI%x00%s': [
      'Jane Doe',
      'jane@acme.io',
      '2026-07-31T10:00:00+02:00',
      'feat: publish',
    ].join('\0'),
    'symbolic-ref --short -q HEAD': 'main',
  }
  return (args: readonly string[]): Promise<string> => {
    const answer = answers[args.join(' ')]
    return answer === undefined ? Promise.reject(new Error('git failed')) : Promise.resolve(answer)
  }
}

describe('publish handler (real workspace)', () => {
  const fetchMock = vi.fn<(request: Request) => Promise<Response>>()
  let sentBodies: Uint8Array[]

  beforeEach(() => {
    clearLogs()
    // `handler.spec.ts` may have left a fake behind in the shared module registry
    useRealWorkspace()
    sentBodies = []
    fetchMock.mockImplementation(async request => {
      sentBodies.push(new Uint8Array(await request.clone().arrayBuffer()))
      return Response.json({ success: true, snapshotId: 'snapshot-1' })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function sentPayload(): PublishPayload {
    expect(sentBodies).toHaveLength(1)
    return JSON.parse(gunzipSync(sentBodies[0]!).toString('utf8')) as PublishPayload
  }

  const baseArgs = {
    token: 'test-token',
    url: 'http://localhost:5173',
    project: undefined,
    origin: undefined,
    sha: undefined,
    branch: undefined,
    tag: undefined,
    force: false,
    useDotBin: false,
  }

  it('publishes a single-project workspace exactly once, keyed "."', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'single-project')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    const payload = sentPayload()
    // the synthetic `default` project must not appear alongside `acme` - it resolves to the
    // same folder and would collide on the "." key
    expect(Object.keys(payload.projects)).toEqual(['.'])
    expect(payload.projects['.']?.projectId).toBe('acme')
    expect(Object.keys(payload.projects['.']?.views ?? {})).toContain('index')
  })

  it('publishes every non-empty project of a multi-project workspace', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'multi-project')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    const payload = sentPayload()
    expect(Object.keys(payload.projects).sort()).toEqual(['alpha', 'beta'])
    expect(payload.projects['alpha']?.projectId).toBe('alpha')
    expect(payload.projects['beta']?.projectId).toBe('beta')
    // no synthetic `default` project keyed "."
    expect(Object.keys(payload.projects)).not.toContain('.')
  })

  it('skips an empty project with a warning', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'multi-project')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    expect(logs.warn).toContainEqual(expect.stringContaining('Project blank is empty, skipping'))
    expect(Object.keys(sentPayload().projects)).not.toContain('blank')
  })

  it('errors and sends no request when every project is empty', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'blank-only')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await expect(publishHandler({ ...baseArgs, path: workspace })).rejects.toThrow(/Nothing to publish/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('publishes a single project selected with -p', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'multi-project')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace, project: 'beta' })

    expect(Object.keys(sentPayload().projects)).toEqual(['beta'])
  })

  // `importer` owns no elements at all - its diagram is built from `import { … } from 'base'`,
  // so any emptiness test based on element presence drops it silently
  it('publishes a project whose content comes from an import', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'import-project')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    const payload = sentPayload()
    expect(Object.keys(payload.projects).sort()).toEqual(['base', 'importer'])
    expect(payload.projects['importer']?.elements).toEqual({})
    expect(payload.projects['importer']?.views['index']?.nodes).toHaveLength(2)
    expect(logs.warn.join('\n')).not.toMatch(/is empty, skipping/)
  })

  // The one test that proves the icon walk against what `@likec4/core` really emits, rather
  // than against a hand-written model: `local-icons` puts the same file behind a specification
  // element style, an element property and a view rule style override.
  it('inlines local icons and rewrites every reference', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'local-icons')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    const payload = sentPayload()
    // hash stability against a fixed byte sequence is `assets.spec.ts`'s job - here the digest
    // is derived from the fixture, so this suite only asserts that the wiring is right
    const logo = readFileSync(join(workspace, 'logo.svg'))
    const logoSha256 = createHash('sha256').update(logo).digest('hex')
    // one file, referenced from several places, is collected once
    expect(payload.assets).toEqual({
      [logoSha256]: {
        filename: 'logo.svg',
        bytes: logo.toString('base64'),
      },
    })
    const model = payload.projects['.']!
    const references = JSON.stringify(model).match(/(?:file|asset):\/\/[^"]*/g) ?? []
    expect(references).not.toHaveLength(0)
    for (const reference of references) {
      // every `file://` left in the model is a link the user wrote, never an icon
      expect(reference).toMatch(/^asset:\/\/|^file:\/\/\/home\/alice\/spec\.pdf$/)
    }
    // the specification element style, the element's own `icon`, the view rule override and
    // the layouted node all carry it
    expect(references.filter(reference => reference === `asset://${logoSha256}`).length)
      .toBeGreaterThanOrEqual(3)
    // the user's `file://` link survived untouched
    expect(references).toContain('file:///home/alice/spec.pdf')
  })

  // `wrapper` owns no `.c4` file - its sources come from `include.paths`, so it never appears
  // in `languageServices.projects()` even though it is fully registered and renders a diagram
  it('publishes a project composed through include paths', { timeout: 60_000 }, async () => {
    const workspace = join(fixtures, 'include-paths')
    createGitRunner.mockReturnValue(gitRunnerFor(workspace))

    await publishHandler({ ...baseArgs, path: workspace })

    const payload = sentPayload()
    expect(Object.keys(payload.projects).sort()).toEqual(['base', 'wrapper'])
    expect(payload.projects['wrapper']?.views['index']?.nodes).toHaveLength(2)
    expect(logs.warn.join('\n')).not.toMatch(/is empty, skipping/)
  })
})
