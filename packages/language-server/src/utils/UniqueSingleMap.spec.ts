import { describe, expect, it } from 'vitest'
import { UniqueSingleMap, uniqueSingles } from './UniqueSingleMap'

describe('UniqueSingleMap', () => {
  it('should keep the key non-unique, no matter how many times it is set', () => {
    const map = new UniqueSingleMap<string, number>()
    map.set('once', 1)
    map.set('twice', 1).set('twice', 2)
    // third `set` must not bring the key back
    map.set('thrice', 1).set('thrice', 2).set('thrice', 3)

    expect([...map.uniqueValues()]).toEqual([1])
    expect([...map.values()]).toEqual([1])
    expect([...map.uniqueEntries()]).toEqual([['once', 1]])
  })

  it('should treat the same value set twice as non-unique', () => {
    const map = new UniqueSingleMap<string, number>()
    map.set('a', 1).set('a', 1)

    expect([...map.uniqueValues()]).toEqual([])
  })

  it('should still track non-unique keys', () => {
    const map = new UniqueSingleMap<string, number>()
    map.set('a', 1).set('a', 2).set('b', 3)

    // Used to exclude names shadowed by ambiguous declarations
    expect(map.has('a')).toBe(true)
    expect(map.has('b')).toBe(true)
    expect(map.has('c')).toBe(false)
    expect(map.size).toBe(2)
  })
})

describe('uniqueSingles', () => {
  it('should drop all items sharing the key and preserve order of the rest', () => {
    const items = ['b1', 'a1', 'c1', 'a2', 'd1', 'c2']

    expect(uniqueSingles(items, item => item.charAt(0))).toEqual(['b1', 'd1'])
  })

  it('should return empty array for empty input', () => {
    expect(uniqueSingles([], () => 'key')).toEqual([])
  })
})
