import type { DiagramEdge, DiagramNode, LayoutedElementView } from '@likec4/core'
import { scalar } from '@likec4/core/types'
import type { InternalNode } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import type { XYStoreApi } from '../../hooks'
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

describe('createViewChange', () => {
  it('does not persist generated routing as authored control points after a node moves', () => {
    const { xynodes, xyedges } = diagramToXY({
      view,
      currentViewId: undefined,
      where: null,
    })
    const nodeLookup = new Map(xynodes.map(node => {
      const positionAbsolute = node.id === source.id ? { x: 100, y: 0 } : node.position
      return [
        node.id,
        {
          ...node,
          measured: { width: node.initialWidth, height: node.initialHeight },
          internals: { positionAbsolute },
        } as InternalNode<typeof node>,
      ]
    }))
    const xystore = {
      getState: () => ({
        nodeLookup,
        edgeLookup: new Map(xyedges.map(edge => [edge.id, edge])),
      }),
    } as unknown as XYStoreApi

    const change = createViewChange({ view, xynodes, xyedges, xystore })

    expect(change.layout.edges[0]?.controlPoints).toBeNull()
  })
})
