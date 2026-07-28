import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
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

function mockWorkspace(projectIds: string[]) {
  fromWorkspace.mockResolvedValue({
    projectsManager: { all: projectIds },
    layoutedModel: vi.fn<(id: string) => Promise<{ projectId: string }>>(async id => ({ projectId: id })),
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

  it('writes one document per project, into the workspace by default', async () => {
    mockWorkspace(['project-a', 'project-b'])
    await runExportMarkdown({ path: tmp, output: tmp, project: undefined, useDot: false }, logger)
    expect(existsSync(join(tmp, 'project-a.md'))).toBe(true)
    expect(existsSync(join(tmp, 'project-b.md'))).toBe(true)
  })

  it('restricts to a single project when one is named', async () => {
    mockWorkspace(['project-a', 'project-b'])
    await runExportMarkdown({ path: tmp, output: tmp, project: 'project-a', useDot: false }, logger)
    expect(existsSync(join(tmp, 'project-a.md'))).toBe(true)
    expect(existsSync(join(tmp, 'project-b.md'))).toBe(false)
  })

  it('reports an unknown project', async () => {
    mockWorkspace(['project-a'])
    await expect(
      runExportMarkdown({ path: tmp, output: tmp, project: 'nope', useDot: false }, logger),
    ).rejects.toThrow(/project not found: nope/)
  })

  it('honors a chosen output directory', async () => {
    mockWorkspace(['project-a'])
    const out = join(tmp, 'docs')
    await runExportMarkdown({ path: tmp, output: out, project: undefined, useDot: false }, logger)
    expect(existsSync(join(out, 'project-a.md'))).toBe(true)
  })

  it('writes the rendered Markdown of each project', async () => {
    mockWorkspace(['project-a'])
    await runExportMarkdown({ path: tmp, output: tmp, project: undefined, useDot: false }, logger)
    expect(readFileSync(join(tmp, 'project-a.md'), 'utf-8')).toBe('# project-a\n')
  })
})
