import { hasAtLeast } from 'remeda'
import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import { LikeC4Model } from '../../model'
import type { ImportedProjectMeta, NTuple, ProjectId } from '../../types'
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

/**
 * Returns a copy of the model with the given import metadata
 */
function withImportedProjects(
  model: LikeC4Model.Computed,
  importedProjects: Record<string, ImportedProjectMeta>,
): LikeC4Model.Computed {
  return LikeC4Model.create({
    ...model.$data,
    importedProjects: importedProjects as Record<ProjectId, ImportedProjectMeta>,
  })
}

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

  describe('with import metadata', () => {
    const importsBilling = builder
      .model(({ el, rel }, _) =>
        _(
          el('@billing.c1'),
          el('@billing.c1.sub'),
          rel('c1.sub', '@billing.c1.sub'),
        )
      )
    const importsPayments = builder
      .model(({ el, rel }, _) =>
        _(
          el('@payments.c1'),
          rel('c1.sub', '@payments.c1'),
        )
      )

    it('links workspace project imported under another name', ({ expect }) => {
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), {
        billing: {
          name: 'projectB',
          source: { kind: 'workspace', projectId: 'projectB' as ProjectId },
        },
      })
      const projectB = builder.toLikeC4Model('projectB')

      const result = computeProjectsView([projectA, projectB])
      expect(result.nodes).toHaveLength(2)
      const [nodeA, nodeB] = result.nodes as unknown as NTuple<ComputedProjectNode, 2>
      expect(nodeA).toMatchObject({ projectId: 'projectA' })
      expect(nodeB).toMatchObject({ projectId: 'projectB' })
      expect(nodeB).not.toHaveProperty('external')

      expect(result.edges).toHaveLength(1)
      expect(result.edges).toMatchObject([
        { source: nodeA.id, target: nodeB.id, projectId: 'projectA' },
      ])
      expect(nodeA.outEdges).toEqual([result.edges[0]!.id])
      expect(nodeB.inEdges).toEqual([result.edges[0]!.id])
    })

    it('skips import that resolves to the importing project itself', ({ expect }) => {
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), {
        billing: {
          name: 'projectA',
          source: { kind: 'workspace', projectId: 'projectA' as ProjectId },
        },
      })
      const projectB = builder.toLikeC4Model('projectB')

      const result = computeProjectsView([projectA, projectB])
      expect(result.nodes.map(n => n.projectId)).toEqual(['projectA', 'projectB'])
      expect(result.edges).toEqual([])
      expect(result.nodes).toMatchObject([
        { projectId: 'projectA', inEdges: [], outEdges: [] },
        { projectId: 'projectB', inEdges: [], outEdges: [] },
      ])
    })

    it('adds a node for external project, titled with its original name', ({ expect }) => {
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), {
        billing: {
          name: 'billing-service',
          source: { kind: 'local', path: '../billing' },
        },
      })
      const projectB = builder.toLikeC4Model('projectB')

      const result = computeProjectsView([projectA, projectB])
      expect(result.nodes).toHaveLength(3)
      const external = result.nodes.find(n => n.external)
      invariant(external, 'external node must exist')
      expect(external).toMatchObject({
        kind: '@project',
        projectId: 'billing@projectA',
        title: 'billing-service',
        color: 'muted',
        external: {
          importedBy: 'projectA',
          importName: 'billing',
          source: { kind: 'local', path: '../billing' },
        },
      })
      expect(external.description?.txt).toMatchInlineSnapshot(`
        "External project, imported by projectA as "billing"
        Source: ../billing"
      `)

      const nodeA = result.nodes.find(n => n.projectId === 'projectA')!
      expect(result.edges).toMatchObject([
        { source: nodeA.id, target: external.id, projectId: 'projectA' },
      ])
      expect(external.inEdges).toEqual([result.edges[0]!.id])
      // Workspace nodes are not affected
      expect(result.nodes.filter(n => !n.external).map(n => n.projectId)).toEqual(['projectA', 'projectB'])
    })

    it('titles external project with the import name, if original name is missing', ({ expect }) => {
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), {
        billing: {
          name: '',
          source: { kind: 'local', path: '../billing' },
        },
      })
      const result = computeProjectsView([projectA])
      expect(result.nodes).toMatchObject([
        { projectId: 'projectA', title: 'projectA' },
        { projectId: 'billing@projectA', title: 'billing' },
      ])
    })

    it('treats unknown source kinds as external projects', ({ expect }) => {
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), {
        billing: {
          name: 'billing-service',
          // Kinds added later (e.g. git) must fall into the external branch
          source: { kind: 'git', url: 'https://example.com/billing.git' } as unknown as ImportedProjectMeta['source'],
        },
      })
      const result = computeProjectsView([projectA])
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[1]).toMatchObject({
        projectId: 'billing@projectA',
        title: 'billing-service',
        description: { txt: 'External project, imported by projectA as "billing"' },
      })
      expect(result.edges).toHaveLength(1)
    })

    it('adds a node per importing project and import name', ({ expect }) => {
      const meta: ImportedProjectMeta = {
        name: 'billing-service',
        source: { kind: 'local', path: '../billing' },
      }
      const projectA = withImportedProjects(importsBilling.toLikeC4Model('projectA'), { billing: meta })
      const projectB = withImportedProjects(importsPayments.toLikeC4Model('projectB'), { payments: meta })

      const result = computeProjectsView([projectA, projectB])
      expect(result.nodes.map(n => n.projectId)).toEqual([
        'projectA',
        'projectB',
        'billing@projectA',
        'payments@projectB',
      ])
      expect(result.edges).toHaveLength(2)
    })

    it('keeps resolving imports without metadata by the import name', ({ expect }) => {
      const projectA = withImportedProjects(
        builder
          .model(({ el, rel }, _) =>
            _(
              el('@projectB.c1'),
              el('@billing.c1'),
              rel('c1', '@projectB.c1'),
              rel('c1.sub', '@billing.c1'),
            )
          )
          .toLikeC4Model('projectA'),
        {
          billing: {
            name: 'billing',
            source: { kind: 'local', path: '../billing' },
          },
        },
      )
      const projectB = builder.toLikeC4Model('projectB')

      const result = computeProjectsView([projectA, projectB])
      const [nodeA, nodeB] = result.nodes as unknown as NTuple<ComputedProjectNode, 2>
      expect(nodeB.projectId).toBe('projectB')
      expect(result.edges).toHaveLength(2)
      expect(result.edges).toContainEqual(expect.objectContaining({ source: nodeA.id, target: nodeB.id }))
    })
  })
})
