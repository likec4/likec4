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
          "metrics": {
            "elements": 2,
            "relationships": 0,
            "views": 0,
          },
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
          "metrics": {
            "elements": 2,
            "relationships": 0,
            "views": 0,
          },
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

  describe('projectsOverview options', () => {
    const withMeta = (id: string, metadata: Record<string, unknown>) => builder.toLikeC4Model({ id, metadata })

    it('groups by one key and leaves projects without the key on the canvas', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('checkout', { domain: 'payments' }),
        withMeta('ledger', { domain: 'payments' }),
        withMeta('catalog', { domain: 'shop' }),
        withMeta('shared', {}),
      ], { groupBy: { key: 'domain' } })

      expect(result.nodes.map(node => [node.kind, node.title, node.parent])).toEqual([
        ['@group', 'payments', null],
        ['@project', 'checkout', result.nodes[0]!.id],
        ['@project', 'ledger', result.nodes[0]!.id],
        ['@group', 'shop', null],
        ['@project', 'catalog', result.nodes[3]!.id],
        ['@project', 'shared', null],
      ])
      expect(result.nodes.filter(node => node.kind === '@group').map(node => node.title)).toEqual(['payments', 'shop'])
      expect(result.nodes.some(node => node.title === 'Unspecified')).toBe(false)
    })

    it('nests thenBy only inside a group and keeps a project without the inner key in the parent', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('api', { domain: 'payments', team: 'checkout' }),
        withMeta('batch', { domain: 'payments' }),
        withMeta('auth', { team: 'platform' }),
      ], {
        groupBy: { key: 'domain', thenBy: { key: 'team' } },
      })

      const payments = result.nodes.find(node => node.kind === '@group' && node.title === 'payments')
      const checkout = result.nodes.find(node => node.kind === '@group' && node.title === 'checkout')
      invariant(payments && checkout)
      expect(checkout.parent).toBe(payments.id)
      expect(checkout.depth).toBe(1)
      expect(payments.depth).toBe(2)
      expect(result.nodes.find(node => node.title === 'api')).toMatchObject({ parent: checkout.id, level: 2 })
      expect(result.nodes.find(node => node.title === 'batch')).toMatchObject({ parent: payments.id, level: 1 })
      expect(result.nodes.find(node => node.title === 'auth')).toMatchObject({
        parent: null,
        level: 0,
        kind: '@project',
      })
      expect(result.nodes.filter(node => node.kind === '@group')).toHaveLength(2)
    })

    it('reads trimmed strings, numbers and booleans, and ignores other values', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('trimmed', { domain: '  payments  ' }),
        withMeta('numbered', { domain: 1 }),
        withMeta('flagged', { domain: true }),
        withMeta('blank', { domain: '   ' }),
        withMeta('listed', { domain: ['payments'] }),
      ], { groupBy: { key: 'domain' } })

      expect(result.nodes.filter(node => node.kind === '@group').map(node => node.title)).toEqual([
        '1',
        'payments',
        'true',
      ])
      expect(result.nodes.filter(node => node.kind === '@project' && node.parent === null).map(node => node.title))
        .toEqual([
          'blank',
          'listed',
        ])
    })

    it('colors projects from metadata and leaves groups gray', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('api', { domain: 'payments', sourcing: 'build' }),
        withMeta('vendor', { domain: 'payments', sourcing: 'unknown' }),
        withMeta('shared', {}),
      ], {
        groupBy: { key: 'domain' },
        colorBy: { key: 'sourcing', colors: { build: 'green', buy: 'blue' } },
      })
      expect(result.nodes.find(node => node.title === 'api')?.color).toBe('green')
      expect(result.nodes.find(node => node.title === 'vendor')?.color).toBe('primary')
      expect(result.nodes.find(node => node.title === 'shared')?.color).toBe('primary')
      expect(result.nodes.find(node => node.kind === '@group')?.color).toBe('gray')
    })

    it('sets orthogonal routing only when requested', ({ expect }) => {
      const models = [withMeta('a', {}), withMeta('b', {})]
      invariant(hasAtLeast(models, 2))
      expect(computeProjectsView(models).routing).toBeUndefined()
      expect(computeProjectsView(models, { routing: 'spline' }).routing).toBeUndefined()
      expect(computeProjectsView(models, { routing: 'ortho' }).routing).toBe('ortho')
    })

    it('hides excluded projects and the edges to them', ({ expect }) => {
      const shown = builder
        .model(({ el, rel }, _) =>
          _(
            el('some'),
            el('@hidden.c1'),
            el('@kept.c1'),
            rel('some', '@hidden.c1'),
            rel('some', '@kept.c1'),
          )
        )
        .toLikeC4Model({ id: 'shown', metadata: { kind: 'system' } })
      const result = computeProjectsView([
        shown,
        withMeta('hidden', { kind: 'metamodel' }),
        withMeta('kept', { kind: 'system' }),
      ], { exclude: { key: 'kind', values: ['metamodel'] } })

      expect(result.nodes.map(node => node.title).sort()).toEqual(['kept', 'shown'])
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0]).toMatchObject({ projectId: 'shown' })
    })

    it('keeps projects whose excluded key is missing or has another value', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('flagged', { kind: ' metamodel ' }),
        withMeta('plain', {}),
        withMeta('other', { kind: 'system' }),
      ], { exclude: { key: 'kind', values: ['metamodel'] } })

      expect(result.nodes.map(node => node.title).sort()).toEqual(['other', 'plain'])
    })

    it('returns no nodes when every project is excluded', ({ expect }) => {
      const models = [withMeta('a', { kind: 'metamodel' }), withMeta('b', { kind: 'metamodel' })]
      invariant(hasAtLeast(models, 2))
      expect(computeProjectsView(models, { exclude: { key: 'kind', values: ['metamodel'] } }).nodes).toEqual([])
    })

    it('lists the colorBy values of the shown projects with their colors and counts', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('api', { sourcing: 'build' }),
        withMeta('ledger', { sourcing: 'build' }),
        withMeta('legacy', { sourcing: 'retire' }),
        withMeta('vendor', { sourcing: 'buy' }),
        withMeta('gone', { sourcing: 'build', kind: 'metamodel' }),
      ], {
        colorBy: { key: 'sourcing', colors: { build: 'green', retire: 'muted' } },
        exclude: { key: 'kind', values: ['metamodel'] },
      })

      expect(result.legend).toEqual({
        colorBy: {
          key: 'sourcing',
          entries: [
            { value: 'build', color: 'green', count: 2 },
            { value: 'buy', color: 'primary', count: 1 },
            { value: 'retire', color: 'muted', count: 1 },
          ],
        },
      })
    })

    it('omits the legend when the overview has no colorBy', ({ expect }) => {
      const result = computeProjectsView([withMeta('a', { sourcing: 'build' }), withMeta('b', {})], {
        groupBy: { key: 'sourcing' },
      })
      expect(result.legend).toBeUndefined()
    })

    it('colors frames by value per level and leaves other frames gray', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('api', { domain: 'payments', team: 'checkout' }),
        withMeta('batch', { domain: 'shop', team: 'catalog' }),
        withMeta('odd', { domain: 'constructor' }),
      ], {
        groupBy: {
          key: 'domain',
          colors: { payments: 'amber' },
          thenBy: { key: 'team', colors: { checkout: 'green' } },
        },
      })

      const colorOf = (title: string) =>
        result.nodes.find(node => node.kind === '@group' && node.title === title)?.color
      expect(colorOf('payments')).toBe('amber')
      expect(colorOf('checkout')).toBe('green')
      expect(colorOf('shop')).toBe('gray')
      expect(colorOf('catalog')).toBe('gray')
      expect(colorOf('constructor')).toBe('gray')
    })

    it('ranks top-level groups by order, then alphabetically', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('ai-agent', { domain: 'ai' }),
        withMeta('pay', { domain: 'payments' }),
        withMeta('plat', { domain: 'platform' }),
        withMeta('shop', { domain: 'shop' }),
        withMeta('archive', { domain: 'archive' }),
      ], { groupBy: { key: 'domain' }, order: ['payments', 'platform'] })

      expect(result.nodes.filter(node => node.kind === '@group').map(node => node.title)).toEqual([
        'payments',
        'platform',
        'ai',
        'archive',
        'shop',
      ])
    })

    it('lists the top-level groups as layers only when an order is set', ({ expect }) => {
      const models = [
        withMeta('api', { domain: 'payments', team: 'checkout' }),
        withMeta('catalog', { domain: 'shop' }),
      ]
      invariant(hasAtLeast(models, 2))
      const ordered = computeProjectsView(models, {
        groupBy: { key: 'domain', thenBy: { key: 'team' } },
        order: ['shop'],
      })
      const titleOf = (id: string) => ordered.nodes.find(node => node.id === id)?.title
      expect(ordered.layers?.map(titleOf)).toEqual(['shop', 'payments'])
      expect(computeProjectsView(models, { groupBy: { key: 'domain' } }).layers).toBeUndefined()
    })

    it('ranks only the first groupBy level', ({ expect }) => {
      const result = computeProjectsView([
        withMeta('api', { domain: 'payments', team: 'checkout' }),
        withMeta('batch', { domain: 'payments', team: 'billing' }),
      ], {
        groupBy: { key: 'domain', thenBy: { key: 'team' } },
        order: ['payments'],
      })

      expect(result.nodes.filter(node => node.kind === '@group').map(node => node.title)).toEqual([
        'payments',
        'billing',
        'checkout',
      ])
    })

    it('keeps group ids when the project order changes', ({ expect }) => {
      const first = withMeta('a', { domain: 'payments' })
      const second = withMeta('b', { domain: 'shop' })
      const forward = computeProjectsView([first, second], { groupBy: { key: 'domain' } })
      const reverse = computeProjectsView([second, first], { groupBy: { key: 'domain' } })
      const groupIds = (nodes: typeof forward.nodes) =>
        nodes.filter(node => node.kind === '@group').map(node => [node.title, node.id])
      expect(groupIds(reverse.nodes)).toEqual(groupIds(forward.nodes))
    })
  })
})
