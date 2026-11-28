import type { DiagramEdge, DiagramNode, LayoutedElementView } from '@likec4/core'
import type { InternalNode } from '@xyflow/react'
import type { XYStoreApi } from '../../hooks'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { diagramToXY } from '../xyflow-diagram/diagram-view'
import { createViewChange } from './createViewChange'

const source = {
  id: scalar.NodeId('source'),
  parent: null,
  children: [],
  inEdges: [],
  outEdges: [scalar.EdgeId('source-target')],
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  labelBBox: { x: 0, y: 0, width: 100, height: 24 },
  kind: 'component',
  modelRef: scalar.Fqn('source'),
  title: 'Source',
  description: null,
  technology: null,
  color: 'primary',
  shape: 'rectangle',
  style: {},
  level: 0,
  tags: [],
} satisfies DiagramNode

const target = {
  ...source,
  id: scalar.NodeId('target'),
  modelRef: scalar.Fqn('target'),
  title: 'Target',
  x: 400,
  inEdges: [scalar.EdgeId('source-target')],
  outEdges: [],
} satisfies DiagramNode

const relationship = {
  id: scalar.EdgeId('source-target'),
  parent: null,
  source: source.id,
  target: target.id,
  label: null,
  technology: null,
  relations: [],
  color: 'primary',
  line: 'solid',
  points: [
    [50, 50],
    [183, 50],
    [317, 50],
    [450, 50],
  ],
} satisfies DiagramEdge

const view = {
  _type: 'element',
  _stage: 'layouted',
  _layout: 'auto',
  id: scalar.ViewId('index'),
  title: 'Index',
  description: null,
  tags: null,
  links: null,
  hash: 'view-hash',
  autoLayout: { direction: 'LR' },
  nodes: [source, target],
  edges: [relationship],
  bounds: { x: 0, y: 0, width: 500, height: 100 },
} satisfies LayoutedElementView

/** The layout the editor saves for the view, with some nodes moved to the given positions. */
function save(view: LayoutedElementView, moved: Record<string, { x: number; y: number }> = {}) {
  const { xynodes, xyedges } = diagramToXY({ view, currentViewId: undefined, where: null })
  const nodeLookup = new Map(xynodes.map(node => [
    node.id,
    {
      ...node,
      measured: { width: node.initialWidth, height: node.initialHeight },
      internals: { positionAbsolute: moved[node.id] ?? node.position },
    } as InternalNode<typeof node>,
  ]))
  const xystore = {
    getState: () => ({ nodeLookup, edgeLookup: new Map(xyedges.map(edge => [edge.id, edge])) }),
  } as unknown as XYStoreApi
  return createViewChange({ view, xynodes, xyedges, xystore }).layout
}

describe('createViewChange', () => {
  it('does not persist generated routing as authored control points after a node moves', () => {
    const layout = save(view, { [source.id]: { x: 100, y: 0 } })

    expect(layout.edges[0]?.controlPoints).toBeNull()
  })

  describe('edge ends', () => {
    it('records that ends follow the corners when saved with orthogonal routing', () => {
      expect(save({ ...view, routing: 'ortho' }).edgeEnds).toBe('corner')
    })

    it('keeps the record when a recorded layout is saved with spline routing', () => {
      expect(save({ ...view, routing: 'spline', edgeEnds: 'corner' }).edgeEnds).toBe('corner')
    })

    it('adds no record when a layout without it is saved with spline routing', () => {
      expect(save({ ...view, routing: 'spline' })).not.toHaveProperty('edgeEnds')
    })
  })
})
