import type * as t from '@likec4/core/types'
import { indexBy } from 'remeda'
import { describe, it } from 'vitest'
import { type Patches, prepareFixtures } from './__tests__/fixture'
import { applyChangesToManualLayout } from './applyChangesToManualLayout'

export function testData<const Nodes, Edges>(patches?: Patches<Nodes, Edges>) {
  const {
    snapshot,
    snapshotNodes,
    snapshotEdges,
    layouted,
    layoutedNodes,
    layoutedEdges,
  } = prepareFixtures(patches)

  const result = applyChangesToManualLayout(snapshot, layouted)
  const resultNodes = indexBy(result.nodes, n => n.id) as typeof layoutedNodes
  const resultEdges = indexBy(result.edges, e => e.id) as typeof layoutedEdges

  return {
    result,
    resultNodes,
    resultEdges,
    manual: snapshot,
    manualNodes: snapshotNodes,
    manualEdges: snapshotEdges,
    latest: layouted,
    latestNodes: layoutedNodes,
    latestEdges: layoutedEdges,
  }
}

describe('applyChangesToManualLayout', () => {
  it('should take latestView as base structure', ({ expect }) => {
    const { result, latest } = testData({})

    // Result should have same nodes as latest (base)
    expect(result.nodes.length).toBe(latest.nodes.length)
    expect(result.edges.length).toBe(latest.edges.length)
    expect(result._layout).toBe('manual')
  })

  it('should preserve positions from manual layout', ({ expect }) => {
    const { resultNodes, manualNodes, latestNodes } = testData({
      nodes: {
        'saas.backend.api': {
          title: 'Updated API',
          color: 'secondary' as any,
        },
      },
    })

    // Hierarchy comes from latest (base)
    expect(resultNodes['saas.backend'].children).toContain('saas.backend.api')
    expect(resultNodes['saas.backend.api'].parent).toBe('saas.backend')

    // Properties come from latest
    expect(resultNodes['saas.backend.api'].title).toBe('Updated API')

    // Position should be preserved from manual
    expect(resultNodes['saas.backend.api'].x).toBe(manualNodes['saas.backend.api'].x)
    expect(resultNodes['saas.backend.api'].y).toBe(manualNodes['saas.backend.api'].y)

    // Compound nodes should be expanded
    const saasBackend = resultNodes['saas.backend']
    expect(saasBackend?.width).toBeGreaterThan(0)
    expect(saasBackend?.height).toBeGreaterThan(0)
  })

  it('should handle added nodes with their positions from latest', ({ expect }) => {
    const { resultNodes, latestNodes } = testData({
      nodes: {
        'saas.newservice': {
          title: 'New Service',
          x: 100,
          y: 200,
          width: 300,
          height: 150,
        },
      },
    })

    const newService = resultNodes['saas.newservice']
    const saas = resultNodes['saas']

    expect(newService).toBeDefined()
    expect(newService?.title).toBe('New Service')
    // New node uses position from latest
    expect(newService?.x).toBe(100)
    expect(newService?.y).toBe(200)
    // Parent is expanded to include new child
    if (saas && newService) {
      expect(saas.x).toBeLessThanOrEqual(newService.x)
      expect(saas.y).toBeLessThanOrEqual(newService.y)
      expect(saas.x + saas.width).toBeGreaterThanOrEqual(newService.x + newService.width)
      expect(saas.y + saas.height).toBeGreaterThanOrEqual(newService.y + newService.height)
    }
  })

  it('should use hierarchy from latest view', ({ expect }) => {
    const { resultNodes, latestNodes } = testData({
      nodes: {
        'saas.frontend.spa.dashboard': {
          title: 'Dashboard',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
      },
    })

    // All hierarchy comes from latest
    expect(resultNodes['saas.frontend.spa.dashboard']).toBeDefined()
    expect(resultNodes['saas.frontend.spa.dashboard']?.title).toBe('Dashboard')

    // Structure matches latest
    expect(resultNodes['saas']?.children).toEqual(latestNodes['saas']?.children)
    expect(resultNodes['saas.frontend']?.children).toEqual(latestNodes['saas.frontend']?.children)
  })

  it('should update view properties from latest', ({ expect }) => {
    const { result, manual } = testData({
      view: {
        title: 'Updated Title',
        description: 'Updated Description' as any,
      },
    })

    expect(result.title).toBe('Updated Title')
    expect(result.description).toBe('Updated Description')
    expect(result.id).toBe(manual.id)
    expect(result._type).toBe(manual._type)
  })

  it('should recalculate bounds based on root nodes', ({ expect }) => {
    const { result } = testData({})

    const rootNodes = result.nodes.filter(n => !n.parent)
    expect(rootNodes.length).toBeGreaterThan(0)

    // Bounds should encompass all root nodes
    for (const node of rootNodes) {
      expect(result.bounds.x).toBeLessThanOrEqual(node.x)
      expect(result.bounds.y).toBeLessThanOrEqual(node.y)
      expect(result.bounds.x + result.bounds.width).toBeGreaterThanOrEqual(node.x + node.width)
      expect(result.bounds.y + result.bounds.height).toBeGreaterThanOrEqual(node.y + node.height)
    }
  })

  it('should handle nodes with updated properties', ({ expect }) => {
    const { resultNodes, manualNodes } = testData({
      nodes: {
        'customer': {
          title: 'Premium Customer',
          color: 'blue' as any,
          shape: 'cylinder' as any,
        },
        'saas.backend.api': {
          title: 'API Gateway',
          icon: 'tech:aws' as any,
          tags: ['api', 'gateway'],
        },
      },
    })

    // Customer updates
    const customer = resultNodes['customer']
    expect(customer?.title).toBe('Premium Customer')
    expect(customer?.color).toBe('blue')
    expect(customer?.shape).toBe('cylinder')
    // Position preserved
    expect(customer?.x).toBe(manualNodes['customer'].x)
    expect(customer?.y).toBe(manualNodes['customer'].y)

    // API updates
    const api = resultNodes['saas.backend.api']
    expect(api.title).toBe('API Gateway')
    expect(api.icon).toBe('tech:aws')
    expect(api.tags).toEqual(['api', 'gateway'])
    // Position preserved
    expect(api.x).toBe(manualNodes['saas.backend.api'].x)
    expect(api.y).toBe(manualNodes['saas.backend.api'].y)
  })

  it('should handle deep nesting from latest', ({ expect }) => {
    const { resultNodes, latestNodes } = testData({
      nodes: {
        'saas.backend.api.v1': {
          title: 'API v1',
          parent: 'saas.backend.api' as any,
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
        'saas.backend.api': d => {
          d.children.push('saas.backend.api.v1' as any)
        },
      },
    })

    const v1 = resultNodes['saas.backend.api.v1']
    const api = resultNodes['saas.backend.api']

    // Structure comes from latest
    expect(v1).toBeDefined()
    expect(v1.parent).toBe('saas.backend.api')
    expect(api.children).toContain('saas.backend.api.v1')

    // Position from latest for new node
    expect(v1.x).toBe(100)
    expect(v1.y).toBe(100)
  })

  it('should clear drift information', ({ expect }) => {
    const { result, resultNodes } = testData({
      nodes: {
        'customer': d => {
          d.drifts = ['added']
        },
        'saas.backend.api': d => {
          d.drifts = ['removed', 'added']
        },
      },
    })

    expect(resultNodes['customer']?.drifts).toBeNull()
    expect(resultNodes['saas.backend.api']?.drifts).toBeNull()
    // drifts should be undefined after clearing (property deleted)
    expect(result.drifts).toBeUndefined()
  })

  it('should handle compound nodes with padding', ({ expect }) => {
    const { resultNodes } = testData({})

    // Check that compound nodes wrap their children with padding
    const saasBackend = resultNodes['saas.backend']
    const children = [
      resultNodes['saas.backend.api'],
      resultNodes['saas.backend.auth'],
      resultNodes['saas.backend.worker'],
    ].filter(n => !!n) as t.DiagramNode[]

    if (children.length > 0 && saasBackend) {
      // Find the bounding box of children
      const minX = Math.min(...children.map(n => n.x))
      const minY = Math.min(...children.map(n => n.y))
      const maxX = Math.max(...children.map(n => n.x + n.width))
      const maxY = Math.max(...children.map(n => n.y + n.height))

      // Parent should have padding around children (42, 60, 42, 42)
      expect(saasBackend.x).toBeLessThan(minX)
      expect(saasBackend.y).toBeLessThan(minY)
      expect(saasBackend.x + saasBackend.width).toBeGreaterThan(maxX)
      expect(saasBackend.y + saasBackend.height).toBeGreaterThan(maxY)

      // Check approximate padding (allowing for rounding)
      expect(minX - saasBackend.x).toBeCloseTo(42, 1)
      expect(minY - saasBackend.y).toBeCloseTo(60, 1)
    }
  })

  it('should maintain consistency between parent children arrays and child parent references', ({ expect }) => {
    const { result, resultNodes } = testData({})

    // For each node with children, verify bidirectional relationship
    for (const node of result.nodes) {
      if (node.children.length > 0) {
        for (const childId of node.children) {
          const child = resultNodes[childId]
          expect(child).toBeDefined()
          expect(child?.parent).toBe(node.id)
        }
      }

      if (node.parent) {
        const parent = resultNodes[node.parent]
        expect(parent).toBeDefined()
        expect(parent?.children).toContain(node.id)
      }
    }
  })

  it('should include edges between added nodes', ({ expect }) => {
    const { result, resultEdges, latestEdges } = testData({
      nodes: {
        'new.node1': {
          title: 'New Node 1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
        'new.node2': {
          title: 'New Node 2',
          x: 400,
          y: 100,
          width: 200,
          height: 100,
        },
      },
      edges: {
        'new.node1:new.node2': {
          source: 'new.node1' as any,
          target: 'new.node2' as any,
        },
      },
    })

    // Should include edge between two added nodes
    expect(result.edges).toContain(latestEdges['new.node1:new.node2'])
  })

  it('should not include edges between added and existing nodes', ({ expect }) => {
    const { result, latestEdges } = testData({
      nodes: {
        'new.node': {
          title: 'New Node',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
      },
      edges: {
        'new.node:customer': {
          source: 'new.node' as any,
          target: 'customer' as any,
        },
        'customer:new.node': {
          source: 'customer' as any,
          target: 'new.node' as any,
        },
      },
    })

    // Should not include edges connecting to existing nodes
    expect(result.edges).not.toContain(latestEdges['new.node:customer'])
    expect(result.edges).not.toContain(latestEdges['customer:new.node'])
  })
})
