import type { ComputedView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { computeStructuralKey, LayoutHintsCache } from './cache'

function makeView(
  overrides: Partial<{
    nodes: Array<{ id: string; kind: string; parent: string | null; children: string[] }>
    edges: Array<{ id: string; source: string; target: string }>
    direction: string
    title: string
  }>,
): ComputedView {
  const defaults = {
    nodes: [
      { id: 'a', kind: 'service', parent: null, children: [] },
      { id: 'b', kind: 'service', parent: null, children: [] },
    ],
    edges: [
      { id: 'a:b', source: 'a', target: 'b' },
    ],
    direction: 'TB',
    title: 'Test View',
  }
  const merged = { ...defaults, ...overrides }
  return {
    id: 'test-view',
    autoLayout: { direction: merged.direction },
    nodes: merged.nodes.map(n => ({
      ...n,
      title: merged.title,
      level: 0,
      shape: 'rectangle',
      color: '#000',
      inEdges: [],
      outEdges: [],
      style: {},
    })),
    edges: merged.edges.map(e => ({
      ...e,
      label: null,
      parent: null,
      relations: [],
      color: '#000',
      line: 'dashed',
    })),
  } as unknown as ComputedView
}

describe('computeStructuralKey', () => {
  it('produces same key for same structure', () => {
    const v1 = makeView({})
    const v2 = makeView({})
    expect(computeStructuralKey(v1)).toBe(computeStructuralKey(v2))
  })

  it('ignores title changes', () => {
    const v1 = makeView({ title: 'First' })
    const v2 = makeView({ title: 'Second' })
    expect(computeStructuralKey(v1)).toBe(computeStructuralKey(v2))
  })

  it('differs when nodes change', () => {
    const v1 = makeView({})
    const v2 = makeView({
      nodes: [
        { id: 'a', kind: 'service', parent: null, children: [] },
        { id: 'c', kind: 'service', parent: null, children: [] },
      ],
    })
    expect(computeStructuralKey(v1)).not.toBe(computeStructuralKey(v2))
  })

  it('differs when edges change', () => {
    const v1 = makeView({})
    const v2 = makeView({
      edges: [{ id: 'b:a', source: 'b', target: 'a' }],
    })
    expect(computeStructuralKey(v1)).not.toBe(computeStructuralKey(v2))
  })

  it('differs when direction changes', () => {
    const v1 = makeView({ direction: 'TB' })
    const v2 = makeView({ direction: 'LR' })
    expect(computeStructuralKey(v1)).not.toBe(computeStructuralKey(v2))
  })
})

describe('LayoutHintsCache', () => {
  it('returns undefined for uncached view', () => {
    const cache = new LayoutHintsCache()
    const view = makeView({})
    expect(cache.get(view)).toBeUndefined()
  })

  it('returns cached hints', () => {
    const cache = new LayoutHintsCache()
    const view = makeView({})
    const hints = { ranks: [{ type: 'same' as const, nodes: ['a', 'b'] as any[] }] }
    cache.set(view, hints)
    expect(cache.get(view)).toEqual(hints)
  })

  it('invalidates cache', () => {
    const cache = new LayoutHintsCache()
    const view = makeView({})
    cache.set(view, {})
    cache.invalidate(view)
    expect(cache.get(view)).toBeUndefined()
  })

  it('clears all cache', () => {
    const cache = new LayoutHintsCache()
    const v1 = makeView({})
    const v2 = makeView({ direction: 'LR' })
    cache.set(v1, {})
    cache.set(v2, {})
    cache.clear()
    expect(cache.get(v1)).toBeUndefined()
    expect(cache.get(v2)).toBeUndefined()
  })
})
