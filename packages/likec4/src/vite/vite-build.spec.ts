import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { inlineSingleFileFavicon, removeAllButPreserved } from './vite-build'

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

describe('inlineSingleFileFavicon', () => {
  let outDir: string

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'likec4-favicon-'))
  })

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true })
  })

  const writeIndex = (head: string) =>
    writeFile(join(outDir, 'index.html'), `<!doctype html><html><head>${head}</head><body></body></html>`)
  const readIndex = () => readFile(join(outDir, 'index.html'), 'utf8')

  it('inlines an external svg favicon as a base64 data URI', async () => {
    await writeFile(join(outDir, 'favicon-CeB0sGK2.svg'), '<svg/>')
    await writeIndex('<link rel="icon" type="image/svg+xml" href="./favicon-CeB0sGK2.svg">')

    inlineSingleFileFavicon(outDir)

    const html = await readIndex()
    // base64('<svg/>') === 'PHN2Zy8+' — spec literal, NOT recomputed with the impl's formula
    expect(html).toContain('data:image/svg+xml;base64,PHN2Zy8+')
    expect(html).not.toContain('favicon-CeB0sGK2.svg')
  })

  it('uses image/x-icon mime and preserves the exact binary bytes for .ico', async () => {
    const icoBytes = Buffer.from([0x00, 0x00, 0x01, 0x00, 0xff, 0xfe, 0x7a])
    await writeFile(join(outDir, 'favicon.ico'), icoBytes)
    await writeIndex('<link rel="icon" href="./favicon.ico">')

    inlineSingleFileFavicon(outDir)

    const html = await readIndex()
    const match = html.match(/data:image\/x-icon;base64,([A-Za-z0-9+/=]+)/)
    expect(match).not.toBeNull()
    // roundtrip-decode must equal the original bytes → catches utf8-mangling / truncation
    expect(Buffer.from(match![1]!, 'base64')).toEqual(icoBytes)
    expect(html).not.toContain('href="./favicon.ico"')
  })

  it('is a no-op when there is no favicon link', async () => {
    await writeIndex('<title>LikeC4</title>')
    const before = await readIndex()

    inlineSingleFileFavicon(outDir)

    expect(await readIndex()).toEqual(before)
  })

  it('leaves a remote favicon href untouched', async () => {
    await writeIndex('<link rel="icon" href="https://likec4.dev/favicon.svg">')
    const before = await readIndex()

    inlineSingleFileFavicon(outDir)

    expect(await readIndex()).toEqual(before)
  })

  it('is a no-op (does not throw) when the referenced favicon file is missing', async () => {
    await writeIndex('<link rel="icon" type="image/svg+xml" href="./favicon-missing.svg">')
    const before = await readIndex()

    expect(() => inlineSingleFileFavicon(outDir)).not.toThrow()
    expect(await readIndex()).toEqual(before)
  })

  it('is idempotent when the favicon is already a data URI', async () => {
    await writeIndex('<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2Zy8+">')
    const before = await readIndex()

    inlineSingleFileFavicon(outDir)

    expect(await readIndex()).toEqual(before)
  })
})
