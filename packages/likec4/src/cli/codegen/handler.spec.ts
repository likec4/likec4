import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, win32 } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { legacyHandler, relativeOutputDir } from './handler'

type MockView = {
  id: string
  sourcePath?: string
}

type MockModel = {
  $styles: Record<string, never>
  $data: {
    views: Record<string, MockView>
  }
}

type MockViewModel = {
  $view: MockView
}

type MockLayoutedModel = {
  views: () => MockViewModel[]
}

type MockLanguageServices = {
  computedModel: () => Promise<MockModel>
  layoutedModel: () => Promise<MockLayoutedModel>
  ensureSingleProject: () => void
  viewsService: {
    computedViews: () => Promise<Array<{ id: string }>>
    layouter: {
      dot: () => Promise<string>
    }
  }
}

const fromWorkspace = vi.hoisted(() => vi.fn<() => Promise<MockLanguageServices>>())

vi.mock('@likec4/generators', () => ({
  generateD2: (vm: MockViewModel) => `d2 ${vm.$view.id}`,
  generateMermaid: (vm: MockViewModel) => `mermaid ${vm.$view.id}`,
  generatePuml: (vm: MockViewModel) => `plantuml ${vm.$view.id}`,
  generateViewsDataTs: () => 'views',
}))

vi.mock('@likec4/language-services/node', () => ({
  fromWorkspace,
}))

const codegenFormats = [
  { format: 'dot', ext: '.dot' },
  { format: 'd2', ext: '.d2' },
  { format: 'mermaid', ext: '.mmd' },
  { format: 'plantuml', ext: '.puml' },
] as const

describe('legacy codegen handler', () => {
  let tmp: string
  let outdir: string

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'likec4-codegen-'))
    outdir = join(tmp, 'out')
    const views = {
      a_view: {
        id: 'a_view',
        sourcePath: '../project-a/projects/model.c4',
      },
      b_view: {
        id: 'b_view',
        sourcePath: 'model.c4',
      },
      drive_view: {
        id: 'drive_view',
        sourcePath: 'D:/repo/project-a/projects/model.c4',
      },
      drive_backslash_view: {
        id: 'drive_backslash_view',
        sourcePath: 'D:\\repo\\project-a\\projects\\model.c4',
      },
    }
    const viewModels = Object.values(views).map(view => ({ $view: view }))
    fromWorkspace.mockResolvedValue({
      computedModel: vi.fn<() => Promise<MockModel>>().mockResolvedValue({
        $styles: {},
        $data: {
          views,
        },
      }),
      layoutedModel: vi.fn<() => Promise<MockLayoutedModel>>().mockResolvedValue({
        views: () => viewModels,
      }),
      ensureSingleProject: vi.fn<() => void>(),
      viewsService: {
        computedViews: vi.fn<() => Promise<Array<{ id: string }>>>().mockResolvedValue(Object.values(views)),
        layouter: {
          dot: vi.fn<() => Promise<string>>().mockResolvedValue('digraph {}'),
        },
      },
    })
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  it.each(codegenFormats)('keeps generated $format files inside the requested outdir', async ({ ext, format }) => {
    await legacyHandler({
      path: join(tmp, 'project-b'),
      useDotBin: false,
      format,
      outdir,
    })

    expect(existsSync(join(outdir, 'project-a', 'projects', `a_view${ext}`))).toBe(true)
    expect(existsSync(join(outdir, 'b_view' + ext))).toBe(true)
    expect(existsSync(join(outdir, 'repo', 'project-a', 'projects', `drive_view${ext}`))).toBe(true)
    expect(existsSync(join(outdir, 'repo', 'project-a', 'projects', `drive_backslash_view${ext}`))).toBe(true)
    expect(existsSync(join(tmp, 'project-a', 'projects', `a_view${ext}`))).toBe(false)
  })

  it('returns relative output dirs for Windows drive-qualified source paths', () => {
    expect(relativeOutputDir('D:/repo/project-a/projects/model.c4')).toBe(join('repo', 'project-a', 'projects'))
    const outputDir = relativeOutputDir('D:\\repo\\project-a\\projects\\model.c4')

    expect(outputDir).toBe(join('repo', 'project-a', 'projects'))
    expect(win32.resolve('C:\\out', outputDir)).toBe(win32.join('C:\\out', 'repo', 'project-a', 'projects'))
  })
})
