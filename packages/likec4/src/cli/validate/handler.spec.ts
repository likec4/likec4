/**
 * Runs `runValidate` against real language services and a real workspace on disk.
 */
import type { LikeC4 } from '@likec4/language-services/node'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ValidateLogger, ValidateOptions } from './handler'
import { runValidate } from './handler'

// The suite runs with `--no-isolate`, and other spec files mock this module,
// so take the actual implementation explicitly
const { fromWorkspace } = await vi.importActual<typeof import('@likec4/language-services/node')>(
  '@likec4/language-services/node',
)

const spec = `
specification {
  element component
}
`

// opacity outside 0%..100% is reported as a warning
const withWarnings = `
model {
  component a {
    style {
      opacity 150%
    }
  }
  component b {
    style {
      opacity 200%
    }
  }
}
`

const withoutWarnings = `
model {
  component c
}
`

const withError = `
model {
  component d
  d -> unknown
}
`

// Strips ANSI colors from the captured lines
const plain = (lines: string[]) => lines.map(line => stripVTControlCharacters(line))

describe('runValidate', () => {
  let workspace: string
  let likec4: LikeC4 | undefined
  const logs = {
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  }
  const logger: ValidateLogger = {
    info: msg => void logs.info.push(msg),
    warn: msg => void logs.warn.push(msg),
    error: msg => void logs.error.push(msg),
    debug: () => {},
  }
  const output: string[] = []
  const print = (out: string) => void output.push(out)

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'likec4-validate-'))
    logs.info.length = 0
    logs.warn.length = 0
    logs.error.length = 0
    output.length = 0
  })

  afterEach(async () => {
    await likec4?.dispose()
    likec4 = undefined
    await rm(workspace, { recursive: true, force: true })
  })

  // Path of a workspace document as the language services report it
  // (on Windows the drive letter may differ in case from `join(workspace, name)`)
  const docPath = (name: string) => likec4!.documentPaths().find(p => p.endsWith(name))!

  async function validate(sources: Record<string, string>, options: Partial<ValidateOptions> = {}) {
    for (const [name, content] of Object.entries(sources)) {
      await writeFile(join(workspace, name), content)
    }
    likec4 = await fromWorkspace(workspace, { printErrors: false })
    return await runValidate(likec4, { path: workspace, layout: false, json: false, ...options }, logger, print)
  }

  it('is valid without warnings', async () => {
    const result = await validate({ 'spec.c4': spec, 'model.c4': withoutWarnings })

    expect(result.valid).toBe(true)
    expect(result.warnings).toEqual([])
    expect(logs.warn).toEqual([])
    expect(plain(logs.info)).toEqual(['✓ Valid (2 files)'])
  })

  it('prints warnings, but stays valid without --max-warnings', async () => {
    const result = await validate({ 'spec.c4': spec, 'model.c4': withWarnings })

    expect(result.valid).toBe(true)
    expect(result.maxWarnings).toBeNull()
    expect(result.stats.filteredWarnings).toBe(2)
    expect(plain(logs.warn)).toEqual([
      `Warning ${docPath('model.c4')}:5:15 Value ignored, must be between 0% and 100%`,
      `Warning ${docPath('model.c4')}:10:15 Value ignored, must be between 0% and 100%`,
    ])
    expect(plain(logs.info)).toEqual(['✓ Valid (2 files, 2 warnings)'])
  })

  it('is invalid with --max-warnings 0 and any warning', async () => {
    const result = await validate({ 'spec.c4': spec, 'model.c4': withWarnings }, { maxWarnings: 0 })

    expect(result.valid).toBe(false)
    expect(result.errors).toEqual([])
    expect(plain(logs.error)).toEqual(['✗ Invalid (2 files, 0 errors, 2 warnings (max 0))'])
  })

  it('stays valid when warnings are within --max-warnings', async () => {
    const result = await validate({ 'spec.c4': spec, 'model.c4': withWarnings }, { maxWarnings: 2 })

    expect(result.valid).toBe(true)
    expect(plain(logs.info)).toEqual(['✓ Valid (2 files, 2 warnings)'])
  })

  it('is invalid with errors, and reports warnings too', async () => {
    const result = await validate({ 'spec.c4': spec, 'model.c4': withWarnings, 'error.c4': withError })

    expect(result.valid).toBe(false)
    const errors = result.stats.filteredErrors
    expect(errors).toBeGreaterThan(0)
    expect(result.errors.every(e => e.file.endsWith('error.c4'))).toBe(true)
    expect(result.stats.filteredWarnings).toBe(2)
    expect(plain(logs.error)).toEqual([`✗ Invalid (3 files, ${errors} errors, 2 warnings)`])
  })

  it('limits only warnings of the files given with --file', async () => {
    const result = await validate(
      { 'spec.c4': spec, 'model.c4': withWarnings, 'other.c4': withoutWarnings },
      { maxWarnings: 0, file: [join(workspace, 'other.c4')] },
    )

    expect(result.valid).toBe(true)
    expect(result.warnings).toEqual([])
    expect(result.stats.totalWarnings).toBe(2)
    expect(logs.warn).toEqual([])
  })

  it('prints JSON with warnings and their counts', async () => {
    const result = await validate(
      { 'spec.c4': spec, 'model.c4': withWarnings },
      { json: true, maxWarnings: 1 },
    )

    expect(result.valid).toBe(false)
    expect(logs.warn).toEqual([])
    expect(output).toHaveLength(1)
    expect(JSON.parse(output[0]!)).toEqual({
      valid: false,
      errors: [],
      warnings: [
        {
          message: 'Value ignored, must be between 0% and 100%',
          file: docPath('model.c4'),
          line: 4,
          range: { start: { line: 4, character: 14 }, end: { line: 4, character: 18 } },
        },
        {
          message: 'Value ignored, must be between 0% and 100%',
          file: docPath('model.c4'),
          line: 9,
          range: { start: { line: 9, character: 14 }, end: { line: 9, character: 18 } },
        },
      ],
      maxWarnings: 1,
      stats: {
        totalFiles: 2,
        totalErrors: 0,
        totalWarnings: 2,
        filteredFiles: 2,
        filteredErrors: 0,
        filteredWarnings: 2,
      },
    })
  })
})
