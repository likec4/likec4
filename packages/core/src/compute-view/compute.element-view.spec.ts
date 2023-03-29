import { expect, test } from 'vitest'
import type { Fqn, ViewID } from '../types'
import { fakeModel } from '../__mocks__'
import { computeElementView } from './compute.element-view'

test('index view', () => {
  const { nodes, edges } = computeElementView({
    id: 'index' as ViewID,
    title: '',
    rules: [{
      isInclude: true,
      exprs: [{
        wildcard: true,
      }]
    }]
  }, fakeModel())

  expect(nodes.map(n => n.id)).toEqual([
    'amazon',
    'cloud',
    'customer',
    'support',
  ])

  expect(edges.map(e => e.id)).toEqual([
    'support:cloud',
    'customer:cloud',
    'cloud:amazon'
  ])

})


test('view of cloud', () => {
  const { nodes, edges } = computeElementView({
    id: 'cloud' as ViewID,
    title: '',
    viewOf: 'cloud' as Fqn,
    rules: [{
      isInclude: true,
      exprs: [{
        wildcard: true,
      }]
    }]
  }, fakeModel())

  expect(nodes.map(n => n.id)).toEqual([
    'amazon',
    'cloud',
    'customer',
    'support',
    'cloud.backend',
    'cloud.frontend'
  ])

  expect(edges.map(e => e.id)).toEqual([
    'cloud.frontend:cloud.backend',
    'cloud.backend:amazon',
    'support:cloud.frontend',
    'customer:cloud.frontend',
  ])
})

test('view of amazon', () => {
  const { nodes, edges } = computeElementView({
    id: 'amazon' as ViewID,
    title: '',
    viewOf: 'amazon' as Fqn,
    rules: [{
      isInclude: true,
      exprs: [
        // include *
        { wildcard: true, },
        // include cloud
        { element: 'cloud' as Fqn, isDescedants: false },
        // include cloud.* -> amazon
        {
          source: { element: 'cloud' as Fqn, isDescedants: true },
          target: { element: 'amazon' as Fqn, isDescedants: false }
        },
      ]
    }]
  }, fakeModel())

  expect(nodes.map(n => n.id)).toEqual([
    'amazon',
    'cloud',
    'amazon.s3',
    'cloud.backend',
  ])

  expect(edges.map(e => e.id)).toEqual([
    'cloud.backend:amazon.s3',
  ])
})
