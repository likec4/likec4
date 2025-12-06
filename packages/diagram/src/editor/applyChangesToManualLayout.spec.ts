import type * as t from '@likec4/core/types'
import { indexBy } from 'remeda'
import { describe, it } from 'vitest'
import { type Patches, prepareFixtures } from './__tests__/fixture'
import { applyChangesToManualLayout, nodesDiff } from './applyChangesToManualLayout'

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

describe('nodesDiff', () => {
  it('should detect removed nodes', ({ expect }) => {
    const { manual, manualNodes, latest } = testData({
      nodes: {
        'saas.backend.auth': null,
        'external.database': null,
        'customer': null,
      },
    })

    const diff = nodesDiff(manual, latest)

    expect(diff.removed).toEqual([
      manualNodes['customer'],
      manualNodes['saas.backend.auth'],
      manualNodes['external.database'],
    ])
    expect(diff.updated).toHaveLength(manual.nodes.length - 3)
    expect(diff.added).toHaveLength(0)
  })

  it('should detect added nodes', ({ expect }) => {
    const { manual, latest, latestNodes } = testData({
      nodes: {
        'new.node1': {
          title: 'New Node 1',
          parent: 'saas' as any,
        },
        'new.node2': {
          title: 'New Node 2',
          parent: null,
        },
      },
    })

    const diff = nodesDiff(manual, latest)

    expect(diff.removed).toHaveLength(0)
    expect(diff.updated).toHaveLength(manual.nodes.length)
    expect(diff.added).toEqual([
      latestNodes['new.node1'],
      latestNodes['new.node2'],
    ])
  })

  it('should detect updated nodes', ({ expect }) => {
    const { manual, latest } = testData({})

    const diff = nodesDiff(manual, latest)

    expect(diff.removed).toHaveLength(0)
    expect(diff.added).toHaveLength(0)
    expect(diff.updated).toHaveLength(manual.nodes.length)
  })

  describe('applyNodeChanges behavior in updated nodes', () => {
    it('should preserve position from current node', ({ expect }) => {
      const { manual, manualNodes, latest } = testData({
        nodes: {
          'saas.backend.api': {
            title: 'Updated API',
            x: 999,
            y: 888,
          },
        },
      })

      const diff = nodesDiff(manual, latest)

      const updatedApi = diff.updated.find(n => n.id === 'saas.backend.api')
      expect(updatedApi).toBeDefined()
      if (updatedApi) {
        // Position should be from manual (current)
        expect(updatedApi.x).toBe(manualNodes['saas.backend.api'].x)
        expect(updatedApi.y).toBe(manualNodes['saas.backend.api'].y)
        // Title should be from updated
        expect(updatedApi.title).toBe('Updated API')
      }
    })

    it('should preserve size from current node for nodes with children', ({ expect }) => {
      const { manual, manualNodes, latest, latestNodes } = testData({
        nodes: {
          'saas.backend': {
            title: 'Updated Backend',
            width: 999,
            height: 888,
          },
        },
      })
      // Ensure that latest has different size than manual
      expect(latestNodes['saas.backend'].width).not.toBe(manualNodes['saas.backend'].width)
      expect(latestNodes['saas.backend'].height).not.toBe(manualNodes['saas.backend'].height)

      const diff = nodesDiff(manual, latest)

      const updatedBackend = diff.updated.find(n => n.id === 'saas.backend')
      // Size should be from manual (current) since it has children
      expect(updatedBackend).toMatchObject({
        width: manualNodes['saas.backend'].width,
        height: manualNodes['saas.backend'].height,
      })
    })

    it('should use updated size for leaf nodes (no children)', ({ expect }) => {
      const { manual, manualNodes, latest, latestNodes } = testData({
        nodes: {
          'customer': {
            title: 'Updated Customer',
            width: 999,
            height: 888,
          },
        },
      })
      // Ensure that latest has different size than manual
      expect(latestNodes['customer'].width).not.toBe(manualNodes['customer'].width)
      expect(latestNodes['customer'].height).not.toBe(manualNodes['customer'].height)
      expect(latestNodes['customer'].children).toHaveLength(0)

      const diff = nodesDiff(manual, latest)

      const updatedCustomer = diff.updated.find(n => n.id === 'customer')
      expect(updatedCustomer).toMatchObject({
        width: 999,
        height: 888,
        children: [],
      })
    })

    it('should remove drifts from updated nodes', ({ expect }) => {
      const { manual, latest } = testData({
        nodes: {
          'saas.backend.api': d => {
            d.drifts = [
              'added',
              'removed',
            ]
          },
        },
      })

      const diff = nodesDiff(manual, latest)

      const updatedApi = diff.updated.find(n => n.id === 'saas.backend.api')
      expect(updatedApi).toBeDefined()
      expect(updatedApi!.drifts).toBeNull()
    })

    it('should reset relational data (parent, children, edges)', ({ expect }) => {
      const { manual, latest } = testData({
        nodes: {
          'saas.backend': {
            title: 'Updated Backend',
          },
        },
      })

      const diff = nodesDiff(manual, latest)

      const updatedBackend = diff.updated.find(n => n.id === 'saas.backend')
      expect(updatedBackend).toBeDefined()
      if (updatedBackend) {
        // Relational data should be reset
        expect(updatedBackend.parent).toBeNull()
        expect(updatedBackend.children).toEqual([])
        expect(updatedBackend.inEdges).toEqual([])
        expect(updatedBackend.outEdges).toEqual([])
      }
    })

    it('should apply all updated properties except position and size', ({ expect }) => {
      const { manual, manualNodes, latest } = testData({
        nodes: {
          'saas.backend.api': {
            title: 'New API Title',
            description: 'New description' as any,
            color: 'secondary' as any,
            shape: 'cylinder' as any,
            icon: 'tech:python' as any,
            tags: ['new-tag'],
          },
        },
      })

      const diff = nodesDiff(manual, latest)

      const updatedApi = diff.updated.find(n => n.id === 'saas.backend.api')
      expect(updatedApi).toBeDefined()
      if (updatedApi) {
        expect(updatedApi.title).toBe('New API Title')
        expect(updatedApi.description).toBe('New description')
        expect(updatedApi.color).toBe('secondary')
        expect(updatedApi.shape).toBe('cylinder')
        expect(updatedApi.icon).toBe('tech:python')
        expect(updatedApi.tags).toEqual(['new-tag'])
        // Position should be from manual
        expect(updatedApi.x).toBe(manualNodes['saas.backend.api'].x)
        expect(updatedApi.y).toBe(manualNodes['saas.backend.api'].y)
      }
    })

    it('should handle mixed updates correctly', ({ expect }) => {
      const { manual, manualNodes, latest } = testData({
        nodes: {
          // Leaf node - should use updated size
          'customer': {
            width: 500,
            height: 400,
            color: 'green',
          },
          // Parent node - should use current size
          'saas': {
            width: 1000,
            height: 800,
            title: 'Updated SaaS',
          },
        },
      })

      const diff = nodesDiff(manual, latest)

      const updatedCustomer = diff.updated.find(n => n.id === 'customer')
      expect(updatedCustomer).toBeDefined()
      if (updatedCustomer) {
        expect(updatedCustomer.width).toBe(500)
        expect(updatedCustomer.height).toBe(400)
        expect(updatedCustomer.color).toBe('green')
      }

      const updatedSaas = diff.updated.find(n => n.id === 'saas')
      expect(updatedSaas).toBeDefined()
      if (updatedSaas) {
        expect(updatedSaas.width).toBe(manualNodes['saas'].width)
        expect(updatedSaas.height).toBe(manualNodes['saas'].height)
        expect(updatedSaas.title).toBe('Updated SaaS')
      }
    })
  })
})

describe('applyChangesToManualLayout', () => {
  it('should remove leaf nodes', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'saas.backend.auth': null,
        'external.database': null,
        'customer': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 3)
    expect(resultNodes).not.haveOwnProperty('saas.backend.auth')
    expect(resultNodes).not.haveOwnProperty('external.database')
    expect(resultNodes).not.haveOwnProperty('customer')

    expect(resultNodes['saas.backend'].children).toEqual([
      'saas.backend.api',
      'saas.backend.worker',
    ])

    expect(resultNodes['external'].children).toEqual([
      'external.email',
    ])
  })

  it('should remove nodes and reattach their children', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'saas.backend.worker': null,
        'saas.backend': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 2)
    expect(resultNodes).not.haveOwnProperty('saas.backend')
    expect(resultNodes).not.haveOwnProperty('saas.backend.worker')
    // children from removed node should be to upper level
    expect(resultNodes['saas'].children).toEqual([
      'saas.frontend',
      'saas.backend.api',
      'saas.backend.auth',
    ])
  })

  it('if root node is removed, its children should become orphans', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'external': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 1)
    expect(resultNodes).not.haveOwnProperty('external')
    expect(resultNodes['external.email'].parent).toBeNull()
    expect(resultNodes['external.database'].parent).toBeNull()
  })

  it('should preserve node hierarchy and recalculate parent sizes', ({ expect }) => {
    const { resultNodes, manualNodes } = testData({
      nodes: {
        'saas.backend.api': {
          title: 'Updated API',
          color: 'secondary' as any,
        },
      },
    })

    // Should preserve hierarchy
    expect(resultNodes['saas.backend'].children).toContain('saas.backend.api')
    expect(resultNodes['saas.backend.api'].parent).toBe('saas.backend')
    expect(resultNodes['saas'].children).toContain('saas.backend')
    expect(resultNodes['saas.backend'].parent).toBe('saas')
    // Title should be updated
    expect(resultNodes['saas.backend.api'].title).toBe('Updated API')

    // Position should be preserved for leaf nodes
    expect(resultNodes['saas.backend.api'].x).toBe(manualNodes['saas.backend.api'].x)
    expect(resultNodes['saas.backend.api'].y).toBe(manualNodes['saas.backend.api'].y)

    // Compound nodes should be expanded to wrap children
    const saasBackend = resultNodes['saas.backend']
    const saas = resultNodes['saas']
    expect(saasBackend?.width).toBeGreaterThan(0)
    expect(saasBackend?.height).toBeGreaterThan(0)
    expect(saas?.width).toBeGreaterThan(0)
    expect(saas?.height).toBeGreaterThan(0)
  })

  it('should handle added nodes and rebuild hierarchy', ({ expect }) => {
    const { result, resultNodes, manualNodes } = testData({
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
    expect(newService?.parent).toBe('saas')
    expect(saas?.children).toEqual([
      ...manualNodes.saas.children,
      'saas.newservice',
    ])
    // Parent should be expanded to include new child
    if (saas && newService) {
      expect(saas.x).toBeLessThanOrEqual(newService.x)
      expect(saas.y).toBeLessThanOrEqual(newService.y)
      expect(saas.x + saas.width).toBeGreaterThanOrEqual(newService.x + newService.width)
      expect(saas.y + saas.height).toBeGreaterThanOrEqual(newService.y + newService.height)
    }
  })

  it('should properly set level and depth for all nodes', ({ expect }) => {
    const { result, resultNodes } = testData({
      nodes: {
        'saas.backend': null,
        'saas.frontend.spa.dashboard': {
          title: 'Dashboard',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
      },
    })

    // Root nodes should have level 0
    expect(resultNodes['customer']?.level).toBe(0)
    expect(resultNodes['saas']?.level).toBe(0)
    expect(resultNodes['external']?.level).toBe(0)

    // First level children (including backend children moved up from removed saas.backend)
    expect(resultNodes['saas.frontend']?.level).toBe(1)
    expect(resultNodes['saas.backend.api']?.level).toBe(1)
    expect(resultNodes['saas.backend.auth']?.level).toBe(1)
    expect(resultNodes['saas.backend.worker']?.level).toBe(1)

    // Second level children
    expect(resultNodes['saas.frontend.spa']?.level).toBe(2)
    expect(resultNodes['saas.frontend.pwa']?.level).toBe(2)

    // Third level children
    expect(resultNodes['saas.frontend.spa.dashboard']?.level).toBe(3)

    // Verify saas.backend children are now direct children of saas
    expect(resultNodes['saas'].children).toContain('saas.backend.api')
    expect(resultNodes['saas'].children).toContain('saas.backend.auth')
    expect(resultNodes['saas'].children).toContain('saas.backend.worker')
    expect(resultNodes['saas.backend.api']?.parent).toBe('saas')
    expect(resultNodes['saas.backend.auth']?.parent).toBe('saas')
    expect(resultNodes['saas.backend.worker']?.parent).toBe('saas')

    // Depth should be set for compound nodes
    // saas contains frontend (which contains spa (which contains dashboard))
    expect(resultNodes['saas']?.depth).toBe(3)
    // saas.frontend contains spa (which contains dashboard)
    expect(resultNodes['saas.frontend']?.depth).toBe(2)
    // saas.frontend.spa contains dashboard
    expect(resultNodes['saas.frontend.spa']?.depth).toBe(1)

    // Leaf nodes should have depth 0
    expect(resultNodes['customer']?.depth).toBe(0)
    expect(resultNodes['saas.frontend.pwa']?.depth).toBe(0)
    expect(resultNodes['saas.frontend.spa.dashboard']?.depth).toBe(0)
    expect(resultNodes['saas.backend.api']?.depth).toBe(0)
    expect(resultNodes['saas.backend.auth']?.depth).toBe(0)
    expect(resultNodes['saas.backend.worker']?.depth).toBe(0)
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
    expect(api?.title).toBe('API Gateway')
    expect(api?.icon).toBe('tech:aws')
    expect(api?.tags).toEqual(['api', 'gateway'])
    // Position preserved
    expect(api?.x).toBe(manualNodes['saas.backend.api'].x)
    expect(api?.y).toBe(manualNodes['saas.backend.api'].y)
  })

  it('should handle deep nesting correctly', ({ expect }) => {
    const { resultNodes } = testData({
      nodes: {
        'saas.backend.api.v1': {
          title: 'API v1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
        },
      },
    })

    const v1 = resultNodes['saas.backend.api.v1']
    const api = resultNodes['saas.backend.api']
    const backend = resultNodes['saas.backend']
    const saas = resultNodes['saas']

    // Check hierarchy
    expect(v1).toBeDefined()
    expect(v1.parent).toBe('saas.backend.api')
    expect(api.children).toEqual(['saas.backend.api.v1'])

    // Check levels
    expect(v1.level).toBe(3)
    expect(api.level).toBe(2)
    expect(backend.level).toBe(1)

    // Check depth updates
    expect(api.depth).toBe(1)
    expect(backend.depth).toBeGreaterThan(1)
    expect(saas.depth).toBeGreaterThan(2)
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

  it('should remove leaf nodes', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'saas.backend.auth': null,
        'external.database': null,
        'customer': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 3)
    expect(resultNodes).not.haveOwnProperty('saas.backend.auth')
    expect(resultNodes).not.haveOwnProperty('external.database')
    expect(resultNodes).not.haveOwnProperty('customer')

    expect(resultNodes['saas.backend'].children).toEqual([
      'saas.backend.api',
      'saas.backend.worker',
    ])

    expect(resultNodes['external'].children).toEqual([
      'external.email',
    ])
  })

  it('should remove nodes and reattach their children', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'saas.backend.worker': null,
        'saas.backend': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 2)
    expect(resultNodes).not.haveOwnProperty('saas.backend')
    expect(resultNodes).not.haveOwnProperty('saas.backend.worker')
    // children from removed node should be to upper level
    expect(resultNodes['saas'].children).toEqual([
      'saas.frontend',
      'saas.backend.api',
      'saas.backend.auth',
    ])
  })

  it('if root node is removed, its children should become orphans', ({ expect }) => {
    const { result, resultNodes, manual } = testData({
      nodes: {
        'external': null,
      },
    })

    expect(result.nodes.length).toBe(manual.nodes.length - 1)
    expect(resultNodes).not.haveOwnProperty('external')
    expect(resultNodes['external.email'].parent).toBeNull()
    expect(resultNodes['external.database'].parent).toBeNull()
  })
})
