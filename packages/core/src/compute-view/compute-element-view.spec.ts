import { describe, expect, it } from 'vitest'
import { fakeModel, type FakeElementIds } from '../__test__'
import type { ComputedView, ElementKind, Fqn, Tag, ViewID, ViewRule } from '../types'
import { computeElementView } from './compute-element-view'
import { pluck } from 'rambdax'

const ids = pluck('id')

const emptyView = {
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: []
}

describe('compute-element-view', () => {
  function computeView(...args: [FakeElementIds, ViewRule[]] | [ViewRule[]]) {
    let result: ComputedView
    if (args.length === 1) {
      result = computeElementView(
        {
          ...emptyView,
          id: 'index' as ViewID,
          title: '',
          rules: args[0]
        },
        fakeModel()
      )
    } else {
      result = computeElementView(
        {
          ...emptyView,
          id: 'index' as ViewID,
          title: '',
          viewOf: args[0] as Fqn,
          rules: args[1]
        },
        fakeModel()
      )
    }
    return Object.assign(result, {
      nodeIds: ids(result.nodes),
      edgeIds: ids(result.edges)
    })
  }

  it('should be empty if no root and no rules', () => {
    const { nodes, edges } = computeElementView(
      {
        ...emptyView,
        id: 'index' as ViewID
      },
      fakeModel()
    )
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('should show only root if no rules', () => {
    const { nodes, edges } = computeElementView(
      {
        ...emptyView,
        id: 'index' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: []
      },
      fakeModel()
    )

    expect(ids(nodes)).toEqual(['cloud'])

    expect(edges).toEqual([])
  })

  it('should return landscape view on top `include *`', () => {
    const { nodes, edges } = computeElementView(
      {
        ...emptyView,
        id: 'index' as ViewID,
        title: '',
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    expect(ids(nodes)).toEqual(['support', 'customer', 'cloud', 'amazon'])
    expect(ids(edges)).to.have.members(['cloud:amazon', 'customer:cloud', 'support:cloud'])
  })

  it('should return landscape view on top `include *, -> cloud.*`', () => {
    const { nodes, edges } = computeElementView(
      {
        ...emptyView,
        id: 'index' as ViewID,
        title: '',
        rules: [
          {
            isInclude: true,
            exprs: [
              { wildcard: true },
              {
                incoming: {
                  element: 'cloud' as Fqn,
                  isDescedants: true
                }
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    expect(ids(nodes)).toEqual(['support', 'customer', 'cloud', 'amazon', 'cloud.frontend'])
    expect(ids(edges)).to.have.same.members([
      'cloud:amazon',
      'customer:cloud.frontend',
      'support:cloud.frontend'
    ])
  })

  it('view of cloud', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloud' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    const { nodes, edges } = view

    expect(ids(nodes)).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'amazon'
    ])

    expect(ids(edges)).to.have.same.members([
      'cloud.frontend:cloud.backend',
      'cloud.backend:amazon',
      'customer:cloud.frontend',
      'support:cloud.frontend'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of cloud.backend', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloudbackend' as ViewID,
        title: '',
        viewOf: 'cloud.backend' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              },
              {
                element: 'customer' as Fqn,
                isDescedants: false
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    const { nodes, edges } = view

    expect(ids(nodes)).toEqual([
      'customer',
      'cloud.frontend',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])

    expect(ids(edges)).to.have.same.members([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.backend.storage:amazon',
      'cloud.frontend:cloud.backend.graphql',
      'customer:cloud.frontend'
    ])
  })

  it('view of cloud.frontend', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloudfrontend' as ViewID,
        title: '',
        viewOf: 'cloud.frontend' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    const { nodes, edges } = view

    expect(ids(nodes)).toEqual([
      'support',
      'customer',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend'
    ])

    expect(ids(edges)).to.have.same.members([
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of cloud.frontend (and include parent cloud)', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloudfrontend2' as ViewID,
        title: '',
        viewOf: 'cloud.frontend' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              },
              // including parent cloud should not remove implicit cloud.backend
              {
                element: 'cloud' as Fqn,
                isDescedants: false
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    const { nodes, edges } = view

    expect(ids(nodes)).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend'
    ])

    expect(ids(edges)).to.have.same.members([
      'cloud.frontend.adminPanel:cloud.backend',
      'cloud.frontend.dashboard:cloud.backend',
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel'
    ])
  })

  it('view of cloud (exclude cloud, amazon.*)', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloud' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              }
            ]
          },
          {
            isInclude: false,
            exprs: [
              { element: 'cloud' as Fqn, isDescedants: false },
              { element: 'amazon' as Fqn, isDescedants: true }
            ]
          }
        ]
      },
      fakeModel()
    )
    const { nodes, edges } = view

    expect(ids(nodes)).toEqual(['support', 'customer', 'cloud.frontend', 'cloud.backend'])

    expect(ids(edges)).to.have.same.members([
      'cloud.frontend:cloud.backend',
      'customer:cloud.frontend',
      'support:cloud.frontend'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view with 3 levels', () => {
    const view = computeElementView(
      {
        ...emptyView,
        id: 'cloud3levels' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              // include *
              { wildcard: true },
              // include cloud.frontend.*
              { element: 'cloud.frontend' as Fqn, isDescedants: true },
              // include cloud.backend.*
              { element: 'cloud.backend' as Fqn, isDescedants: true }
            ]
          },
          {
            isInclude: false,
            exprs: [
              // exclude cloud.frontend
              { element: 'cloud.frontend' as Fqn, isDescedants: false }
            ]
          }
        ]
      },
      fakeModel()
    )

    expect(view.nodes.map(n => n.id)).toEqual([
      'support',
      'customer',
      'cloud',
      'cloud.frontend.adminPanel',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'cloud.backend.graphql',
      'cloud.backend.storage',
      'amazon'
    ])

    expect(view).toMatchSnapshot()
  })

  it('view of amazon', () => {
    const { nodes, edges } = computeElementView(
      {
        ...emptyView,
        id: 'amazon' as ViewID,
        title: '',
        viewOf: 'amazon' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              // include *
              { wildcard: true },
              // include cloud
              { element: 'cloud' as Fqn, isDescedants: false },
              // include cloud.* -> amazon
              {
                source: { element: 'cloud' as Fqn, isDescedants: true },
                target: { element: 'amazon' as Fqn, isDescedants: false }
              }
            ]
          }
        ]
      },
      fakeModel()
    )

    expect(ids(nodes)).toEqual(['cloud', 'cloud.backend', 'amazon', 'amazon.s3'])

    expect(ids(edges)).to.have.same.members(['cloud.backend:amazon.s3'])
  })

  it('index view with applied styles', () => {
    const { nodes } = computeView([
      {
        isInclude: true,
        exprs: [{ wildcard: true }, { element: 'cloud.frontend' as Fqn, isDescedants: false }]
      },
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
        targets: [{ element: 'cloud' as Fqn, isDescedants: false }],
        style: {
          color: 'muted'
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
    expect(customer).toMatchObject({
      color: 'secondary',
      shape: 'storage'
    })

    expect(cloud).toMatchObject({
      color: 'muted',
      shape: 'storage'
    })
    expect(frontend).toMatchObject({
      parent: 'cloud',
      color: 'secondary',
      shape: 'browser'
    })
  })

  it('should include by element kind', () => {
    const { nodeIds, edgeIds } = computeView([
      {
        isInclude: true,
        exprs: [
          {
            elementKind: 'system' as ElementKind,
            isEqual: true
          }
        ]
      }
    ])

    expect(nodeIds).toEqual(['cloud', 'amazon'])
    expect(edgeIds).toEqual(['cloud:amazon'])
  })

  it('should include by element tag', () => {
    const { nodeIds, edgeIds } = computeView([
      {
        isInclude: true,
        exprs: [
          {
            elementTag: 'old' as Tag,
            isEqual: true
          }
        ]
      }
    ])

    expect(nodeIds).toEqual(['cloud.backend.storage', 'cloud.frontend.adminPanel'])

    expect(edgeIds).toEqual([])
  })

  it('should exclude by element tag and kind', () => {
    const { nodes, edges } = computeView('cloud', [
      {
        isInclude: true,
        exprs: [
          // include *
          { wildcard: true },
          // include cloud.backend.*
          { element: 'cloud.backend' as Fqn, isDescedants: true },
          // include cloud.frontend.*
          { element: 'cloud.frontend' as Fqn, isDescedants: true }
        ]
      },
      {
        isInclude: false,
        exprs: [
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

    expect(ids(nodes)).toEqual([
      'cloud',
      'cloud.frontend',
      'cloud.frontend.dashboard',
      'cloud.backend',
      'amazon',
      'cloud.backend.graphql'
    ])

    expect(ids(edges)).to.have.same.members([
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend:cloud.backend.graphql',
      'cloud.backend:amazon'
    ])
  })
})
