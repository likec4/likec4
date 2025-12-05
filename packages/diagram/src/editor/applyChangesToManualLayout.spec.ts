import type * as t from '@likec4/core/types'
import { indexBy, prop } from 'remeda'
import { describe, it } from 'vitest'
import { type Patches, prepareFixtures } from './__tests__/fixture'
import { applyChangesToManualLayout, calculateDiff } from './applyChangesToManualLayout'

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

describe('calculateDiff', () => {
  it('detects removed nodes', ({ expect }) => {
    const { snapshot, layouted, snapshotNodes } = prepareFixtures({
      nodes: {
        'saas.backend.auth': null,
        'customer': null,
      },
    })

    const diff = calculateDiff(snapshot, layouted)

    expect(diff.removed).toHaveLength(2)
    expect(diff.removed).toEqual(expect.arrayContaining([
      snapshotNodes['saas.backend.auth'],
      snapshotNodes['customer'],
    ]))
    expect(diff.added).toHaveLength(0)
    expect(diff.updated.map(([node]) => node.id)).not.toContain('saas.backend.auth')
  })

  it('detects added nodes', ({ expect }) => {
    const { snapshot, layouted, layoutedNodes } = prepareFixtures({
      nodes: {
        'partner.portal': {
          title: 'Partner Portal',
        },
      },
    })

    const diff = calculateDiff(snapshot, layouted)

    expect(diff.added).toEqual([layoutedNodes['partner.portal']])
    expect(diff.removed).toHaveLength(0)
    expect(diff.updated).toHaveLength(snapshot.nodes.length)
  })

  it('pairs existing and latest versions when nodes are updated', ({ expect }) => {
    const { snapshot, layouted, snapshotNodes, layoutedNodes } = prepareFixtures({
      nodes: {
        'saas.backend.api': {
          x: 1234,
          title: 'API v2',
        },
      },
    })

    const diff = calculateDiff(snapshot, layouted)

    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)

    const apiDiff = diff.updated.find(([node]) => node.id === 'saas.backend.api')
    expect(apiDiff).toBeDefined()

    const [manualApi, latestApi] = apiDiff!
    expect(manualApi).toBe(snapshotNodes['saas.backend.api'])
    expect(latestApi).toBe(layoutedNodes['saas.backend.api'])
    expect(manualApi.title).toBe('API')
    expect(latestApi.title).toBe('API v2')
    expect(manualApi.x).not.toBe(latestApi.x)
  })
})
