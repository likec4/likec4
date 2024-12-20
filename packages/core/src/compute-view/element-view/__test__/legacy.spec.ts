import { describe, expect, it } from 'vitest'
import { type ElementKind, type Fqn, type IconUrl, type Tag } from '../../../types'
import { $exclude, $include, computeView } from './fixture'

describe('compute-element-view', () => {
  it('should be empty if no root and no rules', () => {
    const { nodes, edges } = computeView([])
    expect.soft(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('should show only root if no rules', () => {
    const { nodeIds, edges } = computeView('cloud', [])
    expect(nodeIds).toEqual(['cloud'])
    expect(edges).toEqual([])
  })

  it('should return landscape view on top `include *`', () => {
    const { nodes, nodeIds, edgeIds } = computeView([$include('*')])
    expect.soft(nodeIds).toEqual([
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
    const [customer, support, cloud, , amazon] = nodes
    expect.soft(amazon).toMatchObject({
      id: 'amazon',
      outEdges: [],
      inEdges: ['cloud:amazon'],
    })
    expect.soft(cloud).toMatchObject({
      id: 'cloud',
      inEdges: [
        'customer:cloud',
        'support:cloud',
        'email:cloud',
      ],
      outEdges: [
        'cloud:email',
        'cloud:amazon',
      ],
    })
    expect.soft(customer).toMatchObject({
      id: 'customer',
      outEdges: ['customer:cloud'],
      inEdges: [],
    })
    expect.soft(support).toMatchObject({
      id: 'support',
      outEdges: ['support:cloud'],
      inEdges: [],
    })
  })

  // TODO investigate why this test fails
  it.fails('should return nodes in the same order as was in view', () => {
    const { nodeIds, edgeIds } = computeView([$include('email'), $include('*')])
    expect(nodeIds).toEqual([
      'email',
      'customer',
      'support',
      'cloud',
      'amazon',
    ])
    expect(edgeIds).toEqual(['customer:cloud', 'support:cloud', 'cloud:amazon'])
  })

  it('view of cloud', () => {
    const { nodeIds, edgeIds, ...view } = computeView('cloud', [$include('*')])
    expect.soft(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'email',
      'amazon',
    ])

    expect(edgeIds).to.have.same.members([
      'customer:cloud.frontend',
      'support:cloud.frontend',
      'cloud.frontend:cloud.backend',
      'cloud.backend:amazon',
      'cloud.backend:email',
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of cloud.backend', () => {
    const { nodeIds, edgeIds } = computeView('cloud.backend', [
      $include('*'),
      $include('customer'),
    ])

    expect.soft(nodeIds).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend',
      'email',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon',
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.frontend:cloud.backend.graphql',
      'cloud.backend.storage:amazon',
      'cloud.backend:email',
      'customer:cloud.frontend',
    ])
  })

  it('view of cloud.frontend', () => {
    const { nodeIds, edgeIds, ...view } = computeView('cloud.frontend', [$include('*')])
    expect.soft(nodeIds).toEqual([
      'customer',
      'support',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of amazon', () => {
    const { nodeIds, edgeIds } = computeView('amazon', [$include('*')])

    expect(nodeIds).toEqual(['cloud', 'amazon', 'amazon.s3'])
    expect(edgeIds).toEqual(['cloud:amazon.s3'])
  })

  it('view of amazon including cloud.* ->', () => {
    const { edgeIds, nodeIds } = computeView('amazon', [$include('*'), $include('cloud.* ->')])

    expect(nodeIds).toEqual([
      'cloud',
      'cloud.backend',
      'amazon',
      'amazon.s3',
    ])

    expect(edgeIds).to.have.same.members(['cloud.backend:amazon.s3'])
  })

  it('view of cloud.frontend (and include parent cloud)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [$include('*'), $include('cloud')])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
    ])

    expect(edgeIds).to.have.same.members([
      'support:cloud.frontend.adminPanel',
      'customer:cloud.frontend.dashboard',
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
    ])
  })

  it('view of cloud.frontend (and include cloud.backend.*)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [
      $include('*'),
      $include('cloud'),
      $include('cloud.backend.*'),
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
    ])

    expect(edgeIds).toEqual([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
    ])
  })

  it('view of cloud.frontend (and include cloud.frontend -> cloud.backend.*)', () => {
    const { edgeIds, nodeIds } = computeView('cloud.frontend', [
      $include('*'),
      $include('cloud'),
      $include('cloud.frontend -> cloud.backend.*'),
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
    ])

    expect(edgeIds).to.have.same.members([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql',
    ])
  })

  it('view of cloud (exclude cloud, amazon)', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $exclude('cloud'),
      $exclude('email'),
      $exclude('amazon'),
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud.frontend',
      'cloud.backend',
    ])

    expect(edgeIds).toEqual([
      'customer:cloud.frontend',
      'support:cloud.frontend',
      'cloud.frontend:cloud.backend',
    ])
  })

  it('view with 3 levels', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $include('cloud.frontend.*'),
      $include('cloud.backend.*'),
      $include('-> amazon.*'),
      $exclude('amazon'),
      $exclude('email'),
      $exclude('cloud.frontend'),
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon.s3',
    ])

    expect(edgeIds).toEqual([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.backend.storage:amazon.s3',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
    ])
  })

  it('view with 3 levels (with only relevant elements)', () => {
    const { edgeIds, nodeIds } = computeView('cloud', [
      $include('*'),
      $include('-> cloud.frontend.*'),
      $include('-> cloud.backend.*'),
    ])

    expect(nodeIds).toEqual([
      'customer',
      'support',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.frontend.adminPanel',
      'cloud.backend',
      'email',
      'amazon',
      'cloud.backend.graphql',
    ])

    expect(edgeIds).toEqual([
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend.adminPanel:cloud.backend.graphql',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'cloud.backend:email',
      'cloud.backend:amazon',
    ])
  })

  it('index view with applied styles', () => {
    const { nodes } = computeView([
      $include('customer'),
      $include('amazon'),
      $include('cloud'),
      $include('cloud.frontend.dashboard'),
      // all elements
      // color: secondary
      {
        targets: [{ wildcard: true }],
        style: {
          color: 'secondary',
          icon: 'none',
          shape: 'storage',
        },
      },
      // cloud
      // color: muted
      {
        targets: [{ element: 'cloud' as Fqn }],
        style: {
          color: 'muted',
          icon: 'http://some-icon' as IconUrl,
        },
      },
      // cloud.*
      // shape: browser
      {
        targets: [{ element: 'cloud' as Fqn, isChildren: true }],
        style: {
          shape: 'browser',
        },
      },
    ])

    const amazon = nodes.find(n => n.id === 'amazon')!
    const customer = nodes.find(n => n.id === 'customer')!
    const cloud = nodes.find(n => n.id === 'cloud')!
    const frontend = nodes.find(n => n.id === 'cloud.frontend.dashboard')!

    expect(amazon).toMatchObject({
      color: 'secondary',
      shape: 'storage',
    })
    expect(amazon).not.toHaveProperty('icon')
    expect(customer).toMatchObject({
      color: 'secondary',
      shape: 'storage',
    })
    expect(customer).not.toHaveProperty('icon')

    expect(cloud).toMatchObject({
      color: 'muted',
      shape: 'storage',
      icon: 'http://some-icon',
    })
    expect(frontend).toMatchObject({
      parent: 'cloud',
      color: 'secondary',
      shape: 'browser',
    })
    expect(frontend).not.toHaveProperty('icon')
  })

  it('should include by element kind', () => {
    const { nodeIds, edgeIds } = computeView({
      include: [
        {
          elementKind: 'system' as ElementKind,
          isEqual: true,
        },
      ],
    })

    expect(nodeIds).toEqual([
      'cloud',
      'email',
      'amazon',
    ])
    expect(edgeIds).toEqual([
      'cloud:email',
      'cloud:amazon',
      'email:cloud',
    ])
  })

  it('should include by element tag', () => {
    const { nodeIds, edgeIds } = computeView({
      include: [
        {
          elementTag: 'old' as Tag,
          isEqual: true,
        },
      ],
    })

    expect(nodeIds).toEqual(['cloud', 'cloud.backend.storage', 'cloud.frontend.adminPanel'])

    expect(edgeIds).toEqual([])
  })

  it('should exclude by element kind', () => {
    const { nodeIds, edgeIds } = computeView('cloud.frontend', [
      $include('*'),
      {
        exclude: [
          {
            elementKind: 'actor' as ElementKind,
            isEqual: true,
          },
        ],
      },
    ])

    expect(nodeIds).toEqual([
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
    ])

    expect(edgeIds).toEqual([
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
    ])
  })

  it('should exclude by element tag', () => {
    const { nodeIds, edgeIds } = computeView('cloud.backend', [
      $include('*'),
      {
        exclude: [
          {
            elementTag: 'old' as Tag,
            isEqual: true,
          },
        ],
      },
    ])

    expect(nodeIds).toEqual([
      'cloud.frontend',
      'cloud.backend',
      'email',
      'cloud.backend.graphql',
    ])

    expect(edgeIds).to.have.same.members([
      'cloud.frontend:cloud.backend.graphql',
      'cloud.backend:email',
    ])
  })
})
