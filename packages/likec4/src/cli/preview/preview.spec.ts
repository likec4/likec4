import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock heavy dependencies to isolate handler wiring logic
vi.mock('@likec4/language-services/node', () => ({
  fromWorkspace: vi.fn(async (workspace: string) => ({ workspace })),
}))

vi.mock('../../vite/vite-preview', () => ({
  vitePreview: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../vite/printServerUrls', () => ({
  printServerUrls: vi.fn<() => void>(),
}))

describe('preview handler', () => {
  let dir: string

  async function run(params: Parameters<typeof import('./preview').handler>[0]) {
    const { handler } = await import('./preview')
    const { vitePreview } = await import('../../vite/vite-preview')
    const { fromWorkspace } = await import('@likec4/language-services/node')
    await handler(params)
    return {
      workspace: vi.mocked(fromWorkspace).mock.calls[0]![0],
      preview: vi.mocked(vitePreview).mock.calls[0]![0],
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    dir = mkdtempSync(join(tmpdir(), 'likec4-preview-'))
    writeFileSync(
      join(dir, 'likec4.app.config.mjs'),
      `export default { base: '/pages/', build: { outDir: './site' } }`,
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('takes the output directory and the base url from the app config', async () => {
    const { workspace, preview } = await run({ path: dir })

    expect(workspace).toBe(dir)
    expect(preview.outputDir).toBe(join(dir, 'site'))
    expect(preview.base).toBe('/pages/')
  })

  it('prefers flags over the app config', async () => {
    const output = join(dir, 'other')
    const { preview } = await run({ path: dir, output, base: '/', listen: '0.0.0.0' })

    expect(preview.outputDir).toBe(output)
    expect(preview.base).toBe('/')
    expect(preview.listen).toBe('0.0.0.0')
  })

  it('ignores the app config with --no-app-config', async () => {
    const { preview } = await run({ path: dir, appConfig: false })

    expect(preview.outputDir).toBeUndefined()
    expect(preview.base).toBeUndefined()
  })
})
