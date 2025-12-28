import { hasAtLeast } from 'remeda'
import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import type { NTuple } from '../../types'
import { invariant } from '../../utils'
import type { ComputedProjectNode } from './_types'
import { computeProjectsView } from './compute'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
  })
  .model(({ el }, _) =>
    _(
      el('c1'),
      el('c1.sub'),
    )
  )

describe('projects-view', () => {
  it('should compute if no relationships', ({ expect }) => {
    const projectA = builder.toLikeC4Model('projectA')
    const projectB = builder.toLikeC4Model('projectB')

    const result = computeProjectsView([projectA, projectB])
    expect(result.nodes).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "color": "primary",
          "description": {
            "txt": "Elements: 2
      Relationships: 0
      Views: 0",
          },
          "id": "1pf41yp",
          "inEdges": [],
          "kind": "@project",
          "level": 0,
          "outEdges": [],
          "parent": null,
          "projectId": "projectA",
          "shape": "rectangle",
          "style": {},
          "tags": [],
          "title": "projectA",
        },
        {
          "children": [],
          "color": "primary",
          "description": {
            "txt": "Elements: 2
      Relationships: 0
      Views: 0",
          },
          "id": "1pf41yq",
          "inEdges": [],
          "kind": "@project",
          "level": 0,
          "outEdges": [],
          "parent": null,
          "projectId": "projectB",
          "shape": "rectangle",
          "style": {},
          "tags": [],
          "title": "projectB",
        },
      ]
    `)
    expect(result.edges).toHaveLength(0)
  })

  it('should compute with relationship', ({ expect }) => {
    const projectA = builder
      .model(({ el, rel }, _) =>
        _(
          el('some'),
          el('some.extra'),
          el('@projectB.c1'),
          el('@projectB.c1.sub'),
          rel('c1.sub', '@projectB.c1.sub'),
          rel('some.extra', 'c1'),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('index', $include('*')),
        )
      )
      .toLikeC4Model('projectA')

    const projectB = builder.toLikeC4Model({
      id: 'projectB',
      title: 'ProjectB Title',
    })

    const result = computeProjectsView([projectA, projectB])
    expect(result.nodes).toHaveLength(2)
    const [nodeA, nodeB] = result.nodes as unknown as NTuple<ComputedProjectNode, 2>

    expect(result.edges).toMatchObject([
      { source: nodeA.id, target: nodeB.id, projectId: 'projectA' },
    ])
    const { id } = result.edges[0]!

    expect(result.nodes).toMatchObject([
      { title: 'projectA', projectId: 'projectA', outEdges: [id], inEdges: [] },
      { title: 'ProjectB Title', projectId: 'projectB', outEdges: [], inEdges: [id] },
    ])

    expect(nodeA.description?.txt, 'generated description of projectA').toMatchInlineSnapshot(`
      "Elements: 4
      Relationships: 2
      Views: 1"
    `)
    expect(nodeB.description?.txt, 'generated description of projectB').toMatchInlineSnapshot(`
      "Elements: 2
      Relationships: 0
      Views: 0"
    `)

    // Initial order should not matter
    const anotherOrder = computeProjectsView([projectB, projectA])
    expect(anotherOrder.nodes).toEqual(result.nodes)
  })

  it('should compute two directions', ({ expect }) => {
    const projectA = builder
      .model(({ el, rel }, _) =>
        _(
          el('@projectB.c1'),
          el('@projectB.c1.sub'),
          rel('c1.sub', '@projectB.c1.sub'),
        )
      )
      .toLikeC4Model('projectA')

    const projectB = builder
      .model(({ el, rel }, _) =>
        _(
          el('@projectA.c1'),
          rel('c1', '@projectA.c1'),
        )
      )
      .toLikeC4Model('projectB')

    const result = computeProjectsView([projectA, projectB])
    expect(result.nodes).toHaveLength(2)
    const [nodeA, nodeB] = result.nodes as unknown as NTuple<ComputedProjectNode, 2>

    expect(result.edges).toMatchObject([
      { source: nodeA.id, target: nodeB.id, projectId: 'projectA' },
      { source: nodeB.id, target: nodeA.id, projectId: 'projectB' },
    ])
    invariant(hasAtLeast(result.edges, 2))
    const [{ id: edgeId1 }, { id: edgeId2 }] = result.edges

    expect(result.nodes).toMatchObject([
      { projectId: 'projectA', inEdges: [edgeId2], outEdges: [edgeId1] },
      { projectId: 'projectB', inEdges: [edgeId1], outEdges: [edgeId2] },
    ])

    // Changing initial order affects the order of nodes
    const anotherOrder = computeProjectsView([projectB, projectA])
    expect(anotherOrder.nodes).toMatchObject([
      { projectId: 'projectB' },
      { projectId: 'projectA' },
    ])
  })
})
