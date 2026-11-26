import { scalar } from '@likec4/core'
import { describe, it } from 'vitest'
import type { ProjectsOverviewTypes } from './_types'
import { absoluteBoundsOf, deriveOverview, focusFrameFilter, noOverviewFilter, visibleBoundsOf } from './derive'

const noFilter = noOverviewFilter

function parentOf(parentId: string | undefined): { parentId?: string } {
  return parentId === undefined ? {} : { parentId }
}

function frame(id: string, parentId?: string): ProjectsOverviewTypes.GroupNode {
  return {
    id: scalar.NodeId(id),
    type: 'project-group',
    ...parentOf(parentId),
    position: { x: 0, y: 0 },
    initialWidth: 100,
    initialHeight: 100,
    data: {
      id: scalar.NodeId(id),
      title: id,
      color: 'gray',
      depth: 1,
      style: {},
      width: 100,
      height: 100,
    },
  }
}

function project(id: string, parentId?: string): ProjectsOverviewTypes.ProjectNode {
  return {
    id: scalar.NodeId(id),
    type: 'project',
    ...parentOf(parentId),
    position: { x: 0, y: 0 },
    initialWidth: 100,
    initialHeight: 50,
    data: {
      id: scalar.NodeId(id),
      projectId: scalar.ProjectId(id),
      title: id,
      color: 'primary',
      shape: 'rectangle',
      style: {},
      width: 100,
      height: 50,
    },
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  points: ProjectsOverviewTypes.Edge['data']['points'] = [[0, 0], [10, 10], [20, 20]],
): ProjectsOverviewTypes.Edge {
  return {
    id: scalar.EdgeId(id),
    source: scalar.NodeId(source),
    target: scalar.NodeId(target),
    type: 'relationship',
    data: {
      id: scalar.EdgeId(id),
      projectId: scalar.ProjectId(source),
      points,
      color: 'gray',
      line: 'solid',
      label: null,
      labelBBox: null,
      technology: null,
      routing: 'spline',
    },
  }
}

const nodes = [
  frame('payments'),
  frame('shop'),
  project('api', 'payments'),
  project('ledger', 'payments'),
  project('catalog', 'shop'),
  project('canvas'),
  project('isolated', 'shop'),
]
const edges = [
  edge('e-api-catalog', 'api', 'catalog'),
  edge('e-ledger-catalog', 'ledger', 'catalog'),
  edge('e-api-ledger', 'api', 'ledger'),
  edge('e-canvas-api', 'canvas', 'api'),
]

function hiddenOf(result: ReturnType<typeof deriveOverview>): string[] {
  return [...result.nodes.filter(n => n.hidden).map(n => n.id), ...result.edges.filter(e => e.hidden).map(e => e.id)]
}

describe('deriveOverview', () => {
  it('hides a hidden frame, its projects and the edges to them', ({ expect }) => {
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenGroups: ['payments'] })
    expect(hiddenOf(result).sort()).toEqual(
      ['api', 'e-api-catalog', 'e-api-ledger', 'e-canvas-api', 'e-ledger-catalog', 'ledger', 'payments'].sort(),
    )
  })

  it('keeps the other frames and the edges between visible projects', ({ expect }) => {
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenGroups: ['shop'] })
    expect(result.nodes.find(n => n.id === 'catalog')?.hidden).toBe(true)
    expect(result.edges.find(e => e.id === 'e-api-ledger')?.hidden).toBe(false)
    expect(result.edges.find(e => e.id === 'e-api-catalog')?.hidden).toBe(true)
  })

  it('shows only the focused frame and hides edges that leave it', ({ expect }) => {
    const result = deriveOverview(nodes, edges, { ...noFilter, focusFrame: 'payments' })
    expect(result.nodes.filter(n => !n.hidden).map(n => n.id).sort()).toEqual(['api', 'ledger', 'payments'])
    expect(result.edges.filter(e => !e.hidden).map(e => e.id)).toEqual(['e-api-ledger'])
  })

  it('dims everything except the project and its neighbors', ({ expect }) => {
    const result = deriveOverview(nodes, edges, { ...noFilter, highlight: { kind: 'project', nodeId: 'api' } })
    const dimmedNodes = result.nodes.filter(n => n.type === 'project' && n.data.dimmed).map(n => n.id)
    expect(dimmedNodes).toEqual(['isolated'])
    expect(result.nodes.find(n => n.id === 'ledger')?.data).toMatchObject({ dimmed: false })
    expect(result.nodes.find(n => n.id === 'catalog')?.data).toMatchObject({ dimmed: false })
    expect(result.edges.find(e => e.id === 'e-ledger-catalog')?.data).toMatchObject({ dimmed: true })
    expect(result.edges.find(e => e.id === 'e-canvas-api')?.data).toMatchObject({ dimmed: false })
    expect(result.edges.find(e => e.id === 'e-api-catalog')?.data).toMatchObject({ dimmed: false })
  })

  it('keeps only the edges of a bundle highlighted', ({ expect }) => {
    const base = deriveOverview(nodes, edges, noFilter)
    const [bundle] = base.bundles
    const result = deriveOverview(nodes, edges, { ...noFilter, highlight: { kind: 'bundle', key: bundle!.key } })
    expect(result.edges.filter(e => !e.data?.dimmed).map(e => e.id).sort()).toEqual([...bundle!.edgeIds].sort())
  })

  it('groups cross-frame edges into one bundle per frame pair, without intra-frame or canvas edges', ({ expect }) => {
    const { bundles } = deriveOverview(nodes, edges, noFilter)
    expect(bundles).toHaveLength(1)
    expect(bundles[0]).toMatchObject({
      frames: ['payments', 'shop'],
      frameTitles: ['payments', 'shop'],
      edgeIds: ['e-api-catalog', 'e-ledger-catalog'],
      projects: ['api → catalog', 'ledger → catalog'],
    })
  })

  it('counts only visible edges for hub badges and bundles', ({ expect }) => {
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenGroups: ['shop'] })
    expect(result.bundles).toHaveLength(0)
    expect(result.nodes.find(n => n.id === 'api')?.data).toMatchObject({ fanIn: 1, fanOut: 1 })
  })

  it('counts incoming and outgoing edges on each project', ({ expect }) => {
    const result = deriveOverview(nodes, edges, noFilter)
    expect(result.nodes.find(n => n.id === 'catalog')?.data).toMatchObject({ fanIn: 2, fanOut: 0 })
    expect(result.nodes.find(n => n.id === 'api')?.data).toMatchObject({ fanIn: 1, fanOut: 2 })
  })

  it('hides the edges of a hidden bundle and keeps the bundle listed as hidden', ({ expect }) => {
    const [bundle] = deriveOverview(nodes, edges, noFilter).bundles
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenBundles: [bundle!.key] })
    expect(result.edges.filter(e => e.hidden).map(e => e.id).sort()).toEqual([...bundle!.edgeIds].sort())
    expect(result.bundles).toMatchObject([{ key: bundle!.key, hidden: true }])
  })

  it('keeps edges inside a frame and projects when a bundle is hidden', ({ expect }) => {
    const [bundle] = deriveOverview(nodes, edges, noFilter).bundles
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenBundles: [bundle!.key] })
    expect(result.edges.find(e => e.id === 'e-api-ledger')?.hidden).toBe(false)
    expect(result.nodes.filter(n => n.hidden)).toEqual([])
  })

  it('counts hub edges without the edges of a hidden bundle', ({ expect }) => {
    const [bundle] = deriveOverview(nodes, edges, noFilter).bundles
    const result = deriveOverview(nodes, edges, { ...noFilter, hiddenBundles: [bundle!.key] })
    expect(result.nodes.find(n => n.id === 'catalog')?.data).toMatchObject({ fanIn: 0, fanOut: 0 })
  })

  it('absoluteBoundsOf — when node is nested then sums parent positions', ({ expect }) => {
    const payments = { ...frame('payments'), position: { x: 100, y: 50 } }
    const api = { ...project('api', 'payments'), position: { x: 10, y: 20 } }
    expect(absoluteBoundsOf([payments, api], 'api')).toEqual({ x: 110, y: 70, width: 100, height: 50 })
  })

  it('visibleBoundsOf — when a frame is hidden then excludes it', ({ expect }) => {
    const payments = { ...frame('payments'), position: { x: 0, y: 0 } }
    const shop = { ...frame('shop'), position: { x: 300, y: 0 } }
    const hiddenShop = { ...shop, hidden: true }
    expect(visibleBoundsOf([payments, shop])).toEqual({ x: 0, y: 0, width: 400, height: 100 })
    expect(visibleBoundsOf([payments, hiddenShop])).toEqual({ x: 0, y: 0, width: 100, height: 100 })
  })

  it('visibleBoundsOf — when every node is hidden then returns null', ({ expect }) => {
    expect(visibleBoundsOf([{ ...frame('payments'), hidden: true }])).toBeNull()
  })

  it('focusFrameFilter — when the frame is hidden then shows it and keeps the other hidden frames', ({ expect }) => {
    const filter = { ...noFilter, hiddenGroups: ['payments', 'shop'] }
    const result = focusFrameFilter(nodes, filter, 'payments')
    expect(result).toMatchObject({ focusFrame: 'payments', hiddenGroups: ['shop'], highlight: null })
  })

  it('focusFrameFilter — when an ancestor is hidden then shows the ancestor too', ({ expect }) => {
    const inner = [frame('outer'), frame('inner', 'outer'), project('api', 'inner')]
    const filter = { ...noFilter, hiddenGroups: ['outer', 'inner'] }
    expect(focusFrameFilter(inner, filter, 'inner').hiddenGroups).toEqual([])
  })

  it('focusFrameFilter — when a frame inside the focus is hidden then keeps it hidden', ({ expect }) => {
    const inner = [frame('outer'), frame('inner', 'outer'), project('api', 'inner')]
    const filter = { ...noFilter, hiddenGroups: ['inner'] }
    expect(focusFrameFilter(inner, filter, 'outer').hiddenGroups).toEqual(['inner'])
  })

  it('focusFrameFilter — when the focused view is derived then its projects are visible', ({ expect }) => {
    const filter = focusFrameFilter(nodes, { ...noFilter, hiddenGroups: ['payments'] }, 'payments')
    const result = deriveOverview(nodes, edges, filter)
    expect(result.nodes.filter(n => !n.hidden).length).toBeGreaterThan(0)
  })
})
