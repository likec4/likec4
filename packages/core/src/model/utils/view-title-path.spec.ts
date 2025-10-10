import { describe, expect, it } from 'vitest'
import { extractViewTitleFromPath, getViewFolderPath, normalizeViewPath } from './view-title-path'

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

describe('getViewFolderPath', () => {
  it('should return the parent path segments', () => {
    expect(getViewFolderPath('One / Tw o / Thre e')).toBe('One/Tw o')
  })

  it('should return null for single segment path', () => {
    expect(getViewFolderPath('One')).toBeNull()
  })

  it('should handle empty segments correctly', () => {
    expect(getViewFolderPath(' / ')).toBeNull()
    expect(getViewFolderPath('One /  / Three')).toBe('One')
    expect(getViewFolderPath('One / Tw o / / Three')).toBe('One/Tw o')
  })

  it('should handle leading slashes', () => {
    expect(getViewFolderPath(' / One / Two')).toBe('One')
  })

  it('should return null for empty input', () => {
    expect(getViewFolderPath('')).toBeNull()
    expect(getViewFolderPath('   ')).toBeNull()
  })

  it('should handle trailing slashes', () => {
    expect(getViewFolderPath('One / Two /')).toBe('One')
  })
  it('should throw for multiline input', () => {
    expect(() => normalizeViewPath('One\nTwo')).toThrow()
  })
})

describe('getViewTitleFromPath', () => {
  it('should return the last path segment', () => {
    expect(extractViewTitleFromPath('One / Tw o / Thre e')).toBe('Thre e')
  })

  it('should return the input for single segment path', () => {
    expect(extractViewTitleFromPath('One')).toBe('One')
  })

  it('should handle empty segments correctly', () => {
    expect(extractViewTitleFromPath('One / Two / ')).toBe('Two')
    expect(extractViewTitleFromPath('One / / Two')).toBe('Two')
    expect(extractViewTitleFromPath('One / Two / /')).toBe('Two')
  })

  it('should handle empty input', () => {
    expect(extractViewTitleFromPath('')).toBe('')
  })

  it('should trim spaces from the title', () => {
    expect(extractViewTitleFromPath('One / Two / Three ')).toBe('Three')
  })

  it('should handle input with only spaces', () => {
    expect(extractViewTitleFromPath('   ')).toBe('')
  })
})
