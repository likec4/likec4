import { hasAtLeast } from 'remeda'
import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import { invariant } from '../../utils'
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
    expect(result.nodes).toMatchObject([
      { id: 'projectA' },
      { id: 'projectB' },
    ])
    expect(result.edges).toHaveLength(0)
  })

  it('should compute with relationship', ({ expect }) => {
    const projectA = builder
      .model(({ el, rel }, _) =>
        _(
          el('@projectB.c1'),
          el('@projectB.c1.sub'),
          rel('c1.sub', '@projectB.c1.sub'),
        )
      )
      .toLikeC4Model('projectA')

    const projectB = builder.toLikeC4Model({
      id: 'projectB',
      title: 'ProjectB Title',
    })

    const result = computeProjectsView([projectA, projectB])
    expect(result.nodes).toHaveLength(2)
    expect(result.nodes).toMatchObject([
      { id: 'projectA', title: 'projectA' },
      { id: 'projectB', title: 'ProjectB Title' },
    ])
    expect(result.edges).toMatchObject([
      { source: 'projectA', target: 'projectB' },
    ])
    const { id } = result.edges[0]!
    expect(result.nodes[0]?.outEdges).toEqual([id])
    expect(result.nodes[1]?.inEdges).toEqual([id])

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
    expect(result.nodes).toMatchObject([
      { id: 'projectA' },
      { id: 'projectB' },
    ])
    invariant(hasAtLeast(result.nodes, 2))
    const [nodeA, nodeB] = result.nodes

    expect(result.edges).toMatchObject([
      { source: 'projectA', target: 'projectB' },
      { source: 'projectB', target: 'projectA' },
    ])
    invariant(hasAtLeast(result.edges, 2))
    const [{ id: edgeId1 }, { id: edgeId2 }] = result.edges
    // ProjectA -> ProjectB (edgeId1)
    // ProjectB -> ProjectA (edgeId2)
    expect(nodeA.outEdges).toEqual([edgeId1])
    expect(nodeA.inEdges).toEqual([edgeId2])
    expect(nodeB.outEdges).toEqual([edgeId2])
    expect(nodeB.inEdges).toEqual([edgeId1])

    // Initial order should matter (as both have same relationships)
    const anotherOrder = computeProjectsView([projectB, projectA])
    expect(anotherOrder.nodes).toMatchObject([
      { id: 'projectB' },
      { id: 'projectA' },
    ])
  })
})
