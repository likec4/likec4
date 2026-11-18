import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealWorkspace } from '../../publish/__doubles__'
import { runExportJson } from './handler'

// Runs against real language services. The package runs specs with `--no-isolate`,
// so the mock is shared with the publish specs, see `publish/__doubles__.ts`.
vi.mock('@likec4/language-services/node', async importOriginal => {
  const actual = await importOriginal<typeof import('@likec4/language-services/node')>()
  const doubles = await import('../../publish/__doubles__')
  doubles.rememberRealWorkspace(actual.fromWorkspace)
  return { ...actual, fromWorkspace: doubles.fromWorkspace }
})

const logger = {
  info: vi.fn<(msg: string) => void>(),
  warn: vi.fn<(msg: string) => void>(),
  error: vi.fn<(msg: string) => void>(),
} as any

const model = (name: string) => `
specification {
  element system
}
model {
  ${name} = system
}
`

describe('export json handler', () => {
  let tmp: string

  beforeEach(async () => {
    useRealWorkspace()
    tmp = await mkdtemp(join(tmpdir(), 'likec4-json-'))
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  async function workspace(files: Record<string, string>) {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(tmp, path)), { recursive: true })
      await writeFile(join(tmp, path), content)
    }
  }

  async function exportJson(): Promise<unknown> {
    const outfile = join(tmp, 'out.json')
    await runExportJson(
      { path: tmp, outfile, project: undefined, skipLayout: true, pretty: false, useDot: false },
      logger,
    )
    return JSON.parse(await readFile(outfile, 'utf8'))
  }

  // https://github.com/likec4/likec4/issues/3572
  it('writes a single named project once', { timeout: 60_000 }, async () => {
    await workspace({
      'a/likec4.config.json': '{ "name": "a" }',
      'a/model.c4': model('s1'),
    })

    const out = await exportJson()

    expect(out).not.toBeInstanceOf(Array)
    expect(out).toMatchObject({ projectId: 'a' })
  })

  it('writes a single named project once when sources sit outside it', { timeout: 60_000 }, async () => {
    await workspace({
      'a/likec4.config.json': '{ "name": "a" }',
      'a/model.c4': model('s1'),
      'model.c4': model('s0'),
    })

    const out = await exportJson()

    expect(out).not.toBeInstanceOf(Array)
    expect(out).toMatchObject({ projectId: 'a' })
    expect(Object.keys((out as { elements: object }).elements)).toEqual(['s1'])
  })

  it('writes every named project once', { timeout: 60_000 }, async () => {
    await workspace({
      'a/likec4.config.json': '{ "name": "a" }',
      'a/model.c4': model('s1'),
      'b/likec4.config.json': '{ "name": "b" }',
      'b/model.c4': model('s2'),
    })

    const out = await exportJson()

    expect(out).toBeInstanceOf(Array)
    expect((out as Array<{ projectId: string }>).map(m => m.projectId).sort()).toEqual(['a', 'b'])
  })

  it('writes the default project of a workspace without config', { timeout: 60_000 }, async () => {
    await workspace({
      'model.c4': model('s1'),
    })

    const out = await exportJson()

    expect(out).toMatchObject({ projectId: 'default' })
  })
})
