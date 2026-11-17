import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sha1Hex, stableHash } from './sha1.ts'

describe('sha1Hex', () => {
  it('matches NIST test vectors and node:crypto', () => {
    const samples = [
      '',
      'abc',
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      'a'.repeat(1000),
      '你好，LikeC4 🚀 markdown preview',
    ]
    for (const input of samples) {
      const expected = createHash('sha1').update(input, 'utf8').digest('hex')
      expect(sha1Hex(input)).toBe(expected)
    }
  })
})

describe('stableHash', () => {
  it('is invariant under object key reordering at any depth', () => {
    const a = { z: 1, a: { y: true, x: [1, { b: 'two', a: 'one' }] }, skipped: undefined }
    const b = { a: { x: [1, { a: 'one', b: 'two' }], y: true }, z: 1 }
    expect(stableHash(a)).toBe(stableHash(b))
    expect(stableHash(a)).toHaveLength(16)
  })

  it('distinguishes values and respects array ordering', () => {
    expect(stableHash({ items: [1, 2] })).not.toBe(stableHash({ items: [2, 1] }))
    expect(stableHash('hello', 6)).toHaveLength(6)
  })
})
