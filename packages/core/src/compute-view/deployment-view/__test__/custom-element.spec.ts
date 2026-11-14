import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

function node(view: ReturnType<typeof computeView>, id: string) {
  const found = view.nodes.find(n => n.id === id)
  expect(found, `node ${id}`).toBeDefined()
  return found!
}

describe('custom element predicate (with) in deployment views', () => {
  it('includes the node and applies the custom properties', () => {
    const view = computeView(
      $include('prod.eu.zone1', {
        with: {
          title: 'Custom',
          color: 'red',
        },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1')
    expect(node(view, 'prod.eu.zone1')).toMatchObject({
      title: 'Custom',
      color: 'red',
      isCustomized: true,
    })
  })

  it('customizes a node that is already included by another predicate', () => {
    const view = computeView(
      $include('prod.eu.zone1'),
      $include('prod.eu.zone2'),
      $include('prod.eu.zone1', {
        with: { title: 'Custom', color: 'red' },
      }),
    )
    expect(node(view, 'prod.eu.zone1')).toMatchObject({
      title: 'Custom',
      color: 'red',
      isCustomized: true,
    })
    expect(node(view, 'prod.eu.zone2')).not.toHaveProperty('isCustomized')
  })

  it('customizes a deployed instance', () => {
    const view = computeView(
      $include('prod.eu.zone1.ui', {
        with: { title: 'Custom' },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1.ui')
    expect(node(view, 'prod.eu.zone1.ui')).toMatchObject({
      title: 'Custom',
      isCustomized: true,
    })
  })

  it('applies custom properties to nodes matched by a wildcard', () => {
    const view = computeView(
      $include('prod.eu.zone1.*', {
        with: { color: 'red' },
      }),
    )
    expect(view.nodeIds).toContain('prod.eu.zone1.api')
    expect(node(view, 'prod.eu.zone1.api')).toMatchObject({
      color: 'red',
      isCustomized: true,
    })
  })
})
