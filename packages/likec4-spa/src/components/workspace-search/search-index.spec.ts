import type { Fqn, ProjectId, ViewId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import {
  type SearchElement,
  type SearchView,
  createWorkspaceIndex,
  parseQuery,
  searchWorkspace,
} from './search-index'

const pid = (id: string) => id as ProjectId

function el(projectId: string, id: string, title: string, extra: Partial<SearchElement> = {}): SearchElement {
  return {
    type: 'element',
    projectId: pid(projectId),
    id: id as Fqn,
    name: id.split('.').pop() ?? id,
    title,
    kind: 'service',
    shape: 'rectangle',
    summary: '',
    tags: [],
    metadata: {},
    views: [],
    ...extra,
  }
}

function view(projectId: string, id: string, title: string): SearchView {
  return {
    type: 'view',
    projectId: pid(projectId),
    id: id as ViewId,
    title,
    folder: [],
    description: '',
    tags: [],
    viewType: 'element',
  }
}

const projects = [
  { id: pid('storefront'), title: 'Storefront' },
  { id: pid('checkout'), title: 'Checkout' },
  { id: pid('platform'), title: 'Platform' },
] as const

const index = createWorkspaceIndex(
  projects,
  [
    el('checkout', 'payments.ledger', 'Payment Ledger', { kind: 'database', tags: ['pci'] }),
    el('checkout', 'payments', 'Payments'),
    el('checkout', 'cart', 'Cart'),
    el('storefront', 'web.checkoutPage', 'Checkout Page', { summary: 'Collects the payment method' }),
    el('platform', 'kafka', 'Kafka', { kind: 'queue' }),
  ],
  [
    view('checkout', 'payments-flow', 'Payments / Authorise'),
    view('storefront', 'journey', 'Journeys / Payment'),
  ],
)

describe('parseQuery', () => {
  it('splits the @project prefix', () => {
    expect(parseQuery('@che pay', projects)).toEqual({ text: 'pay', scopeCandidates: ['checkout'] })
    expect(parseQuery('@ pay', projects).scopeCandidates).toEqual(['storefront', 'checkout', 'platform'])
    expect(parseQuery('Pay ', projects)).toEqual({ text: 'pay', scopeCandidates: null })
  })
})

describe('searchWorkspace', () => {
  it('groups by project, most matches first, title matches first', () => {
    const result = searchWorkspace(index, 'payment', null)
    expect(result.elements.map(g => [g.projectId, g.items.map(i => i.title)])).toEqual([
      ['checkout', ['Payment Ledger', 'Payments']],
      ['storefront', ['Checkout Page']],
    ])
    // one match each: ties keep the workspace order
    expect(result.views.map(g => g.projectId)).toEqual(['storefront', 'checkout'])
    expect(result.total).toBe(5)
    expect(Object.fromEntries(result.counts)).toEqual({ checkout: 3, storefront: 2 })
  })

  it('limits results to the scope but counts every project', () => {
    const result = searchWorkspace(index, 'payment', pid('storefront'))
    expect(result.elements.map(g => g.projectId)).toEqual(['storefront'])
    expect(result.counts.get(pid('checkout'))).toBe(3)
  })

  it('narrows to the projects of an @prefix', () => {
    const result = searchWorkspace(index, '@store payment', null)
    expect(result.scopeCandidates).toEqual(['storefront'])
    expect(result.elements.map(g => g.projectId)).toEqual(['storefront'])
  })

  it('supports kind: and #tag', () => {
    expect(searchWorkspace(index, 'kind:queue', null).elements[0]?.items.map(i => i.id)).toEqual(['kafka'])
    expect(searchWorkspace(index, '#pci', null).elements[0]?.items.map(i => i.id)).toEqual(['payments.ledger'])
    expect(searchWorkspace(index, 'kind:queue', null).views).toEqual([])
  })

  it('keeps the workspace order of projects when browsing', () => {
    const result = searchWorkspace(index, '', null)
    expect(result.elements.map(g => g.projectId)).toEqual(['checkout', 'platform'])
    expect(result.views.map(g => g.projectId)).toEqual(['storefront', 'checkout'])

    // a later project with more matches stays below while browsing, moves up when searching
    const small = createWorkspaceIndex(
      [{ id: pid('a'), title: 'A' }, { id: pid('b'), title: 'B' }],
      [el('a', 'svc', 'Service'), el('b', 'svc1', 'Service One'), el('b', 'svc2', 'Service Two')],
      [],
    )
    expect(searchWorkspace(small, '', null).elements.map(g => g.projectId)).toEqual(['a', 'b'])
    expect(searchWorkspace(small, 'service', null).elements.map(g => g.projectId)).toEqual(['b', 'a'])
  })

  it('browses with an empty query: top-level elements and all views, everything within a project', () => {
    const all = searchWorkspace(index, '  ', null)
    expect(all.elements.flatMap(g => g.items.map(i => i.id))).toEqual(['payments', 'cart', 'kafka'])
    expect(all.views.flatMap(g => g.items.map(i => i.id))).toHaveLength(2)

    const scoped = searchWorkspace(index, '', pid('checkout'))
    expect(scoped.elements[0]?.items.map(i => i.id)).toEqual(['payments.ledger', 'payments', 'cart'])
  })
})
