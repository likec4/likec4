import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import { LikeC4 } from './LikeC4'

describe('Integration: relationship direction in examples/relationship-direction', () => {
  const workspace = resolve(__dirname, '../../../examples/relationship-direction')

  it('lays out subscriptions producer-first', async ({ expect }) => {
    const likec4 = await LikeC4.fromWorkspace(workspace, { throwIfInvalid: true, printErrors: false })
    const model = await likec4.layoutedModel()

    const x = (viewId: string, id: string) => {
      const node = model.view(viewId).$view.nodes.find(n => n.id === id)
      if (!node) {
        throw new Error(`node ${id} not found in ${viewId}`)
      }
      return node.x
    }

    // Backward: events is laid out before its subscribers
    expect(x('index', 'shop.events')).toBeLessThan(x('index', 'shop.billing'))
    expect(x('index', 'shop.events')).toBeLessThan(x('index', 'shop.shipping'))
    expect(x('index', 'shop.orders')).toBeLessThan(x('index', 'shop.events'))
    expect(x('index', 'shop.billing')).toBeLessThan(x('index', 'bank'))

    // Forward: subscribers are laid out before events
    expect(x('forward', 'shop.billing')).toBeLessThan(x('forward', 'shop.events'))
    expect(x('forward', 'shop.shipping')).toBeLessThan(x('forward', 'shop.events'))

    // Semantic direction is kept
    const edges = model.view('index').$view.edges.filter(e => e.kind === 'subscribes')
    expect(edges.map(e => [e.source, e.target, e.dir])).toEqual([
      ['shop.billing', 'shop.events', 'back'],
      ['shop.shipping', 'shop.events', 'back'],
    ])
  })
})
