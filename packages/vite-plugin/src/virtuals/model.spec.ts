import { URI } from 'langium'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolve } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { projectModelModule } from './model'

vi.mock('../logger', () => ({ logGenerating: vi.fn<() => void>() }))

describe('projectModelModule', () => {
  let folder: string

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'likec4-model-'))
    await writeFile(join(folder, 'theme.css'), 'body { background: url(./bg.png); }')
  })

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true })
  })

  const load = async (paths: string[] | undefined, content = '') => {
    const customCss = paths ? { paths, content } : undefined
    const styles = customCss ? { customCss } : undefined
    const result = await projectModelModule.load.call({} as any, {
      likec4: {
        layoutedModel: async () => ({ $data: { project: { id: 'p', styles } } }),
      },
      project: {
        id: 'p',
        folder: URI.file(folder),
        config: { name: 'p', styles },
      },
    } as any)
    return typeof result === 'string' ? result : result.code
  }

  it('imports custom CSS files through Vite', async () => {
    const code = await load(['theme.css'], 'body { background: url(./bg.png); }')
    expect(code).toContain(`import customCss0 from ${JSON.stringify(`${resolve(folder, 'theme.css')}?inline`)}`)
    expect(code).toContain('.content = [customCss0].join(')
  })

  it('does not embed the unprocessed CSS', async () => {
    const code = await load(['theme.css'], 'body { background: url(./bg.png); }')
    expect(code).not.toContain('bg.png')
  })

  it('leaves out files that cannot be read', async () => {
    const code = await load(['missing.css', 'theme.css'], 'body {}')
    expect(code).not.toContain('missing.css')
    expect(code).toContain(`import customCss0 from ${JSON.stringify(`${resolve(folder, 'theme.css')}?inline`)}`)
    expect(code).not.toContain('customCss1')
  })

  it('keeps the content from config when there are no files', async () => {
    const code = await load([], 'body { color: red; }')
    expect(code).not.toContain('?inline')
    expect(code).toContain('color: red')
  })

  it('has no CSS imports without custom CSS', async () => {
    const code = await load(undefined)
    expect(code).not.toContain('?inline')
  })
})
