import { expect, test } from 'vitest'
import type { Fqn, ViewID } from '../types'
import { fakeModel } from '../__test__'
import { computeElementView } from './compute.element-view'

test('index view', () => {
  const { nodes, edges } = computeElementView(
    {
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

  expect(nodes.map(n => n.id)).toEqual([
    'customer',
    'support',
    'cloud',
    'amazon'
  ])


  expect(edges.map(e => e.id)).toEqual([
    'cloud:amazon',
    'customer:cloud',
    'support:cloud'
  ])
})

test('view of cloud', () => {
  const view = computeElementView(
    {
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

  expect(nodes.map(n => n.id)).toEqual([
    'customer',
    'support',
    'cloud',
    'cloud.frontend',
    'cloud.backend',
    'amazon'
  ])

  expect(edges.map(e => e.id)).toEqual([
    'cloud.frontend:cloud.backend',
    'cloud.backend:amazon',
    'customer:cloud.frontend',
    'support:cloud.frontend',
  ])

  expect(view).toMatchSnapshot()
})

test('view with 3 levels', () => {
  const view = computeElementView(
    {
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
    'customer',
    'support',
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

test('view of amazon', () => {
  const { nodes, edges } = computeElementView(
    {
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

  expect(nodes.map(n => n.id)).toEqual(['cloud', 'cloud.backend', 'amazon', 'amazon.s3'])

  expect(edges.map(e => e.id)).toEqual(['cloud.backend:amazon.s3'])
})

test('index view with applied styles', () => {
  const { nodes } = computeElementView(
    {
      id: 'index' as ViewID,
      rules: [
        {
          isInclude: true,
          exprs: [{ wildcard: true }, { element: 'cloud.backend' as Fqn, isDescedants: false }]
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
      ]
    },
    fakeModel()
  )

  const amazon = nodes.find(n => n.id === 'amazon')!
  const customer = nodes.find(n => n.id === 'customer')!
  const cloud = nodes.find(n => n.id === 'cloud')!
  const backend = nodes.find(n => n.id === 'cloud.backend')!

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
  expect(backend).toMatchObject({
    parent: 'cloud',
    color: 'secondary',
    shape: 'browser'
  })
})
