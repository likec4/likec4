import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runExportMarkdown } from './handler'

const fromWorkspace = vi.hoisted(() => vi.fn<(path: string, opts: unknown) => Promise<unknown>>())

vi.mock('@likec4/generators', () => ({
  generateMarkdown: (model: { projectId: string }) => `# ${model.projectId}\n`,
}))

vi.mock('@likec4/language-services/node', () => ({ fromWorkspace }))

const logger = {
  info: vi.fn<(msg: string) => void>(),
  warn: vi.fn<(msg: string) => void>(),
  error: vi.fn<(msg: string) => void>(),
} as any

type ProjectSpec = { id: string; folder: string; hasViews?: boolean }

function mockWorkspace(projects: ProjectSpec[]) {
  fromWorkspace.mockResolvedValue({
    languageServices: {
      projects: () => projects.map(p => ({ id: p.id, folder: { fsPath: p.folder } })),
    },
    layoutedModel: vi.fn<(id: string) => Promise<{ projectId: string; views: () => Array<unknown> }>>(async id => ({
      projectId: id,
      views: () => (projects.find(p => p.id === id)?.hasViews ?? true) ? [{ $view: { sourcePath: 'views.c4' } }] : [],
    })),
    [Symbol.asyncDispose]: async () => {},
  })
}

describe('export markdown handler', () => {
  let tmp: string

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'likec4-md-'))
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
  })

  it('writes a README.md into each project own folder by default', async () => {
    const a = join(tmp, 'project-a')
    const b = join(tmp, 'project-b')
    await mkdir(a, { recursive: true })
    await mkdir(b, { recursive: true })
    mockWorkspace([{ id: 'project-a', folder: a }, { id: 'project-b', folder: b }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(existsSync(join(a, 'README.md'))).toBe(true)
    expect(existsSync(join(b, 'README.md'))).toBe(true)
  })

  it('skips a project that renders to no views', async () => {
    const a = join(tmp, 'project-a')
    const b = join(tmp, 'project-b')
    await mkdir(a, { recursive: true })
    await mkdir(b, { recursive: true })
    mockWorkspace([
      { id: 'project-a', folder: a, hasViews: true },
      { id: 'project-b', folder: b, hasViews: false },
    ])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(existsSync(join(a, 'README.md'))).toBe(true)
    expect(existsSync(join(b, 'README.md'))).toBe(false)
  })

  it('restricts to a single project when one is named', async () => {
    const a = join(tmp, 'project-a')
    const b = join(tmp, 'project-b')
    await mkdir(a, { recursive: true })
    await mkdir(b, { recursive: true })
    mockWorkspace([{ id: 'project-a', folder: a }, { id: 'project-b', folder: b }])
    await runExportMarkdown({ path: tmp, project: 'project-a', useDot: false }, logger)
    expect(existsSync(join(a, 'README.md'))).toBe(true)
    expect(existsSync(join(b, 'README.md'))).toBe(false)
  })

  it('reports an unknown project', async () => {
    mockWorkspace([{ id: 'project-a', folder: join(tmp, 'project-a') }])
    await expect(
      runExportMarkdown({ path: tmp, project: 'nope', useDot: false }, logger),
    ).rejects.toThrow(/project not found: nope/)
  })

  it('writes the rendered Markdown of each project', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    mockWorkspace([{ id: 'project-a', folder: a }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe('# project-a\n')
  })
})
