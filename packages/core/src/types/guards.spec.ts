import { describe, expect, it } from 'vitest'
import { _type } from './const'
import { hasProp } from './guards'
import { isStoryView } from './view'
import type { AnyStoryView } from './view'

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
    const obj: Record<string, unknown> = {}
    expect(hasProp(obj, 'some')).toBe(false)
  })

  it('returns true for falsy but non-nullish values', () => {
    expect(hasProp({ some: 0 }, 'some')).toBe(true)
    expect(hasProp({ some: '' }, 'some')).toBe(true)
    expect(hasProp({ some: false }, 'some')).toBe(true)
  })

  describe('curried form hasProp(path)(value)', () => {
    it('returns true for present non-nullish property', () => {
      expect(hasProp('some')({ some: 'value' })).toBe(true)
    })

    it('returns false for property with undefined value', () => {
      expect(hasProp('some')({ some: undefined })).toBe(false)
    })

    it('returns false for property with null value', () => {
      expect(hasProp('some')({ some: null })).toBe(false)
    })

    it('returns false for missing property', () => {
      expect(hasProp('some')({ other: 1 })).toBe(false)
    })
  })
})

describe('isStoryView', () => {
  it('returns true for a story view', () => {
    const view = { [_type]: 'story' } as unknown as AnyStoryView<any>
    expect(isStoryView(view)).toBe(true)
  })

  it('returns false for a malformed non-story value', () => {
    const view = { [_type]: 'element' } as unknown as AnyStoryView<any>
    expect(isStoryView(view)).toBe(false)
  })
})
