import { describe, expect, it } from 'vitest'
import { LikeC4Model } from '../../model'
import type { ComputedEdge, ComputedNode, EdgeId, scalar } from '../../types'
import { type ComputedNodeSource, buildComputedNodes } from './buildComputedNodes'
import { linkNodesWithEdges } from './link-nodes-with-edges'

function makeNodes<const Id extends string>(ids: Id[]) {
  return buildComputedNodes(
    LikeC4Model.EMPTY.$styles,
    ids.map(id => ({ id, title: id }) as any as ComputedNodeSource),
  )
}

/**
 * Build a nodes map with explicit level values, bypassing buildComputedNodes.
 * Used to test scenarios involving group nodes, where buildComputedNodes
 * unconditionally sets level=0 for ALL group nodes — even nested ones.
 * This means two elements can both have level=1 even when one is 2 levels
 * deep (inside a nested group). The LCA algorithm must use parentDepth()
 * (walk to root) rather than node.level to handle this correctly.
 */
function makeNodesMapDirect(
  entries: Array<{ id: string; parent: string | null; level?: number }>,
): ReadonlyMap<string, ComputedNode> {
  const map = new Map<string, ComputedNode>()
  for (const e of entries) {
    map.set(e.id, {
      id: e.id,
      parent: e.parent,
      kind: 'element',
      title: e.id,
      level: e.level ?? 0,
      depth: 0,
      children: [],
      inEdges: [],
      outEdges: [],
      color: 'primary',
      shape: 'rectangle',
      style: {},
      tags: [],
    } as unknown as ComputedNode)
  }
  return map
}

function makeEdge(source: string, target: string): ComputedEdge {
  return {
    id: `${source}->${target}` as EdgeId,
    source: source as scalar.NodeId,
    target: target as scalar.NodeId,
    parent: null,
    label: null,
    relations: [],
    color: 'primary',
    line: 'solid',
    head: 'normal',
  } as ComputedEdge
}

describe('linkNodesWithEdges', () => {
  describe('edge.parent — deepest common parent (LCA)', () => {
    it('siblings under the same parent', () => {
      const nodes = makeNodes(['cloud', 'cloud.frontend', 'cloud.backend'])
      const edge = makeEdge('cloud.frontend', 'cloud.backend')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('cloud')
    })

    it('root-level nodes have no common parent', () => {
      const nodes = makeNodes(['customer', 'cloud'])
      const edge = makeEdge('customer', 'cloud')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBeNull()
    })

    it('edge from a node to its direct parent has no common ancestor', () => {
      const nodes = makeNodes(['cloud', 'cloud.backend'])
      const edge = makeEdge('cloud.backend', 'cloud')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBeNull()
    })

    it('edge from a parent to its direct child has no common ancestor', () => {
      const nodes = makeNodes(['cloud', 'cloud.backend'])
      const edge = makeEdge('cloud', 'cloud.backend')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBeNull()
    })

    it('cousins share a grandparent', () => {
      const nodes = makeNodes([
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.frontend.ui',
        'cloud.backend.api',
      ])
      const edge = makeEdge('cloud.frontend.ui', 'cloud.backend.api')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('cloud')
    })

    it('asymmetric depth: deep node to shallow sibling of its ancestor', () => {
      const nodes = makeNodes([
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.backend.api',
      ])
      const edge = makeEdge('cloud.backend.api', 'cloud.frontend')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('cloud')
    })

    it('nodes within the same sub-tree share the nearest ancestor', () => {
      const nodes = makeNodes([
        'cloud',
        'cloud.backend',
        'cloud.backend.api',
        'cloud.backend.db',
      ])
      const edge = makeEdge('cloud.backend.api', 'cloud.backend.db')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('cloud.backend')
    })

    it('self-edge: common parent is the node\'s own parent', () => {
      const nodes = makeNodes(['cloud', 'cloud.backend'])
      const edge = makeEdge('cloud.backend', 'cloud.backend')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('cloud')
    })
  })

  describe('inEdges / outEdges propagation', () => {
    it('propagates outEdges up the source ancestor chain to (not including) edge.parent', () => {
      const nodes = makeNodes(['cloud', 'cloud.backend', 'cloud.backend.api', 'amazon'])
      const edge = makeEdge('cloud.backend.api', 'amazon')
      linkNodesWithEdges(nodes, [edge])

      const api = nodes.get('cloud.backend.api' as scalar.NodeId)!
      const backend = nodes.get('cloud.backend' as scalar.NodeId)!
      const cloud = nodes.get('cloud' as scalar.NodeId)!

      expect(api.outEdges).toContain(edge.id)
      expect(backend.outEdges).toContain(edge.id)
      expect(cloud.outEdges).toContain(edge.id)
    })

    it('propagates inEdges up the target ancestor chain to (not including) edge.parent', () => {
      const nodes = makeNodes(['customer', 'cloud', 'cloud.backend', 'cloud.backend.api'])
      const edge = makeEdge('customer', 'cloud.backend.api')
      linkNodesWithEdges(nodes, [edge])

      const api = nodes.get('cloud.backend.api' as scalar.NodeId)!
      const backend = nodes.get('cloud.backend' as scalar.NodeId)!
      const cloud = nodes.get('cloud' as scalar.NodeId)!

      expect(api.inEdges).toContain(edge.id)
      expect(backend.inEdges).toContain(edge.id)
      expect(cloud.inEdges).toContain(edge.id)
    })

    it('does not propagate to the edge.parent node itself', () => {
      const nodes = makeNodes(['cloud', 'cloud.frontend', 'cloud.backend'])
      const edge = makeEdge('cloud.frontend', 'cloud.backend')
      linkNodesWithEdges(nodes, [edge])

      // edge.parent === 'cloud', so cloud must NOT get outEdges or inEdges from this edge
      const cloud = nodes.get('cloud' as scalar.NodeId)!
      expect(cloud.outEdges).not.toContain(edge.id)
      expect(cloud.inEdges).not.toContain(edge.id)
    })

    it('multiple edges accumulate independently', () => {
      const nodes = makeNodes(['cloud', 'cloud.frontend', 'cloud.backend', 'amazon'])
      const e1 = makeEdge('cloud.frontend', 'cloud.backend')
      const e2 = makeEdge('cloud.frontend', 'amazon')
      linkNodesWithEdges(nodes, [e1, e2])

      const frontend = nodes.get('cloud.frontend' as scalar.NodeId)!
      expect(frontend.outEdges).toContain(e1.id)
      expect(frontend.outEdges).toContain(e2.id)
      expect(e1.parent).toBe('cloud')
      expect(e2.parent).toBeNull()
    })
  })

  describe('group nodes — level=0 for all groups regardless of nesting depth', () => {
    // buildComputedNodes sets level=0 unconditionally for group nodes, even when nested.
    // This means two elements can both have level=1 when one is directly in a group
    // and the other is inside a nested group — yet they are at different actual depths.
    // deepestCommonParentId must use parentDepth() (walk to root) not node.level.

    it('element in nested group vs element in outer group: LCA is the outer group', () => {
      // Topology:
      //   @gr1 (group, level=0, parent=null)
      //   ├── elem_b (level=1, parent=@gr1)
      //   └── @gr2 (group, level=0, parent=@gr1) ← nested group, ALSO level=0
      //       └── elem_a (level=1, parent=@gr2)   ← same level as elem_b despite being deeper
      const nodes = makeNodesMapDirect([
        { id: '@gr1', parent: null, level: 0 },
        { id: '@gr2', parent: '@gr1', level: 0 }, // nested group, still level=0
        { id: 'elem_a', parent: '@gr2', level: 1 }, // @gr2.level + 1 = 1
        { id: 'elem_b', parent: '@gr1', level: 1 }, // @gr1.level + 1 = 1 — same as elem_a!
      ])
      const edge = makeEdge('elem_a', 'elem_b')
      linkNodesWithEdges(nodes, [edge])
      // LCA must be @gr1 (the outer group that contains both paths)
      // With node.level-based depth, both appear at depth=1 and the algorithm
      // would skip @gr1, returning null. parentDepth() walks to root and finds
      // elem_a is actually 2 levels deep, correctly resolving to @gr1.
      expect(edge.parent).toBe('@gr1')
    })

    it('elements in the same nested group: LCA is that nested group', () => {
      const nodes = makeNodesMapDirect([
        { id: '@gr1', parent: null, level: 0 },
        { id: '@gr2', parent: '@gr1', level: 0 },
        { id: 'elem_a', parent: '@gr2', level: 1 },
        { id: 'elem_b', parent: '@gr2', level: 1 },
      ])
      const edge = makeEdge('elem_a', 'elem_b')
      linkNodesWithEdges(nodes, [edge])
      expect(edge.parent).toBe('@gr2')
    })
  })
})
