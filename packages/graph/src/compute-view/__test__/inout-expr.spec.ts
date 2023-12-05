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

  it('include -> customer ->', () => {
    const { nodeIds } = computeView('cloud.backend', [
      $include('*'), // we have cloud.frontend from this
      $include('-> customer ->') // customer will be included
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'cloud.backend',
      'amazon'
    ])

    const { nodeIds: withoutFrontend } = computeView('cloud.backend', [
      $include('*'),
      $exclude('cloud.frontend'), // we exclude cloud.frontend
      $include('-> customer ->') // customer will not be included
    ])
    expect(withoutFrontend).toEqual([
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'cloud.backend',
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
