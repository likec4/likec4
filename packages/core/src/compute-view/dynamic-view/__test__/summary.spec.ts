import { describe, expect, it } from 'vitest'
import { $step, compute } from './fixture'

describe('Summary field in dynamic view', () => {
  it('computed correctly', () => {
    const { nodes: [customer, support] } = compute([
      $step('customer -> support'),
    ])
    expect(customer).toMatchObject({
      id: 'customer',
      description: {
        txt: 'short description', // comes from summary field
      },
    })
    expect(support).toMatchObject({
      id: 'support',
      description: {
        txt: 'description', // comes from description field
      },
    })
  })
})
