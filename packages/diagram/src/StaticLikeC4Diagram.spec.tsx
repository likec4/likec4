import type { DiagramNode, LayoutedDynamicView } from '@likec4/core'
import { scalar } from '@likec4/core/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StaticLikeC4Diagram } from './StaticLikeC4Diagram'

const actor = {
  id: scalar.NodeId('actor'),
  parent: null,
  children: [],
  inEdges: [],
  outEdges: [],
  x: 0,
  y: 0,
  width: 320,
  height: 180,
  labelBBox: { x: 0, y: 0, width: 100, height: 24 },
  kind: 'component',
  modelRef: scalar.Fqn('actor'),
  title: 'Actor',
  description: null,
  technology: null,
  color: 'primary',
  shape: 'rectangle',
  style: {},
  level: 0,
  tags: [],
} satisfies DiagramNode

const sequenceView = {
  _type: 'dynamic',
  _stage: 'layouted',
  id: scalar.ViewId('sequence'),
  title: 'Sequence',
  description: null,
  tags: null,
  links: null,
  hash: 'hash',
  autoLayout: { direction: 'TB' },
  nodes: [actor],
  edges: [],
  bounds: { x: 0, y: 0, width: 320, height: 180 },
  variant: 'sequence',
  sequenceLayout: {
    actors: [{ id: actor.id, x: 40, y: 40, width: 320, height: 180, ports: [] }],
    compounds: [],
    parallelAreas: [],
    subflows: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 400, height: 900 },
  },
} satisfies LayoutedDynamicView

describe('StaticLikeC4Diagram', () => {
  it('renders the initial nodes of a sequence view with the sequence layout', () => {
    const html = renderToStaticMarkup(
      <StaticLikeC4Diagram view={sequenceView} fitView initialWidth={400} initialHeight={900} />,
    )
    expect(html).toContain('react-flow__node-seq-actor')
    expect(html).not.toContain('react-flow__node-element')
  })
})
