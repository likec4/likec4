import { pick } from 'remeda'
import { describe, expect, it } from 'vitest'
import { $exclude, $include, $participant, $where, computeView } from './fixture'

describe('relation-expr', () => {
  it('should be empty if no relations', () => {
    const { nodeIds, edgeIds } = computeView([$include('customer -> support')])
    expect(nodeIds).toEqual([])
    expect(edgeIds).toEqual([])
  })

  it('* -> *', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> *')])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'email',
      'amazon',
    ])
    expect(edgeIds).toEqual([
      'customer:cloud',
      'support:cloud',
      'cloud:email',
      'cloud:amazon',
      'email:cloud',
    ])
  })

  it('* -> * where', () => {
    const test1 = computeView([
      $include('* -> *', {
        where: {
          or: [
            { tag: { eq: 'next' } },
            { tag: { eq: 'aws' } },
            { tag: { eq: 'storage' } },
          ],
        },
      }),
    ])
    expect(pick(test1, ['edgeIds', 'nodeIds'])).toEqual({
      'edgeIds': [
        'cloud.backend.storage:amazon.s3',
        'cloud.backend.graphql:cloud.backend.storage',
        'cloud.frontend.dashboard:cloud.backend.graphql',
      ],
      'nodeIds': [
        'cloud',
        'cloud.frontend.dashboard',
        'cloud.backend.graphql',
        'cloud.backend.storage',
        'amazon',
        'amazon.s3',
      ],
    })

    const test2 = computeView([
      $include('* -> *', {
        where: {
          or: [
            { tag: { eq: 'next' } },
            { tag: { eq: 'aws' } },
            { tag: { eq: 'storage' } },
          ],
        },
      }),
      $exclude('* -> *', {
        tag: { eq: 'storage' },
      }),
    ])
    expect(pick(test2, ['edgeIds', 'nodeIds'])).toEqual({
      'edgeIds': [
        'cloud.frontend.dashboard:cloud.backend.graphql',
        'cloud:amazon',
      ],
      'nodeIds': [
        'cloud',
        'cloud.frontend.dashboard',
        'amazon',
        'cloud.backend.graphql',
      ],
    })
  })

  it('* -> cloud.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> cloud.*')])
    expect(nodeIds).toEqual(['customer', 'support', 'cloud.frontend'])
    expect(edgeIds).toEqual(['customer:cloud.frontend', 'support:cloud.frontend'])
  })

  it('* -> cloud.backend.*', () => {
    const { nodeIds, edgeIds } = computeView([$include('* -> cloud.backend.*')])
    expect(nodeIds).toEqual(['cloud.frontend', 'cloud.backend.graphql'])
    expect(edgeIds).toEqual(['cloud.frontend:cloud.backend.graphql'])
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
      'support',
      'cloud.frontend.dashboard',
      'cloud.frontend.supportPanel',
    ])
    expect(edgeIds).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.supportPanel',
    ])
  })

  it('* -> cloud.frontend.*, exclude support', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('* -> cloud.frontend.*'),
      $exclude('support'),
    ])
    expect(nodeIds).toEqual(['customer', 'cloud.frontend.dashboard'])
    expect(edgeIds).to.have.same.members(['customer:cloud.frontend.dashboard'])
  })

  it('* -> cloud.frontend.*, exclude support -> *', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('* -> cloud.frontend.*'),
      $exclude('support -> *'),
    ])
    expect(nodeIds).toEqual(['customer', 'cloud.frontend.dashboard'])
    expect(edgeIds).toEqual(['customer:cloud.frontend.dashboard'])
  })

  it('cloud -> email', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('cloud -> email'),
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'email',
    ])
    expect(edgeIds).toEqual([
      'cloud:email',
    ])
  })

  it('cloud <-> email', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('cloud <-> email'),
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'email',
    ])
    expect(edgeIds).toEqual([
      'cloud:email',
      'email:cloud',
    ])
  })

  it('includes by matching participant predicate', () => {
    const { nodeIds, edgeIds } = computeView([
      $include($where('cloud -> email', $participant('source', { tag: { eq: 'next' } }))),
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'email',
    ])
    expect(edgeIds).toEqual([
      'cloud:email',
    ])
  })

  it('does not include if participant predicate does not match', () => {
    const { nodeIds, edgeIds } = computeView([
      $include($where('cloud -> email', $participant('source', { tag: { eq: 'aws' } }))),
    ])
    expect(nodeIds.length).toEqual(0)
    expect(edgeIds.length).toEqual(0)
  })
})
