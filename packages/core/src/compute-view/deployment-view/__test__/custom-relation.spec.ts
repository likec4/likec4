import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

function edge(view: ReturnType<typeof computeView>, id: string) {
  const found = view.edges.find(e => e.id === id)
  expect(found, `edge ${id}`).toBeDefined()
  return found!
}

describe('custom relation predicate (with) in deployment views', () => {
  it('includes the relation and applies the custom properties', () => {
    const view = computeView(
      $include('prod.eu.zone1.ui -> prod.eu.zone1.api', {
        with: {
          title: 'HTTPS',
          color: 'red',
          line: 'dotted',
          technology: 'TLS',
        },
      }),
    )
    expect(view.edgeIds).toEqual(['prod.eu.zone1.ui:prod.eu.zone1.api'])
    expect(edge(view, 'prod.eu.zone1.ui:prod.eu.zone1.api')).toMatchObject({
      label: 'HTTPS',
      color: 'red',
      line: 'dotted',
      technology: 'TLS',
      isCustomized: true,
    })
  })

  it('customizes a relation that is already included by another predicate', () => {
    const view = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone2.*'),
      $include('prod.eu.zone1.ui -> prod.eu.zone1.api', {
        with: { title: 'HTTPS' },
      }),
    )
    expect(edge(view, 'prod.eu.zone1.ui:prod.eu.zone1.api')).toMatchObject({
      label: 'HTTPS',
      isCustomized: true,
    })
    const other = edge(view, 'prod.eu.zone2.ui:prod.eu.zone2.api')
    expect(other.label).toBe('fetches data')
    expect(other).not.toHaveProperty('isCustomized')
  })

  it('customizes edges between deployment nodes', () => {
    const view = computeView(
      $include('customer'),
      $include('prod.eu'),
      $include('customer -> prod.eu', {
        with: { title: 'visits', color: 'red' },
      }),
    )
    expect(edge(view, 'customer:prod.eu')).toMatchObject({
      label: 'visits',
      color: 'red',
    })
  })

  it('applies direction to the matching edge only', () => {
    const view = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone1.ui -> prod.eu.zone1.api', {
        with: { direction: 'back' },
      }),
    )
    expect(edge(view, 'prod.eu.zone1.ui:prod.eu.zone1.api')).toMatchObject({
      source: 'prod.eu.zone1.ui',
      target: 'prod.eu.zone1.api',
      dir: 'back',
    })
    expect(view.edges.filter(e => e.dir === 'back').map(e => e.id)).toEqual([
      'prod.eu.zone1.ui:prod.eu.zone1.api',
    ])
  })

  it('keeps bidirectional edges when direction is back', () => {
    const view = computeView(
      $include('prod.eu.db'),
      $include('prod.us.db'),
      $include('prod.eu.db -> prod.us.db', {
        with: { direction: 'back', title: 'replicates (back)' },
      }),
    )
    expect(edge(view, 'prod.eu.db:prod.us.db')).toMatchObject({
      label: 'replicates (back)',
      dir: 'both',
    })
  })

  it('only customizes relations that satisfy the where condition', () => {
    const view = computeView(
      $include('prod.eu.zone1.*'),
      $include('prod.eu.zone1.ui -> *', {
        where: 'tag is #temp',
        with: { title: 'temporary' },
      }),
    )
    expect(edge(view, 'prod.eu.zone1.ui:prod.eu.media').label).toBe('temporary')
    expect(edge(view, 'prod.eu.zone1.ui:prod.eu.zone1.api').label).toBe('fetches data')
  })
})
