// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { normalizeSearch } from './SearchContext'

describe('normalizeSearch', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeSearch('')).toBe('')
  })

  it('trims and lowercases input', () => {
    expect(normalizeSearch('  Hello World  ')).toBe('hello world')
  })

  it('returns empty string for single character', () => {
    expect(normalizeSearch('a')).toBe('')
  })

  it('returns empty string for single character with whitespace', () => {
    expect(normalizeSearch('  a  ')).toBe('')
  })

  it('returns normalized value for two or more characters', () => {
    expect(normalizeSearch('ab')).toBe('ab')
    expect(normalizeSearch('ABC')).toBe('abc')
  })

  it('returns empty string for lone "#"', () => {
    expect(normalizeSearch('#')).toBe('')
  })

  it('returns empty string for "#a" (hash + single char)', () => {
    expect(normalizeSearch('#a')).toBe('')
  })

  it('returns normalized value for hash with two or more chars after', () => {
    expect(normalizeSearch('#next')).toBe('#next')
    expect(normalizeSearch('#V2')).toBe('#v2')
  })

  it('handles kind: prefix normally', () => {
    expect(normalizeSearch('kind:')).toBe('kind:')
    expect(normalizeSearch('kind:system')).toBe('kind:system')
  })

  it('handles whitespace-only input', () => {
    expect(normalizeSearch('   ')).toBe('')
  })
})
