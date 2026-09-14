import { type DiagramEdge, type DiagramNode, type DiagramView, scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { graphViewToXY } from './graph-view-to-xy'

type TestView = Pick<DiagramView, 'id' | 'nodes' | 'edges'>

function testNode(id: string, overrides: Partial<DiagramNode> = {}): DiagramNode {
  return {
    id: scalar.NodeId(id),
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    labelBBox: { x: 0, y: 0, width: 100, height: 24 },
    kind: 'component',
    modelRef: scalar.Fqn(id),
    title: id,
    description: null,
    technology: null,
    color: 'primary',
    shape: 'rectangle',
    style: {},
    level: 0,
    tags: [],
    ...overrides,
  }
}

function testEdge(
  id: string,
  source: DiagramNode,
  target: DiagramNode,
  overrides: Partial<DiagramEdge> = {},
): DiagramEdge {
  return {
    id: scalar.EdgeId(id),
    parent: null,
    source: source.id,
    target: target.id,
    label: null,
    technology: null,
    relations: [],
    color: 'primary',
    line: 'solid',
    points: [
      [0, 0],
      [100, 100],
    ],
    ...overrides,
  }
}

function testView(nodes: DiagramNode[], edges: DiagramEdge[]): TestView {
  return {
    id: scalar.ViewId('index'),
    nodes,
    edges,
  }
}

describe('graphViewToXY', () => {
  describe('flattening compounds', () => {
    it('renders only leaf nodes, excluding compounds', () => {
      const child = testNode('child', { parent: scalar.NodeId('parent') })
      const compound = testNode('parent', { children: [child.id] })

      const { xynodes } = graphViewToXY({
        view: testView([compound, child], []),
        where: null,
      })

      expect(xynodes.map(n => n.id)).toEqual(['child'])
    })

    it('drops edges that touch a compound node', () => {
      const child = testNode('child', { parent: scalar.NodeId('parent') })
      const compound = testNode('parent', { children: [child.id] })
      const leaf = testNode('leaf')

      const edgeFromCompound = testEdge('parent-leaf', compound, leaf)
      const edgeBetweenLeaves = testEdge('child-leaf', child, leaf)

      const { xyedges } = graphViewToXY({
        view: testView([compound, child, leaf], [edgeFromCompound, edgeBetweenLeaves]),
        where: null,
      })

      expect(xyedges.map(e => e.id)).toEqual(['child-leaf'])
    })
  })

  describe('node shape', () => {
    it('renders a fixed-size circle centered on the node\'s layouted center', () => {
      const node = testNode('web', { x: 100, y: 200, width: 300, height: 200 })

      const { xynodes } = graphViewToXY({
        view: testView([node], []),
        where: null,
      })

      const xynode = xynodes[0]!
      expect(xynode.type).toBe('graph-element')
      expect(xynode.deletable).toBe(false)
      expect(xynode.style).toEqual({ width: 20, height: 20 })
      // center = (100 + 300/2, 200 + 200/2) = (250, 300); position = center - radius(10)
      expect(xynode.position).toEqual({ x: 240, y: 290 })
    })
  })

  describe('edge geometry', () => {
    it('keeps controlPoints as an empty array (not null) so the edge tracks live node positions', () => {
      const source = testNode('source')
      const target = testNode('target')
      const edge = testEdge('source-target', source, target)

      const { xyedges } = graphViewToXY({
        view: testView([source, target], [edge]),
        where: null,
      })

      // Must stay `[]`, not `null`/`undefined`: RelationshipEdge only recomputes its path from
      // live node positions when `controlPoints` is truthy - see useRelationshipEdgePath.ts.
      // Regressing this back to `null` makes edges stop following nodes in graph mode.
      expect(xyedges[0]!.data.controlPoints).toEqual([])
    })

    it('produces a 4-point bezier spline for a valid, renderable straight segment', () => {
      const source = testNode('source', { x: 0, y: 0, width: 100, height: 100 })
      const target = testNode('target', { x: 300, y: 0, width: 100, height: 100 })
      const edge = testEdge('source-target', source, target)

      const { xyedges } = graphViewToXY({
        view: testView([source, target], [edge]),
        where: null,
      })

      // bezierPath() requires 1 + 3k points; anything else throws at render time.
      expect(xyedges[0]!.data.points).toHaveLength(4)
      expect(xyedges[0]!.data.points[0]).toEqual([50, 50])
      expect(xyedges[0]!.data.points[3]).toEqual([350, 50])
    })

    it('hides the label', () => {
      const source = testNode('source')
      const target = testNode('target')
      const edge = testEdge('source-target', source, target, { label: 'calls' })

      const { xyedges } = graphViewToXY({
        view: testView([source, target], [edge]),
        where: null,
      })

      expect(xyedges[0]!.data.label).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('labels a node with title, technology and description', () => {
      const node = testNode('web', {
        title: 'Web Application',
        technology: 'React',
        description: { txt: 'Serves the UI' },
      })

      const { xynodes } = graphViewToXY({
        view: testView([node], []),
        where: null,
      })

      expect(xynodes[0]!.ariaLabel).toBe('Web Application. Technology: React. Description: Serves the UI.')
    })

    it('labels an edge with source, target and technology', () => {
      const source = testNode('customer', { title: 'Customer' })
      const target = testNode('web', { title: 'Web Application' })
      const edge = testEdge('customer-web', source, target, { technology: 'HTTPS' })

      const { xyedges } = graphViewToXY({
        view: testView([source, target], [edge]),
        where: null,
      })

      expect(xyedges[0]!.ariaLabel).toBe('Relationship from Customer to Web Application. Technology: HTTPS.')
    })
  })

  describe('where filter', () => {
    it('hides nodes and edges that do not match the predicate', () => {
      const source = testNode('source', { tags: [] })
      const target = testNode('target', { tags: ['internal'] })
      const edge = testEdge('source-target', source, target, { tags: [] })

      const { xynodes, xyedges } = graphViewToXY({
        view: testView([source, target], [edge]),
        where: { tag: 'internal' },
      })

      expect(xynodes.find(n => n.id === 'source')?.hidden).toBe(true)
      expect(xynodes.find(n => n.id === 'target')?.hidden).toBe(false)
      expect(xyedges[0]!.hidden).toBe(true)
    })
  })
})
