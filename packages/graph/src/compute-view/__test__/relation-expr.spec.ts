import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('relation-expr', () => {
  it('should be empty if no relations', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer -> support')])
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })

  it('* -> *', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> *')])
    expect(nodeIds).toEqual(['customer', 'support', 'cloud', 'amazon'])
    expect(edgeIds).toEqual(['customer:cloud', 'support:cloud', 'cloud:amazon'])
  })

  it('* -> cloud.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> cloud.*')])
    expect(nodeIds).toEqual(['customer', 'support', 'cloud.frontend'])
    expect(edgeIds).toEqual(['customer:cloud.frontend', 'support:cloud.frontend'])
  })

  it('* -> amazon.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> amazon.*')])
    expect(nodeIds).toEqual(['cloud', 'amazon.s3'])
    expect(edgeIds).toEqual(['cloud:amazon.s3'])
  })

  it('support -> cloud', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer -> cloud')])
    expect(nodeIds).toEqual(['customer', 'cloud'])
    expect(edgeIds).toEqual(['customer:cloud'])
  })

  it('customer -> cloud.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer -> cloud.*')])
    expect(nodeIds).toEqual(['customer', 'cloud.frontend'])
    expect(edgeIds).toEqual(['customer:cloud.frontend'])
  })

  it('cloud.* -> amazon.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('cloud.* -> amazon.*')])
    expect(nodeIds).toEqual(['cloud.backend', 'amazon.s3'])
    expect(edgeIds).toEqual(['cloud.backend:amazon.s3'])
  })

  it('* -> cloud.frontend.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> cloud.frontend.*')])
    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend.dashboard',
      'support',
      'cloud.frontend.adminPanel'
    ])
    expect(edgeIds).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel'
    ])
  })

  it('* -> cloud.frontend.*, exclude support', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('* -> cloud.frontend.*'),
      $exclude('support')
    ])
    expect(nodeIds).toEqual(['customer', 'cloud.frontend.dashboard'])
    expect(edgeIds).to.have.same.members(['customer:cloud.frontend.dashboard'])
  })

  it('* -> cloud.frontend.*, exclude support -> *', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('* -> cloud.frontend.*'),
      $exclude('support -> *')
    ])
    expect(nodeIds).toEqual(['customer', 'cloud.frontend.dashboard'])
    expect(edgeIds).toEqual(['customer:cloud.frontend.dashboard'])
  })

  it.todo('verify label [...]')
})
