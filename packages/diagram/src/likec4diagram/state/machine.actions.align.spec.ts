import { describe, expect, it } from 'vitest'
import type { XYStoreApi } from '../../hooks/useXYFlow'
import { selectedNodesWithoutAncestors, sortBySelectionOrder, updateNodeSelectionOrder } from './machine.actions'

describe('updateNodeSelectionOrder', () => {
  it('appends newly selected nodes and removes deselected ones', () => {
    let order = updateNodeSelectionOrder([], [
      { type: 'select', id: 'b', selected: true },
      { type: 'select', id: 'a', selected: true },
    ])
    expect(order).toEqual(['b', 'a'])
    order = updateNodeSelectionOrder(order, [
      { type: 'select', id: 'c', selected: true },
      { type: 'select', id: 'b', selected: false },
      { type: 'select', id: 'a', selected: true },
    ])
    expect(order).toEqual(['a', 'c'])
  })

  it('ignores non-select changes', () => {
    const order = ['a']
    expect(updateNodeSelectionOrder(order, [{ type: 'remove', id: 'a' }])).toBe(order)
  })
})

describe('sortBySelectionOrder', () => {
  it('sorts by selection order, unknown ids last', () => {
    expect(sortBySelectionOrder(['a', 'b', 'c', 'd'], ['c', 'a'])).toEqual(['c', 'a', 'b', 'd'])
  })
})

function mockStore(nodes: Array<{ id: string; parentId?: string; selected?: boolean }>): XYStoreApi {
  const nodeLookup = new Map(nodes.map(n => [n.id, n]))
  // oxlint-disable-next-line no-unsafe-type-assertion
  return { getState: () => ({ nodeLookup }) } as unknown as XYStoreApi
}

describe('selectedNodesWithoutAncestors', () => {
  const tree = [
    { id: 'root' },
    { id: 'area1', parentId: 'root' },
    { id: 'area2', parentId: 'root' },
    { id: 'sys1', parentId: 'area1' },
    { id: 'sys2', parentId: 'area2' },
  ]

  it('keeps selected compound nodes', () => {
    const store = mockStore(tree.map(n => ({ ...n, selected: n.id.startsWith('area') })))
    expect(selectedNodesWithoutAncestors(store)).toEqual(['area1', 'area2'])
  })

  it('keeps selected leaf nodes', () => {
    const store = mockStore(tree.map(n => ({ ...n, selected: n.id.startsWith('sys') })))
    expect(selectedNodesWithoutAncestors(store)).toEqual(['sys1', 'sys2'])
  })

  it('excludes selected nodes that are ancestors of other selected nodes', () => {
    const store = mockStore(tree.map(n => ({ ...n, selected: ['root', 'area1', 'sys2'].includes(n.id) })))
    expect(selectedNodesWithoutAncestors(store)).toEqual(['area1', 'sys2'])
  })
})
