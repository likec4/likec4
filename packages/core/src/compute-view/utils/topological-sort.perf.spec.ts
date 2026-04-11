/**
 * Complexity regression tests for topologicalSort.
 *
 * These run in every CI build. They do not assert absolute timings (which are
 * hardware-dependent) but instead compare timing ratios at different input
 * sizes to detect algorithmic regressions:
 *
 *   O(n)   → ratio(10x nodes) ≈  10x slower
 *   O(n²)  → ratio(10x nodes) ≈ 100x slower
 *
 * The pre-existing ensureParentsFirst used shift()+findIndex() which is O(n²).
 * If that pattern is ever reintroduced, this test will catch it.
 */
import { describe, expect, it } from 'vitest'
import type { ComputedNode, scalar } from '../../types'
import { topologicalSort } from './topological-sort'

/**
 * Build a Map where N leaf nodes appear before their parent in iteration order.
 * This is the worst case for ensureParentsFirst: every leaf triggers a parent
 * lookup before it can be emitted.
 */
function makeChildrenBeforeParent(n: number): ReadonlyMap<string, ComputedNode> {
  const map = new Map<string, ComputedNode>()
  const node = (id: string, parent: string | null): ComputedNode =>
    ({
      id: id as scalar.NodeId,
      parent: parent as scalar.NodeId | null,
      kind: 'element',
      title: id,
      level: parent ? 1 : 0,
      depth: 0,
      children: [],
      inEdges: [],
      outEdges: [],
      color: 'primary',
      shape: 'rectangle',
      style: {},
      tags: [],
    }) as unknown as ComputedNode

  for (let i = 0; i < n; i++) {
    map.set(`root.leaf${i}`, node(`root.leaf${i}`, 'root'))
  }
  map.set('root', node('root', null))
  return map
}

function minMs(fn: () => void, runs = 5): number {
  return Math.min(...Array.from({ length: runs }, () => {
    const t = performance.now()
    fn()
    return performance.now() - t
  }))
}

describe('topologicalSort — complexity guardrails', () => {
  it('ensureParentsFirst scales linearly, not quadratically', () => {
    const SMALL = 300 // children-before-parent
    const LARGE = 3000 // 10× more nodes

    const small = makeChildrenBeforeParent(SMALL)
    const large = makeChildrenBeforeParent(LARGE)

    // Warmup: let the JIT settle
    for (let i = 0; i < 3; i++) {
      topologicalSort({ nodes: small, edges: [] })
      topologicalSort({ nodes: large, edges: [] })
    }

    const tSmall = minMs(() => topologicalSort({ nodes: small, edges: [] }))
    const tLarge = minMs(() => topologicalSort({ nodes: large, edges: [] }))

    // 10× more nodes.
    // O(n)  → ratio ≈  10×  (pass)
    // O(n²) → ratio ≈ 100×  (fail)
    // Threshold of 40× gives 4× headroom for JIT/GC jitter in CI.
    const ratio = tLarge / tSmall
    expect(ratio, `timing ratio ${ratio.toFixed(1)}× exceeds 40× — likely O(n²) regression in ensureParentsFirst`)
      .toBeLessThan(40)
  })

  it('post-topsort unsorted-node merge scales linearly', () => {
    // Half the nodes have edges (sorted by topsort), half don't (interleaved back).
    // The old O(n²) merge used findIndex/includes per node.
    const makeHalf = (n: number) => {
      const map = new Map<string, ComputedNode>()
      const node = (id: string): ComputedNode =>
        ({
          id: id as scalar.NodeId,
          parent: null,
          kind: 'element',
          title: id,
          level: 0,
          depth: 0,
          children: [],
          inEdges: [`e_${id}` as scalar.EdgeId],
          outEdges: [`e_${id}` as scalar.EdgeId],
          color: 'primary',
          shape: 'rectangle',
          style: {},
          tags: [],
        }) as unknown as ComputedNode
      for (let i = 0; i < n; i++) {
        map.set(`sorted_${i}`, node(`sorted_${i}`))
        map.set(`free_${i}`, { ...node(`free_${i}`), inEdges: [], outEdges: [] } as unknown as ComputedNode)
      }
      return map
    }

    const makeEdges = (n: number) =>
      Array.from({ length: n - 1 }, (_, i) => ({
        id: `e_sorted_${i}` as scalar.EdgeId,
        source: `sorted_${i}` as scalar.NodeId,
        target: `sorted_${i + 1}` as scalar.NodeId,
        parent: null,
        label: null,
        relations: [],
        color: 'primary' as const,
        line: 'solid' as const,
        head: 'normal' as const,
      }))

    const SMALL = 200
    const LARGE = 2000

    const sNodes = makeHalf(SMALL)
    const lNodes = makeHalf(LARGE)
    const sEdges = makeEdges(SMALL)
    const lEdges = makeEdges(LARGE)

    for (let i = 0; i < 3; i++) {
      topologicalSort({ nodes: sNodes, edges: sEdges })
      topologicalSort({ nodes: lNodes, edges: lEdges })
    }

    const tSmall = minMs(() => topologicalSort({ nodes: sNodes, edges: sEdges }))
    const tLarge = minMs(() => topologicalSort({ nodes: lNodes, edges: lEdges }))

    const ratio = tLarge / tSmall
    expect(ratio, `timing ratio ${ratio.toFixed(1)}× exceeds 40× — likely O(n²) regression in unsorted-node merge`)
      .toBeLessThan(40)
  })
})
