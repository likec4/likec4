import { describe, expect, it } from 'vitest'
import type { DiagnosticItem } from './result'
import { buildValidateResult, parseMaxWarnings } from './result'

const error = (file: string): DiagnosticItem => ({
  message: 'something is wrong',
  file,
  line: 0,
  range: null,
})

const warning = (file: string): DiagnosticItem => ({
  message: 'something is odd',
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
      totalWarnings: 0,
      filteredFiles: 1,
      filteredErrors: 0,
      filteredWarnings: 0,
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
      totalWarnings: 0,
      filteredFiles: 2,
      filteredErrors: 1,
      filteredWarnings: 0,
    })
  })

  it('stays valid with warnings when the limit is not given', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4'],
      errors: [],
      warnings: [warning('/repro/model.c4')],
      fileFilter: null,
    })

    expect(result.valid).toBe(true)
    expect(result.maxWarnings).toBeNull()
    expect(result.warnings).toEqual([warning('/repro/model.c4')])
    expect(result.stats.totalWarnings).toBe(1)
    expect(result.stats.filteredWarnings).toBe(1)
  })

  it('is invalid when warnings exceed the limit', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4'],
      errors: [],
      warnings: [warning('/repro/model.c4'), warning('/repro/model.c4')],
      fileFilter: null,
      maxWarnings: 1,
    })

    expect(result.valid).toBe(false)
    expect(result.maxWarnings).toBe(1)
  })

  it('stays valid when warnings are within the limit', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4'],
      errors: [],
      warnings: [warning('/repro/model.c4'), warning('/repro/model.c4')],
      fileFilter: null,
      maxWarnings: 2,
    })

    expect(result.valid).toBe(true)
  })

  it('limits only the warnings of filtered files', () => {
    const result = buildValidateResult({
      documents: ['/repro/model.c4', '/repro/views.c4'],
      errors: [],
      warnings: [warning('/repro/views.c4')],
      fileFilter: ['/repro/model.c4'],
      maxWarnings: 0,
    })

    expect(result.valid).toBe(true)
    expect(result.warnings).toEqual([])
    expect(result.stats.totalWarnings).toBe(1)
    expect(result.stats.filteredWarnings).toBe(0)
  })
})

describe('parseMaxWarnings', () => {
  it('accepts zero and positive integers', () => {
    expect(parseMaxWarnings(0)).toBe(0)
    expect(parseMaxWarnings(10)).toBe(10)
    expect(parseMaxWarnings(undefined)).toBeUndefined()
  })

  it('rejects negative, fractional and non-numeric values', () => {
    expect(() => parseMaxWarnings(-1)).toThrow('--max-warnings must be a non-negative integer, got -1')
    expect(() => parseMaxWarnings(1.5)).toThrow('non-negative integer')
    expect(() => parseMaxWarnings(Number.NaN)).toThrow('non-negative integer')
  })
})
