import type * as t from '@likec4/core/types'
import { indexBy, prop } from 'remeda'
import { describe, it } from 'vitest'
import { type Patches, prepareFixtures } from './__tests__/fixture'
import { applyChangesToManualLayout, nodesDiff } from './applyChangesToManualLayout'

const nodeIds = (view: t.LayoutedView) => view.nodes.map(prop('id'))
const nodesById = (view: t.LayoutedView) => new Map(view.nodes.map(n => [n.id, n]))

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
  const resultNodes = indexBy(result.nodes, n => n.id) as typeof snapshotNodes
  const resultEdges = indexBy(result.edges, e => e.id) as typeof snapshotEdges

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
  it('should remove leaf nodes', ({ expect }) => {
    const { result, resultNodes, manual, latest } = testData({
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
