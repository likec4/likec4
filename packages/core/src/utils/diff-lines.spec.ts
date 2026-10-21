import { describe, expect, it } from 'vitest'
import { collapseUnchanged, diffLines } from './diff-lines'

describe('diffLines', () => {
  it('returns unchanged lines for equal texts', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: 'b' },
    ])
  })

  it('reports added and removed lines', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc\nd')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'removed', line: 'b' },
      { type: 'added', line: 'x' },
      { type: 'same', line: 'c' },
      { type: 'added', line: 'd' },
    ])
  })

  it('keeps the common subsequence', () => {
    const changes = diffLines('1\n2\n3\n4\n5', '1\n3\n4\n6\n5')
    expect(changes.filter(c => c.type === 'same').map(c => 'line' in c && c.line)).toEqual(['1', '3', '4', '5'])
  })
})

describe('collapseUnchanged', () => {
  it('keeps context around changes', () => {
    const changes = diffLines('1\n2\n3\n4\n5\n6\n7', '1\n2\n3\nx\n5\n6\n7')
    expect(collapseUnchanged(changes, 1)).toEqual([
      { type: 'skipped', count: 2 },
      { type: 'same', line: '3' },
      { type: 'removed', line: '4' },
      { type: 'added', line: 'x' },
      { type: 'same', line: '5' },
      { type: 'skipped', count: 2 },
    ])
  })
})
