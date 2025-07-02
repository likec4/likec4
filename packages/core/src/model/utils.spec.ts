import { describe, expect, it } from 'vitest'
import { getViewGroupPath, getViewTitleFromPath, normalizeViewPath } from './utils'

describe('normalizeViewPath', () => {
  it('should remove spaces from path segments', () => {
    expect(normalizeViewPath('One / Tw o / Thre e')).toBe('One/Tw o/Thre e')
  })

  it('should trim spaces from a single path segment', () => {
    expect(normalizeViewPath(' Single ')).toBe('Single')
  })

  it('should handle empty segments correctly', () => {
    expect(normalizeViewPath('One /  / Three')).toBe('One/Three')
  })

  it('should handle leading and trailing slashes', () => {
    expect(normalizeViewPath(' / One / Two / ')).toBe('One/Two')
  })

  it('should return empty string for empty input', () => {
    expect(normalizeViewPath('')).toBe('')
  })

  it('should handle input with only spaces', () => {
    expect(normalizeViewPath('   ')).toBe('')
  })

  it('should throw for multiline input', () => {
    expect(() => normalizeViewPath('One\nTwo')).toThrow()
  })
})

describe('getViewGroupPath', () => {
  it('should return the parent path segments', () => {
    expect(getViewGroupPath('One / Tw o / Thre e')).toBe('One/Tw o')
  })

  it('should return null for single segment path', () => {
    expect(getViewGroupPath('One')).toBeNull()
  })

  it('should handle empty segments correctly', () => {
    expect(getViewGroupPath(' / ')).toBeNull()
    expect(getViewGroupPath('One /  / Three')).toBe('One')
    expect(getViewGroupPath('One / Tw o / / Three')).toBe('One/Tw o')
  })

  it('should handle leading slashes', () => {
    expect(getViewGroupPath(' / One / Two')).toBe('One')
  })

  it('should return null for empty input', () => {
    expect(getViewGroupPath('')).toBeNull()
    expect(getViewGroupPath('   ')).toBeNull()
  })

  it('should handle trailing slashes', () => {
    expect(getViewGroupPath('One / Two /')).toBe('One')
  })
  it('should throw for multiline input', () => {
    expect(() => normalizeViewPath('One\nTwo')).toThrow()
  })
})

describe('getViewTitleFromPath', () => {
  it('should return the last path segment', () => {
    expect(getViewTitleFromPath('One / Tw o / Thre e')).toBe('Thre e')
  })

  it('should return the input for single segment path', () => {
    expect(getViewTitleFromPath('One')).toBe('One')
  })

  it('should handle empty segments correctly', () => {
    expect(getViewTitleFromPath('One / Two / ')).toBe('Two')
    expect(getViewTitleFromPath('One / / Two')).toBe('Two')
    expect(getViewTitleFromPath('One / Two / /')).toBe('Two')
  })

  it('should handle empty input', () => {
    expect(getViewTitleFromPath('')).toBe('')
  })

  it('should trim spaces from the title', () => {
    expect(getViewTitleFromPath('One / Two / Three ')).toBe('Three')
  })

  it('should handle input with only spaces', () => {
    expect(getViewTitleFromPath('   ')).toBe('')
  })
})
