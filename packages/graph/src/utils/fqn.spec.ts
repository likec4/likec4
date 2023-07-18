import { expect, describe, it } from 'vitest'
import type { Fqn, Element } from '../types'
import {
  commonAncestor,
  compareFqnHierarchically,
  isAncestor,
  isDescendantOf,
  notDescendantOf,
  parentFqn
} from './fqn'

const el = (id: string): Element => ({ id }) as unknown as Element

describe('parentFqn', () => {
  it('should return null if no parent', () => {
    expect(parentFqn('a' as Fqn)).toBeNull()
  })
  it('should return parent', () => {
    expect(parentFqn('a.b' as Fqn)).toBe('a')
    expect(parentFqn('a.b.c' as Fqn)).toBe('a.b')
  })
})

describe('commonAncestor', () => {
  it('should return null if no common ancestor', () => {
    expect(commonAncestor('a' as Fqn, 'b' as Fqn)).toBeNull()
    expect(commonAncestor('a.b' as Fqn, 'c.d' as Fqn)).toBeNull()
  })

  it('should return common ancestor', () => {
    expect(commonAncestor('a.b' as Fqn, 'a.c' as Fqn)).toBe('a')
    expect(commonAncestor('a.b.c' as Fqn, 'a.b.e' as Fqn)).toBe('a.b')
    expect(commonAncestor('a.b.c.d.e' as Fqn, 'a.b.c.d' as Fqn)).toBe('a.b.c')
  })
})

describe('isAncestor', () => {
  it('should return true if ancestor', () => {
    expect(isAncestor('a' as Fqn, 'a.b' as Fqn)).toBe(true)
    expect(isAncestor('a.b' as Fqn, 'a.b.c' as Fqn)).toBe(true)
  })
  it('should return false if not ancestor', () => {
    expect(isAncestor('a' as Fqn, 'b' as Fqn)).toBe(false)
    expect(isAncestor('a.b' as Fqn, 'a' as Fqn)).toBe(false)
    expect(isAncestor('a.b' as Fqn, 'b.a' as Fqn)).toBe(false)
  })
})

describe('isDescendantOf', () => {
  const predicate = isDescendantOf(['a', 'b', 'a.b', 'a.b.c'].map(el))

  it('should return true if isDescendantOf', () => {
    expect(predicate(el('a'))).toBe(true)
    expect(predicate(el('b.c'))).toBe(true)
    expect(predicate(el('a.b.c.d.e'))).toBe(true)
  })
  it('should return false if not descendantOf', () => {
    expect(predicate(el('c'))).toBe(false)
    expect(predicate(el('ac'))).toBe(false)
    expect(predicate(el('d.a.c'))).toBe(false)
  })
})

describe('notDescendantOf', () => {
  const predicate = notDescendantOf(['a', 'b', 'a.b', 'a.b.c'].map(el))

  it('should return true if notDescendantOf', () => {
    expect(predicate(el('c'))).toBe(true)
    expect(predicate(el('ac'))).toBe(true)
    expect(predicate(el('d.a.c'))).toBe(true)
  })
  it('should return false if descendantOf', () => {
    expect(predicate(el('a'))).toBe(false)
    expect(predicate(el('b.c'))).toBe(false)
    expect(predicate(el('a.b.c.d.e'))).toBe(false)
  })
})

describe('compareFqnHierarchically', () => {
  it('should compare hierarchically', () => {
    expect(['a', 'b', 'a.b', 'a.b.c', 'a.c.c'].sort(compareFqnHierarchically)).toEqual([
      'a',
      'b',
      'a.b',
      'a.b.c',
      'a.c.c'
    ])
  })

  it('should preserve initial order', () => {
    expect(
      ['aaa', 'aa', 'a', 'aaa.c', 'aa.b', 'a.c', 'a.b'].sort(compareFqnHierarchically)
    ).toEqual(['aaa', 'aa', 'a', 'aaa.c', 'aa.b', 'a.c', 'a.b'])
  })
})
