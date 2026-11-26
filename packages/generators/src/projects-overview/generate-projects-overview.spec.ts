import type { LayoutedProjectEdge, LayoutedProjectsNode, LayoutedProjectsView } from '@likec4/core/compute-view'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { generateProjectsOverviewSources } from './generate-projects-overview'

function baseNode() {
  return {
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    labelBBox: { x: 0, y: 0, width: 100, height: 20 },
    description: null,
    technology: null,
    inEdges: [],
    outEdges: [],
    shape: 'rectangle' as const,
    color: 'primary' as const,
    style: {},
    level: 0,
    tags: [],
  }
}

function groupNode(id: string, children: string[]): LayoutedProjectsNode {
  return {
    ...baseNode(),
    id: scalar.NodeId(id),
    kind: '@group',
    title: id,
    parent: null,
    children: children.map(scalar.NodeId),
  }
}

function projectNode(id: string, parent: string): LayoutedProjectsNode {
  return {
    ...baseNode(),
    id: scalar.NodeId(id),
    kind: '@project',
    projectId: scalar.ProjectId(id),
    title: id,
    parent: scalar.NodeId(parent),
    children: [],
    level: 1,
  }
}

const edge: LayoutedProjectEdge = {
  id: scalar.EdgeId('edge'),
  projectId: scalar.ProjectId('billing'),
  source: scalar.NodeId('billing'),
  target: scalar.NodeId('ledger'),
  parent: null,
  label: 'uses',
  relations: [],
  color: 'gray',
  line: 'solid',
  points: [[0, 0], [10, 10]],
}

const overview: LayoutedProjectsView = {
  _type: 'projects',
  _stage: 'layouted',
  id: scalar.ViewId('projects'),
  title: 'Projects',
  description: null,
  bounds: { x: 0, y: 0, width: 400, height: 300 },
  nodes: [
    groupNode('payments', ['billing', 'ledger']),
    projectNode('billing', 'payments'),
    projectNode('ledger', 'payments'),
  ],
  edges: [edge],
}

describe('generateProjectsOverviewSources', () => {
  const sources = generateProjectsOverviewSources(overview)

  it('d2 — when overview has a frame then nests projects inside it', () => {
    expect(sources.d2).toContain('payments')
  })

  it('d2 — when edge exists then connects its projects', () => {
    expect(sources.d2).toMatch(/Billing.*->.*Ledger/)
  })

  it('mmd — when overview has projects then lists them', () => {
    expect(sources.mmd).toContain('billing')
  })

  it('puml — when overview has projects then lists them', () => {
    expect(sources.puml).toContain('billing')
  })

  it('drawioEditUrl — when generated then points to draw.io', () => {
    expect(sources.drawioEditUrl).toMatch(/^https:\/\/app\.diagrams\.net\//)
  })
})
