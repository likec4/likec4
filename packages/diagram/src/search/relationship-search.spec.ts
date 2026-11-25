import { Builder } from '@likec4/core/builder'
import { describe, expect, it } from 'vitest'
import { createRelationshipSearch } from './relationship-search'
import { normalizeSearch } from './SearchContext'

const model = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
    },
    relationships: {
      async: {},
    },
    tags: {
      api: {},
      legacy: {},
    },
    metadataKeys: ['owner'],
  })
  .model(({ actor, system, rel }, _) =>
    _(
      actor('customer', 'Customer'),
      system('cloud', 'Cloud Platform'),
      system('billing', 'Billing'),
      rel('customer', 'cloud', { title: 'uses', technology: 'HTTPS', tags: ['api'] }),
      rel('cloud', 'billing', {
        title: 'sends invoices',
        kind: 'async',
        tags: ['legacy'],
        metadata: { owner: 'payments-team' },
      }),
      rel('customer', 'billing', { title: 'pays' }),
    )
  )
  .toLikeC4Model()

const search = createRelationshipSearch([...model.relationships()])
const found = (text: string) => search(normalizeSearch(text)).map(r => `${r.source.id} -> ${r.target.id}`)

describe('createRelationshipSearch', () => {
  it('returns every relationship for an empty search', () => {
    expect(found('')).toEqual([
      'customer -> cloud',
      'cloud -> billing',
      'customer -> billing',
    ])
  })

  it('finds relationships by title or technology', () => {
    expect(found('invoices')).toEqual(['cloud -> billing'])
    expect(found('https')).toEqual(['customer -> cloud'])
  })

  it('finds relationships by the title or id of an endpoint', () => {
    expect(found('Cloud Platform')).toEqual(['customer -> cloud', 'cloud -> billing'])
    expect(found('customer billing')).toEqual(['customer -> billing'])
  })

  it('filters by tag', () => {
    expect(found('#api')).toEqual(['customer -> cloud'])
    expect(found('#LEG')).toEqual(['cloud -> billing'])
    expect(found('#unknown')).toEqual([])
  })

  it('filters by kind', () => {
    expect(found('kind:async')).toEqual(['cloud -> billing'])
    expect(found('kind:')).toHaveLength(3)
  })

  it('filters by metadata', () => {
    expect(found('meta:owner')).toEqual(['cloud -> billing'])
    expect(found('meta:owner=payments')).toEqual(['cloud -> billing'])
    expect(found('meta:owner=sales')).toEqual([])
  })
})
