import { describe, expect, it } from 'vitest'
import { parseLayoutHints } from './types'

const parse = (input: any) => {
  if (typeof input === 'string') {
    return parseLayoutHints(input)
  }
  return parseLayoutHints(JSON.stringify(input))
}

describe('parseLayoutHints', () => {
  it('parses valid JSON', () => {
    const input = {
      graph: { direction: 'TB', nodeSep: 100, rankSep: 120 },
      ranks: [{ type: 'same', nodes: ['a', 'b'] }],
      nodes: [{ id: 'a', group: 'g1' }],
      edges: [{ id: 'e1', weight: 5, minlen: 2, constraint: false }],
      reasoning: 'test reasoning',
    }
    const hints = parse(input)
    expect(hints).toEqual(input)
  })

  it('extracts JSON from markdown code fence', () => {
    const raw = '```json\n{"ranks":[{"type":"source","nodes":["user"]}]}\n```'
    const hints = parseLayoutHints(raw)
    expect(hints).toBeTruthy()
    expect(hints!.ranks).toHaveLength(1)
    expect(hints!.ranks![0]!.type).toBe('source')
  })

  it('extracts JSON from bare code fence', () => {
    const raw = '```\n{"graph":{"direction":"LR"}}\n```'
    const hints = parseLayoutHints(raw)
    expect(hints).toBeTruthy()
    expect(hints!.graph!.direction).toBe('LR')
  })

  it('extracts JSON surrounded by text', () => {
    const raw = 'Here is the layout: {"graph":{"direction":"BT"}} and more text'
    const hints = parseLayoutHints(raw)
    expect(hints).toBeTruthy()
    expect(hints!.graph!.direction).toBe('BT')
  })

  it('returns null for invalid JSON', () => {
    expect(parseLayoutHints('not json')).toBeNull()
    expect(parseLayoutHints('')).toBeNull()
    expect(parseLayoutHints('{invalid}')).toBeNull()
  })

  it('returns null for non-object JSON', () => {
    expect(parseLayoutHints('42')).toBeNull()
    expect(parseLayoutHints('"string"')).toBeNull()
    expect(parseLayoutHints('[]')).toBeNull()
  })

  it('drops invalid rank types', () => {
    const hints = parse({
      ranks: [
        { type: 'same', nodes: ['a'] },
        { type: 'invalid', nodes: ['b'] },
      ],
    })
    expect(hints!.ranks).toHaveLength(1)
    expect(hints!.ranks![0]!.type).toBe('same')
  })

  it('drops ranks with empty nodes', () => {
    const raw = JSON.stringify({
      ranks: [{ type: 'same', nodes: [] }],
    })
    const hints = parseLayoutHints(raw)
    expect(hints!.ranks).toBeUndefined()
  })

  it('clamps edge weight/minlen to valid ranges', () => {
    const raw = JSON.stringify({
      edges: [
        { id: 'e1', weight: 200 },
        { id: 'e2', weight: 50 },
        { id: 'e3', minlen: 20 },
      ],
    })
    const hints = parseLayoutHints(raw)
    expect(hints!.edges).toHaveLength(3)
    // weight 200 exceeds max of 100 — dropped
    expect(hints!.edges![0]!.weight).toBeUndefined()
    // weight 50 is valid
    expect(hints!.edges![1]!.weight).toBe(50)
    // minlen 20 exceeds max of 10 — dropped
    expect(hints!.edges![2]!.minlen).toBeUndefined()
  })

  it('validates graph direction values', () => {
    const raw = JSON.stringify({ graph: { direction: 'INVALID' } })
    const hints = parseLayoutHints(raw)
    expect(hints).not.toHaveProperty('graph')
  })

  it('validates nodeSep/rankSep ranges', () => {
    const raw = JSON.stringify({ graph: { nodeSep: 10, rankSep: 600 } })
    const hints = parseLayoutHints(raw)
    // 10 < 20 minimum — dropped
    expect(hints?.graph?.nodeSep).toBeUndefined()
    // 600 > 500 maximum — dropped
    expect(hints?.graph?.rankSep).toBeUndefined()
  })

  it('handles minimal empty object', () => {
    const hints = parseLayoutHints('{}')
    expect(hints).toEqual({})
  })
})
