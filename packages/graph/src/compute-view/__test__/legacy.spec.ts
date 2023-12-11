import { type ElementKind, type Fqn, type IconUrl, type Tag } from '@likec4/core'
import { view } from 'rambdax'
import { describe, expect, it } from 'vitest'
import { $exclude, $include, computeView } from './fixture'

describe('compute-element-view', () => {
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

  it('should return landscape view on top `include *`', () => {
    const { nodes, nodeIds, edgeIds } = computeView([{ include: [{ wildcard: true }] }])
    expect(nodeIds).toEqual(['customer', 'support', 'cloud', 'amazon'])
    expect(edgeIds).toEqual(['customer:cloud', 'support:cloud', 'cloud:amazon'])
    const [customer, support, cloud, amazon] = nodes
    expect(amazon).toMatchObject({
      outEdges: [],
      inEdges: ['cloud:amazon']
    })
    expect(cloud).toMatchObject({
      outEdges: ['cloud:amazon'],
      inEdges: expect.arrayContaining(['support:cloud', 'customer:cloud'])
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
    const { nodeIds, edgeIds } = computeView([$include('customer'), $include('*')])
    expect(nodeIds).toEqual(['customer', 'support', 'cloud', 'amazon'])
    expect(edgeIds).toEqual(['customer:cloud', 'support:cloud', 'cloud:amazon'])
  })

  it('view of cloud', () => {
    const { nodeIds, edgeIds, ...view } = computeView('cloud', [$include('*')])
    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'amazon'
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.frontend:cloud.backend',
      'cloud.backend:amazon',
      'customer:cloud.frontend',
      'support:cloud.frontend'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of cloud.backend', () => {
    const { nodeIds, edgeIds } = computeView('cloud.backend', [$include('*'), $include('customer')])

    expect(nodeIds).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.backend.storage:amazon',
      'cloud.frontend:cloud.backend.graphql',
      'customer:cloud.frontend'
    ])
  })

  it('view of cloud.frontend', () => {
    const { nodeIds, edgeIds } = computeView('cloud.frontend', [$include('*')])
    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend'
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of amazon', () => {
    const { nodeIds, edgeIds } = computeView('amazon', [$include('*')])

    expect(nodeIds).toEqual(['cloud', 'amazon', 'amazon.s3'])
    expect(edgeIds).toEqual(['cloud:amazon.s3'])
  })

  it('view of cloud.frontend (and include parent cloud)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [$include('*'), $include('cloud')])

    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend'
    ])

    expect(edgeIds).to.have.same.members([
      'support:cloud.frontend.adminPanel',
      'customer:cloud.frontend.dashboard',
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend'
    ])
  })

  it('view of cloud.frontend (and include cloud.backend.*)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [
      $include('*'),
      $include('cloud'),
      $include('cloud.backend.*')
    ])

    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql',
      'cloud.backend.storage'
    ])

    expect(edgeIds).toEqual([
      'support:cloud.frontend.adminPanel',
      'customer:cloud.frontend.dashboard',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.backend.graphql:cloud.backend.storage'
    ])
  })

  it('view of cloud.frontend (and include cloud.frontend -> cloud.backend.*)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [
      $include('*'),
      $include('cloud'),
      $include('cloud.frontend -> cloud.backend.*')
    ])

    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend.graphql'
    ])

    expect(edgeIds).to.have.same.members([
      'support:cloud.frontend.adminPanel',
      'customer:cloud.frontend.dashboard',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql'
    ])
  })

  it('view of cloud (exclude cloud, amazon)', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $exclude('cloud'),
      $exclude('amazon')
    ])

    expect(nodeIds).toEqual(['customer', 'support', 'cloud.frontend', 'cloud.backend'])

    expect(edgeIds).toEqual([
      'customer:cloud.frontend',
      'support:cloud.frontend',
      'cloud.frontend:cloud.backend'
    ])
  })

  it('view with 3 levels', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $include('cloud.frontend.*'),
      $include('cloud.backend.*'),
      $include('-> amazon.*'),
      $exclude('amazon'),
      $exclude('cloud.frontend')
    ])

    expect(nodeIds).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon.s3'
    ])

    expect(edgeIds).toEqual([
      'support:cloud.frontend.adminPanel',
      'customer:cloud.frontend.dashboard',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.backend.storage:amazon.s3'
    ])
  })

  it('view with 3 levels (with only relevant elements)', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $include('-> cloud.frontend.*'),
      $include('-> cloud.backend.*')
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.frontend.adminPanel',
      'cloud.backend',
      'amazon',
      'cloud.backend.graphql'
    ])

    expect(edgeIds).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.backend:amazon'
    ])
  })

  it('view of amazon', () => {
    const { edgeIds, nodeIds } = computeView('amazon', [$include('*'), $include('cloud.* ->')])

    expect(nodeIds).toEqual(['cloud.backend', 'amazon', 'amazon.s3'])

    expect(edgeIds).to.have.same.members(['cloud.backend:amazon.s3'])
  })

  it('index view with applied styles', () => {
    const { nodes } = computeView([
      $include('customer'),
      $include('amazon'),
      $include('cloud'),
      $include('cloud.frontend'),
      // all elements
      // color: secondary
      {
        targets: [{ wildcard: true }],
        style: {
          color: 'secondary',
          shape: 'storage'
        }
      },
      // cloud
      // color: muted
      {
        targets: [{ element: 'cloud' as Fqn }],
        style: {
          color: 'muted',
          icon: 'http://some-icon' as IconUrl
        }
      },
      // cloud.*
      // shape: browser
      {
        targets: [{ element: 'cloud' as Fqn, isDescedants: true }],
        style: {
          shape: 'browser'
        }
      }
    ])

    const amazon = nodes.find(n => n.id === 'amazon')!
    const customer = nodes.find(n => n.id === 'customer')!
    const cloud = nodes.find(n => n.id === 'cloud')!
    const frontend = nodes.find(n => n.id === 'cloud.frontend')!

    expect(amazon).toMatchObject({
      color: 'secondary',
      shape: 'storage'
    })
    expect(amazon).not.toHaveProperty('icon')
    expect(customer).toMatchObject({
      color: 'secondary',
      shape: 'storage'
    })
    expect(customer).not.toHaveProperty('icon')

    expect(cloud).toMatchObject({
      color: 'muted',
      shape: 'storage',
      icon: 'http://some-icon'
    })
    expect(frontend).toMatchObject({
      parent: 'cloud',
      color: 'secondary',
      shape: 'browser'
    })
    expect(frontend).not.toHaveProperty('icon')
  })

  it('should include by element kind', () => {
    const { nodeIds, edgeIds } = computeView({
      include: [
        {
          elementKind: 'system' as ElementKind,
          isEqual: true
        }
      ]
    })

    expect(nodeIds).toEqual(['cloud', 'amazon'])
    expect(edgeIds).toEqual(['cloud:amazon'])
  })

  it('should include by element tag', () => {
    const { nodeIds, edgeIds } = computeView({
      include: [
        {
          elementTag: 'old' as Tag,
          isEqual: true
        }
      ]
    })

    expect(nodeIds).toEqual(['cloud.backend.storage', 'cloud.frontend.adminPanel'])

    expect(edgeIds).toEqual([])
  })

  it('should exclude by element tag and kind', () => {
    const { nodeIds, edgeIds } = computeView('cloud', [
      $include('*'),
      $include('cloud.backend.*'),
      $include('cloud.frontend.*'),
      {
        exclude: [
          {
            elementKind: 'actor' as ElementKind,
            isEqual: true
          },
          {
            elementTag: 'old' as Tag,
            isEqual: true
          }
        ]
      }
    ])

    expect(nodeIds).toEqual([
      'cloud',
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
      'amazon'
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.backend:amazon'
    ])
  })
})
