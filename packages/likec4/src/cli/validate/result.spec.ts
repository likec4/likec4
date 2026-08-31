import { describe, expect, it } from 'vitest'
import type { DiagnosticItem } from './result'
import { buildValidateResult } from './result'

const error = (file: string): DiagnosticItem => ({
  message: 'something is wrong',
  file,
  line: 0,
  range: null,
})

describe('buildValidateResult', () => {
  it('counts a matched file with no errors', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4'],
      errors: [],
      fileFilter: ['/repro/model.c4'],
    })

    expect(result.stats).toEqual({
      totalFiles: 1,
      totalErrors: 0,
      filteredFiles: 1,
      filteredErrors: 0,
    })
    expect(result.valid).toBe(true)
  })

  it('counts every matched file, not only the ones carrying errors', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4', '/repro/views.c4', '/repro/spec.c4'],
      errors: [error('/repro/views.c4')],
      fileFilter: ['/repro/model.c4', '/repro/views.c4'],
    })

    expect(result.stats.filteredFiles).toBe(2)
    expect(result.stats.filteredErrors).toBe(1)
    expect(result.valid).toBe(false)
  })

  it('does not count a file left out by the filter', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4', '/repro/views.c4'],
      errors: [error('/repro/views.c4')],
      fileFilter: ['/repro/model.c4'],
    })

    expect(result.stats.filteredFiles).toBe(1)
    expect(result.stats.filteredErrors).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('matches a filter given as a relative path', () => {
    const result = buildValidateResult({
      documents: ['/repro/src/model.c4'],
      errors: [],
      fileFilter: ['src/model.c4'],
    })

    expect(result.stats.filteredFiles).toBe(1)
  })

  it('reports every document when no filter is given', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4', '/repro/views.c4'],
      errors: [error('/repro/views.c4')],
      fileFilter: null,
    })

    expect(result.stats).toEqual({
      totalFiles: 2,
      totalErrors: 1,
      filteredFiles: 2,
      filteredErrors: 1,
    })
  })
})
