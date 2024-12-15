import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeViewV2 as computeView } from './fixture'

describe('inout-expr', () => {
  it('include -> * ->', () => {
    const { nodeIds } = computeView([
      $include('-> * ->')
    ])
    expect(nodeIds).toEqual([])
  })

  it('include -> * -> (scoped)', () => {
    const { nodeIds, edgeIds } = computeView('cloud.backend', [
      $include('-> * ->')
    ])
    expect(nodeIds).toEqual([
      'cloud.frontend',
      'cloud.backend',
      'email',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'cloud.backend:email',
      'cloud.backend:amazon',
      'cloud.frontend:cloud.backend'
    ])
  })

  it('-> cloud.backend.* ->', () => {
    const { nodeIds, edgeIds } = computeView([$include('-> cloud.backend.* ->')])
    expect(nodeIds).toEqual([
      'cloud.frontend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.backend.storage:amazon',
      'cloud.frontend:cloud.backend.graphql'
    ])
  })

  it('exclude -> cloud ->', () => {
    const { nodeIds } = computeView('cloud', [
      $include('*'),
      $exclude('-> cloud ->')
    ])
    expect(nodeIds).toEqual([
      'cloud.frontend',
      'cloud.backend'
    ])
  })

  it('exclude -> cloud.* ->', () => {
    const { nodeIds, edgeIds } = computeView('cloud.backend', [
      $include('*'),
      // exclude incoming and outgoing edges of cloud
      // exclude cloud.frontend -> cloud.backend
      $exclude('-> cloud.* ->')
    ])
    expect(nodeIds).toEqual([
      'cloud.backend.graphql',
      'cloud.backend.storage'
    ])
    expect(edgeIds).toEqual([
      'cloud.backend.graphql:cloud.backend.storage'
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
      'cloud.backend',
      'email',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])

    const { nodeIds: withoutFrontend } = computeView('cloud.backend', [
      $include('*'),
      $exclude('cloud.frontend'), // we exclude cloud.frontend
      $include('-> customer ->') // customer will not be included
    ])
    expect(withoutFrontend).toEqual([
      'cloud.backend',
      'email',
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
      'cloud.backend',
      'email',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])
  })
})
