import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GENERATED_MARKER, runExportMarkdown } from './handler'

const fromWorkspace = vi.hoisted(() => vi.fn<(path: string, opts: unknown) => Promise<unknown>>())

vi.mock('@likec4/generators', () => ({
  generateMarkdown: (model: { projectId: string }, options?: { description?: string }) =>
    `# ${model.projectId}${options?.description ? '\n\n' + options.description : ''}\n`,
}))

vi.mock('@likec4/language-services/node', () => ({ fromWorkspace }))

vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return { ...actual, readFile: vi.fn<typeof actual.readFile>(actual.readFile) }
})

const logger = {
  info: vi.fn<(msg: string) => void>(),
  warn: vi.fn<(msg: string) => void>(),
  error: vi.fn<(msg: string) => void>(),
} as any

type ProjectSpec = { id: string; folder: string; hasViews?: boolean; description?: string }

function mockWorkspace(projects: ProjectSpec[]) {
  fromWorkspace.mockResolvedValue({
    languageServices: {
      projects: () =>
        projects.map(p => ({
          id: p.id,
          folder: { fsPath: p.folder },
          config: { metadata: p.description ? { description: p.description } : {} },
        })),
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
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe(`${GENERATED_MARKER}\n\n# project-a\n`)
  })

  it('passes the configured project description through to the rendered page', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    mockWorkspace([{ id: 'project-a', folder: a, description: 'Enriches organisation profiles.' }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe(
      `${GENERATED_MARKER}\n\n# project-a\n\nEnriches organisation profiles.\n`,
    )
  })

  it('marks a generated page as generated', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    mockWorkspace([{ id: 'project-a', folder: a }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8').startsWith(GENERATED_MARKER)).toBe(true)
  })

  it('overwrites a README from a previous export', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    await writeFile(join(a, 'README.md'), `${GENERATED_MARKER}\n\n# stale content\n`)
    mockWorkspace([{ id: 'project-a', folder: a }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe(`${GENERATED_MARKER}\n\n# project-a\n`)
  })

  it('protects a hand-authored README that was not generated by this command', async () => {
    const a = join(tmp, 'project-a')
    const b = join(tmp, 'project-b')
    await mkdir(a, { recursive: true })
    await mkdir(b, { recursive: true })
    const handAuthored = '# My hand-written notes\n'
    await writeFile(join(a, 'README.md'), handAuthored)
    mockWorkspace([{ id: 'project-a', folder: a }, { id: 'project-b', folder: b }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe(handAuthored)
    expect(existsSync(join(b, 'README.md'))).toBe(true)
  })

  it('fails when the only project is protected and nothing else was written', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    await writeFile(join(a, 'README.md'), '# My hand-written notes\n')
    mockWorkspace([{ id: 'project-a', folder: a }])
    await expect(
      runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger),
    ).rejects.toThrow(/No documents generated/)
  })

  it('fails without writing when the README cannot be read for a reason other than not existing', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    await writeFile(join(a, 'README.md'), '# My hand-written notes\n')
    mockWorkspace([{ id: 'project-a', folder: a }])
    const eacces = Object.assign(new Error('permission denied'), { code: 'EACCES' })
    vi.mocked(readFile).mockRejectedValueOnce(eacces)
    await expect(
      runExportMarkdown({ path: tmp, project: undefined, useDot: false }, logger),
    ).rejects.toThrow(/permission denied/)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe('# My hand-written notes\n')
  })

  it('forces an overwrite of a hand-authored README when force is set', async () => {
    const a = join(tmp, 'project-a')
    await mkdir(a, { recursive: true })
    await writeFile(join(a, 'README.md'), '# My hand-written notes\n')
    mockWorkspace([{ id: 'project-a', folder: a }])
    await runExportMarkdown({ path: tmp, project: undefined, useDot: false, force: true }, logger)
    expect(readFileSync(join(a, 'README.md'), 'utf-8')).toBe(`${GENERATED_MARKER}\n\n# project-a\n`)
  })
})
