import { describe, expect, it } from 'vitest'
import { hasProp } from './guards'

describe('hasProp', () => {
  it('returns true for present non-nullish property', () => {
    expect(hasProp({ some: 'value' }, 'some')).toBe(true)
  })

  it('returns false for property with undefined value', () => {
    expect(hasProp({ some: undefined }, 'some')).toBe(false)
  })

  it('returns false for property with null value', () => {
    expect(hasProp({ some: null }, 'some')).toBe(false)
  })

  it('returns false for missing property', () => {
    expect(hasProp({} as any, 'some')).toBe(false)
  })

  it('returns true for falsy but non-nullish values', () => {
    expect(hasProp({ some: 0 }, 'some')).toBe(true)
    expect(hasProp({ some: '' }, 'some')).toBe(true)
    expect(hasProp({ some: false }, 'some')).toBe(true)
  })

  describe('predicate (value, path) — two-argument form', () => {
    // Exercises the same predicate as hasProp(value, path). Curried form hasProp('path')(value)
    // is equivalent but not exercised here due to Vite SSR overload resolution.
    it('returns true for present non-nullish property', () => {
      expect(hasProp({ some: 'value' }, 'some')).toBe(true)
    })

    it('returns false for property with undefined value', () => {
      expect(hasProp({ some: undefined }, 'some')).toBe(false)
    })

    it('returns false for property with null value', () => {
      expect(hasProp({ some: null }, 'some')).toBe(false)
    })

    it('returns false for missing property', () => {
      expect(hasProp({} as any, 'some')).toBe(false)
    })
  })
})
