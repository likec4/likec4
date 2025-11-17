import { indexBy } from 'remeda'
import { describe, expect, it } from 'vitest'
import { type DiagramEdge, _layout } from '../types'
import { type NodeIds, type Patches, generateView } from './__test__/fixture'
import { calcDriftsFromSnapshot } from './calcDriftsFromSnapshot'

function testCalcDrifts(patches?: Patches) {
  const { snapshot, layouted } = generateView(patches)

  const result = calcDriftsFromSnapshot(layouted, snapshot)

  const nodes = indexBy(result.nodes, n => n.id as NodeIds)
  const resultEdges = indexBy(result.edges, e => e.id)

  return {
    result,
    nodes,
    edges: resultEdges,
    snapshot,
    layouted,
  }
}

describe('calcDriftsFromSnapshot', () => {
  it('should return auto layout without drifts when nothing changed', () => {
    const { result } = testCalcDrifts()

    expect(result[_layout]).toBe('auto')
    expect(result.drifts).toBeUndefined()
  })

  it('should detect nodes-added drift', () => {
    const { result, nodes } = testCalcDrifts({
      nodes: {
        'newnode': {
          title: 'New Node',
          x: 100,
          y: 100,
        },
      },
    })

    expect(result[_layout]).toBe('auto')
    expect(result.drifts).toEqual(['nodes-added'])
    expect(nodes['newnode']?.drifts).toEqual(['missing'])
  })

  it('should detect nodes-removed drift', () => {
    const { result } = testCalcDrifts({
      nodes: {
        'customer': null,
      },
    })

    expect(result.drifts).toContain('nodes-removed')
  })

  it('should propagate node drifts to view', () => {
    const { result, nodes } = testCalcDrifts({
      nodes: {
        'customer': d => {
          d.shape = 'cylinder'
          d.width += 20
          d.height += 20
        },
      },
    })

    expect(nodes.customer.drifts).toEqual(['shape-changed'])
    expect(result.drifts).toEqual(['nodes-drift'])
  })

  it('should detect edges-added drift', () => {
    const { layouted, snapshot } = generateView()
    layouted.edges.push({
      id: 'new-edge',
      source: 'customer',
      target: 'saas.api',
    } as DiagramEdge)

    const result = calcDriftsFromSnapshot(layouted, snapshot)

    expect(result.drifts).toEqual(['edges-added'])
    const newEdge = result.edges.find(e => e.id === 'new-edge')
    expect(newEdge?.drifts).toEqual(['missing'])
  })

  it('should detect edges-removed drift', () => {
    const { layouted, snapshot } = generateView()
    // Remove an edge from the layouted view
    layouted.edges.splice(0, 1)

    const result = calcDriftsFromSnapshot(layouted, snapshot)

    expect(result.drifts).toEqual(['edges-removed'])
  })

  it('should match edges by source and target if id changed', () => {
    const { snapshot, layouted } = generateView()

    // Change edge ID but keep source/target the same
    const modifiedLayouted = {
      ...layouted,
      edges: layouted.edges.map(e => ({
        ...e,
        id: e.id + '-modified',
      })),
    } as typeof layouted

    const result = calcDriftsFromSnapshot(modifiedLayouted, snapshot)

    // Should not detect edges-added/removed since source/target match
    expect(result.drifts).toBeUndefined()
  })

  it('should combine multiple drift types', () => {
    const { result, nodes } = testCalcDrifts({
      nodes: {
        'customer': d => {
          d.title = 'Customer Updated with a very long title that increases size significantly'
          d.width = 500
          d.height = 300
        },
        'newnode': {
          title: 'New Node',
          x: 100,
          y: 100,
        },
        'saas.frontend': null,
      },
    })

    expect(result.drifts).toContain('nodes-added')
    expect(result.drifts).toContain('nodes-removed')
    expect(result.drifts).toContain('nodes-drift')
    expect(nodes.customer.drifts).toEqual(['label-changed'])
    expect(nodes['newnode']?.drifts).toEqual(['missing'])
  })

  it('should not have drifts when changes are auto-applied', () => {
    const { result, nodes } = testCalcDrifts({
      nodes: {
        'customer': {
          color: 'secondary',
          kind: 'system',
          tags: ['tag-3'],
        },
      },
    })

    expect(result.drifts).toBeUndefined()
    expect(nodes.customer.drifts).toBeUndefined()
    expect(nodes.customer.color).toBe('secondary')
    expect(nodes.customer.kind).toBe('system')
  })

  it('should handle type-changed drift', () => {
    const { snapshot, layouted } = generateView({
      view: {
        // Change view type from 'element' to 'deployment'
        _type: 'deployment' as any,
      },
    })

    const result = calcDriftsFromSnapshot(layouted, snapshot)

    expect(result.drifts).toContain('type-changed')
  })
})
