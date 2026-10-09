import type { DiagramNode, LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { applyNodeChanges } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { assertEvent, createActor } from 'xstate'
import type { XYStoreApi } from '../../hooks/useXYFlow'
import { diagramToXY } from '../xyflow-diagram/diagram-view'
import {
  assignXYDataFromView,
  selectedNodesWithoutAncestors,
  sortBySelectionOrder,
  updateNodeSelectionOrder,
} from './machine.actions'
import { Context, machine } from './machine.setup'

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

  it('removes deleted nodes so restoring and selecting them uses the current selection order', () => {
    const order = ['a', 'b']
    const afterRemoval = updateNodeSelectionOrder(order, [{ type: 'remove', id: 'a' }])
    expect(afterRemoval).toEqual(['b'])
    expect(updateNodeSelectionOrder(afterRemoval, [{ type: 'select', id: 'a', selected: true }])).toEqual(['b', 'a'])
    expect(order).toEqual(['a', 'b'])
  })

  it('ignores changes other than select and remove', () => {
    const order = ['a']
    expect(updateNodeSelectionOrder(order, [{ type: 'position', id: 'a', position: { x: 10, y: 20 } }])).toBe(order)
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

describe('assignXYDataFromView', () => {
  const nodes = ['a', 'b'].map((id): DiagramNode => ({
    id: scalar.NodeId(id),
    modelRef: scalar.Fqn(id),
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    labelBBox: { x: 0, y: 0, width: 100, height: 24 },
    kind: 'component',
    title: id,
    description: null,
    technology: null,
    color: 'primary',
    shape: 'rectangle',
    style: {},
    level: 0,
    tags: [],
  }))
  const view = {
    _type: 'element',
    _stage: 'layouted',
    id: scalar.ViewId('selection-order'),
    title: 'Selection order',
    description: null,
    tags: null,
    links: null,
    hash: 'selection-order',
    autoLayout: { direction: 'TB' },
    nodes,
    edges: [],
    bounds: { x: 0, y: 0, width: 100, height: 100 },
  } satisfies LayoutedElementView
  const converted = diagramToXY({ view, currentViewId: view.id, where: null })
  const xydata = {
    ...converted,
    xynodes: converted.xynodes.map(node => ({ ...node, selected: true })),
  }

  it.each([false, true])('prunes removed IDs on view replacement (focused node: %s)', (hasFocusedNode) => {
    const input = {
      view,
      xystore: mockStore([]),
      zoomable: false,
      pannable: false,
      nodesDraggable: false,
      nodesSelectable: true,
      fitViewPadding: {},
      where: null,
    }
    const actor = createActor(
      machine.createMachine({
        context: {
          ...Context({ input }),
          ...xydata,
          nodeSelectionOrder: ['a', 'b'],
          focusedNode: hasFocusedNode ? scalar.NodeId('b') : null,
        },
        on: {
          'update.view': { actions: assignXYDataFromView() },
          'xyflow.applyChanges': {
            actions: machine.assign(({ context, event }) => {
              assertEvent(event, 'xyflow.applyChanges')
              return {
                xynodes: applyNodeChanges(event.nodes ?? [], context.xynodes),
                nodeSelectionOrder: updateNodeSelectionOrder(context.nodeSelectionOrder, event.nodes ?? []),
              }
            }),
          },
        },
      }),
      { input },
    )
    actor.start()
    try {
      actor.send({
        type: 'update.view',
        source: 'editor',
        view: { ...view, nodes: nodes.filter(n => n.id !== 'a') },
        xynodes: xydata.xynodes.filter(n => n.id !== 'a'),
        xyedges: [],
      })
      expect(actor.getSnapshot().context.nodeSelectionOrder).toEqual(['b'])
      expect(actor.getSnapshot().context.focusedNode).toEqual(hasFocusedNode ? 'b' : null)

      actor.send({ type: 'update.view', source: 'editor', view, ...xydata })
      expect(actor.getSnapshot().context.nodeSelectionOrder).toEqual(['b'])

      actor.send({ type: 'xyflow.applyChanges', nodes: [{ type: 'select', id: 'a', selected: true }] })
      expect(actor.getSnapshot().context.nodeSelectionOrder).toEqual(['b', 'a'])
      expect(sortBySelectionOrder(['a', 'b'], actor.getSnapshot().context.nodeSelectionOrder)).toEqual(['b', 'a'])

      actor.send({
        type: 'update.view',
        source: 'editor',
        view,
        xynodes: xydata.xynodes.map(node => ({ ...node, selected: node.id !== 'b' })),
        xyedges: [],
      })
      expect(actor.getSnapshot().context.nodeSelectionOrder).toEqual(['a'])
      expect(actor.getSnapshot().context.xynodes.find(node => node.id === 'b')?.selected).toBe(false)
    } finally {
      actor.stop()
    }
  })
})

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
