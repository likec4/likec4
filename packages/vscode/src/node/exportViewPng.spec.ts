// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findExportedPng } from './exportViewPng'

describe('findExportedPng', () => {
  it('finds a flat export next to the outdir root', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'likec4-png-flat-'))
    const pngPath = join(outdir, 'index.png')
    await writeFile(pngPath, 'png')
    await expect(findExportedPng(outdir, 'index')).resolves.toBe(pngPath)
  })

  it('finds a nested export under a project folder', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'likec4-png-nested-'))
    const nested = join(outdir, 'cloud')
    await mkdir(nested, { recursive: true })
    const pngPath = join(nested, 'overview.png')
    await writeFile(pngPath, 'png')
    await expect(findExportedPng(outdir, 'overview')).resolves.toBe(pngPath)
  })

  it('returns null when the view png is missing', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'likec4-png-missing-'))
    await writeFile(join(outdir, 'other.png'), 'png')
    await expect(findExportedPng(outdir, 'index')).resolves.toBeNull()
  })
})
