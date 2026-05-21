import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { removeAllButPreserved } from './vite-build'

describe('removeAllButPreserved', () => {
  let outDir: string

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'likec4-outdir-'))
  })

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true })
  })

  it('keeps only the preserved files and removes everything else', async () => {
    await writeFile(join(outDir, 'index.html'), '<html></html>')
    await writeFile(join(outDir, 'main.js'), 'console.log(1)')
    await mkdir(join(outDir, 'assets'))
    await writeFile(join(outDir, 'assets', 'logo.png'), 'x')

    removeAllButPreserved(outDir, ['index.html'])

    expect((await readdir(outDir)).sort()).toEqual(['index.html'])
  })

  it('preserves user-provided files alongside index.html (single-file build with --public)', async () => {
    await writeFile(join(outDir, 'index.html'), '<html></html>')
    await writeFile(join(outDir, 'main.js'), 'console.log(1)')
    await writeFile(join(outDir, 'logo.png'), 'x')
    await mkdir(join(outDir, 'media'))
    await writeFile(join(outDir, 'media', 'video.mp4'), 'x')

    removeAllButPreserved(outDir, ['index.html', 'logo.png', 'media'])

    expect((await readdir(outDir)).sort()).toEqual(['index.html', 'logo.png', 'media'])
    expect((await readdir(join(outDir, 'media'))).sort()).toEqual(['video.mp4'])
  })

  it('is a no-op when outDir only contains preserved files', async () => {
    await writeFile(join(outDir, 'index.html'), '<html></html>')
    removeAllButPreserved(outDir, ['index.html'])
    expect(await readdir(outDir)).toEqual(['index.html'])
  })
})
