import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('inout-expr', () => {
  it('-> cloud.backend.* ->', () => {
    const { nodeIds } = computeView([$include('-> cloud.backend.* ->')])
    expect(nodeIds).toEqual([
      'cloud.backend.storage',
      'amazon',
      'cloud.frontend',
      'cloud.backend.graphql'
    ])
  })

  // Because we have cloud.frontend, customer will be included
  it('include -> customer ->', () => {
    const { nodeIds } = computeView('cloud.backend.storage', [
      $include('*'),
      $include('-> customer ->')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])
  })

  // Because we excluded cloud.frontend
  it('ignore -> customer ->', () => {
    const { nodeIds } = computeView('cloud.backend', [
      $include('*'),
      $include('-> customer ->'),
      $exclude('cloud.frontend')
    ])
    expect(nodeIds).toEqual([
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'cloud.backend',
      'amazon'
    ])
  })
})
