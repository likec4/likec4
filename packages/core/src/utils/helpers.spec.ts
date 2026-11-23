import { describe, expect, expectTypeOf, it } from 'vitest'
import type { scalar } from '../types'
import { findById, hasId, hasTag } from './helpers'

describe('helpers', () => {
  describe('findById', () => {
    const items = [
      { id: 'a', name: 'alpha' },
      { id: 'b', name: 'beta' },
      { id: 'c', name: 'gamma' },
    ]

    describe('with iterable and id', () => {
      it('returns the item with matching id', () => {
        expect(findById(items, 'b')).toBe(items[1])
      })

      it('returns undefined when no item matches', () => {
        expect(findById(items, 'x')).toBeUndefined()
      })

      it('returns undefined for an empty iterable', () => {
        expect(findById([], 'a')).toBeUndefined()
      })

      it('works with any iterable (Set)', () => {
        expect(findById(new Set(items), 'c')).toBe(items[2])
      })
    })

    describe('as a predicate', () => {
      it('returns a predicate matching items by id', () => {
        expect(items.find(hasId('a'))).toBe(items[0])
        expect(items.find(hasId('x'))).toBeUndefined()
      })

      it('can be used with filter', () => {
        const tagged = [{ id: 1, ok: true }, { id: 2, ok: false }, { id: 3, ok: true }]
        expect(tagged.filter(hasId(3))).toEqual([{ id: 3, ok: true }])
      })
    })
  })

  describe('hasTag', () => {
    it('narrows type', () => {
      const items: { readonly tags?: readonly scalar.Tag[] | null }[] = [
        { tags: ['tag1' as scalar.Tag] as const },
        {},
      ]
      const found = items.find(hasTag('tag1'))!
      expectTypeOf(found.tags).toEqualTypeOf<readonly scalar.Tag[]>()

      const items2: { tags?: string[] | null }[] = [
        { tags: ['tag1'] },
      ]
      const found2 = items2.find(hasTag('tag1'))!
      expectTypeOf(found2.tags).toEqualTypeOf<string[]>()
    })

    const item = { tags: ['tag1', 'tag2'] as scalar.Tag[] | null }

    describe('with item and tag', () => {
      it('returns true when tag is present', () => {
        expect(hasTag(item, 'tag1')).toBe(true)
      })

      it('returns false when tag is absent', () => {
        expect(hasTag(item, 'tag3')).toBe(false)
      })

      it('returns false when tags is undefined', () => {
        expect(hasTag({ tags: undefined }, 'tag1')).toBe(false)
      })

      it('returns false when tags is null', () => {
        expect(hasTag({ tags: null }, 'tag1')).toBe(false)
      })

      it('returns false when tags is empty', () => {
        expect(hasTag({ tags: [] }, 'tag1')).toBe(false)
      })
    })

    describe('as a predicate', () => {
      it('returns a predicate matching items by tag', () => {
        const items = [{ tags: ['tag1'] }, { tags: ['tag2'] }, { tags: undefined }]
        expect(items.filter(hasTag('tag1'))).toEqual([{ tags: ['tag1'] }])
      })
    })
  })
})
