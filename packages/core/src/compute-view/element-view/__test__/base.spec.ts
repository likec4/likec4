import { describe, expect, it } from 'vitest'
import { $include, computeViewV2 as computeView } from './fixture'

describe('base', () => {
  it('should be empty if no root and no rules', () => {
    const { nodes, edges } = computeView([])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('should show only root if no rules', () => {
    const { nodeIds, edges } = computeView('cloud', [])
    expect(nodeIds).toEqual(['cloud'])
    expect(edges).toEqual([])
  })

  it('should show root elements for `include *`', () => {
    const { nodes, nodeIds, edgeIds } = computeView([$include('*')])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'email',
      'amazon'
    ])
    const [customer, support, cloud, email, amazon] = nodes

    expect(edgeIds).toEqual([
      'customer:cloud',
      'support:cloud',
      'cloud:email',
      'cloud:amazon',
      'email:cloud'
    ])

    expect(amazon).toMatchObject({
      outEdges: [],
      inEdges: ['cloud:amazon']
    })
    expect(cloud).toMatchObject({
      outEdges: [
        'cloud:email',
        'cloud:amazon'
      ],
      inEdges: [
        'customer:cloud',
        'support:cloud',
        'email:cloud'
      ]
    })
    expect(email).toMatchObject({
      outEdges: ['email:cloud'],
      inEdges: ['cloud:email']
    })
    expect(customer).toMatchObject({
      outEdges: ['customer:cloud'],
      inEdges: []
    })
    expect(support).toMatchObject({
      outEdges: ['support:cloud'],
      inEdges: []
    })
  })

  it('should return nodes in the same order as was in view', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('support'),
      $include('customer'),
      $include('*')
    ])
    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud',
      'email',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'support:cloud',
      'customer:cloud',
      'cloud:email',
      'cloud:amazon',
      'email:cloud'
    ])
  })

  it('should include elements without relations', () => {
    const { nodeIds, edgeIds } = computeView([$include('cloud.frontend'), $include('amazon.s3')])
    expect(nodeIds).toEqual(['cloud.frontend', 'amazon.s3'])
    expect(edgeIds).toEqual([])
  })
})
