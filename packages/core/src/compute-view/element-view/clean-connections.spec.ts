import { only, values } from 'remeda'
import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import { invariant } from '../../errors'
import { LikeC4Model } from '../../model'
import { findConnectionsWithin } from '../../model/connection/model'
import { isElementView } from '../../types'
import { withReadableEdges } from '../utils/with-readable-edges'
import { TestHelper } from './__test__/TestHelper'
import { cleanRedundantRelationships, findRedundantConnections } from './clean-connections'
import { computeElementView } from './compute'

const builder = Builder.specification({
  elements: {
    el: {},
  },
})

function compute(buider: Builder<any>) {
  const { views, ...model } = buider.build()
  const likec4model = LikeC4Model.create({ ...model, views: {} })
  const view = only(values(views))
  invariant(view && isElementView(view), 'Must have one element view')
  return withReadableEdges(computeElementView(likec4model, view))
}

describe('Redundant relationships', () => {
  it('correctly find and exclude redundant', () => {
    const t = TestHelper.from(builder
      .model(({ el, rel }, m) =>
        m(
          el('cloud'),
          el('cloud.backend'),
          el('cloud.backend.service'),
          el('amazon'),
          el('amazon.rds'),
          rel('cloud.backend', 'amazon'), // this will be redundant, because of nested
          rel('cloud.backend.service', 'amazon.rds'),
        )
      ))
    const connections = findConnectionsWithin(t.model.elements())
    t.expect(connections).toEqual({
      'cloud -> amazon': [
        'cloud.backend -> amazon',
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend -> amazon': [
        'cloud.backend -> amazon',
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend.service -> amazon': [
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend.service -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
    })
    t.expect(findRedundantConnections(connections)).toEqual({
      'cloud -> amazon': [
        'cloud.backend -> amazon',
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend -> amazon': [
        'cloud.backend -> amazon',
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
      'cloud.backend.service -> amazon': [
        'cloud.backend.service -> amazon.rds',
      ],
    })
    t.expect(cleanRedundantRelationships(connections)).toEqual({
      'cloud.backend.service -> amazon.rds': [
        'cloud.backend.service -> amazon.rds',
      ],
    })
  })

  it('correctly find and exclude redundant (and direct)', () => {
    const t = TestHelper.from(builder
      .model(({ el, rel }, m) =>
        m(
          el('cloud'),
          el('cloud.backend1'),
          el('cloud.backend2'),
          el('amazon'),
          el('amazon.rds1'),
          el('amazon.rds2'),
          rel('cloud.backend1', 'amazon'),
          rel('cloud.backend1', 'amazon.rds1'),
          rel('cloud.backend2', 'amazon.rds2'),
        )
      ))
    let connections = findConnectionsWithin(t.model.elements())
    t.expect(connections).toEqual(
      'cloud -> amazon',
      'cloud -> amazon.rds1',
      'cloud -> amazon.rds2',
      'cloud.backend1 -> amazon',
      'cloud.backend1 -> amazon.rds1',
      'cloud.backend2 -> amazon',
      'cloud.backend2 -> amazon.rds2',
    )
    t.expect(findRedundantConnections(connections)).toEqual({
      'cloud -> amazon': [
        'cloud.backend1 -> amazon',
        'cloud.backend1 -> amazon.rds1',
        'cloud.backend2 -> amazon.rds2',
      ],
      'cloud -> amazon.rds1': [
        'cloud.backend1 -> amazon.rds1',
      ],
      'cloud -> amazon.rds2': [
        'cloud.backend2 -> amazon.rds2',
      ],
      'cloud.backend1 -> amazon': [
        'cloud.backend1 -> amazon',
        'cloud.backend1 -> amazon.rds1',
      ],
      'cloud.backend2 -> amazon': [
        'cloud.backend2 -> amazon.rds2',
      ],
    })
    t.expect(cleanRedundantRelationships(connections)).toEqual(
      'cloud.backend1 -> amazon.rds1',
      'cloud.backend2 -> amazon.rds2',
    )

    // Exlude where source is cloud.backend1
    connections = connections.filter(c => c.source.id != 'cloud.backend1')

    t.expect(cleanRedundantRelationships(connections)).toEqual({
      'cloud -> amazon.rds1': [
        'cloud.backend1 -> amazon.rds1',
      ],
      'cloud.backend2 -> amazon.rds2': [
        'cloud.backend2 -> amazon.rds2',
      ],
    })

    // Exlude where target is camazon.rds1
    connections = connections.filter(c => c.target.id != 'amazon.rds1')
    t.expect(cleanRedundantRelationships(connections)).toEqual({
      'cloud -> amazon': [
        'cloud.backend1 -> amazon.rds1',
      ],
      'cloud.backend2 -> amazon.rds2': [
        'cloud.backend2 -> amazon.rds2',
      ],
    })
  })

  it('correctly find and exclude redundant (and reversed)', () => {
    const t = TestHelper.from(builder
      .model(({ el, rel }, m) =>
        m(
          el('cloud'),
          el('cloud.backend'),
          el('cloud.backend.service1'),
          el('cloud.backend.service2'),
          el('amazon'),
          el('amazon.rds1'),
          el('amazon.rds2'),
          rel('amazon', 'cloud.backend'),
          rel('cloud.backend.service1', 'amazon.rds1'),
          rel('cloud.backend.service2', 'amazon.rds2'),
        )
      ))
    let connections = findConnectionsWithin(t.model.elements())
    t.expect(connections).toEqual(
      'cloud -> amazon',
      'cloud -> amazon.rds1',
      'cloud -> amazon.rds2',
      'amazon -> cloud',
      'cloud.backend -> amazon',
      'cloud.backend -> amazon.rds1',
      'cloud.backend -> amazon.rds2',
      'amazon -> cloud.backend',
      'cloud.backend.service1 -> amazon',
      'cloud.backend.service1 -> amazon.rds1',
      'cloud.backend.service2 -> amazon',
      'cloud.backend.service2 -> amazon.rds2',
    )
    t.expect(findRedundantConnections(connections)).toEqual({
      'amazon -> cloud': [
        'amazon -> cloud.backend',
      ],
      'amazon -> cloud.backend': [
        'amazon -> cloud.backend',
      ],
      'cloud -> amazon': [
        'cloud.backend.service1 -> amazon.rds1',
        'cloud.backend.service2 -> amazon.rds2',
      ],
      'cloud -> amazon.rds1': [
        'cloud.backend.service1 -> amazon.rds1',
      ],
      'cloud -> amazon.rds2': [
        'cloud.backend.service2 -> amazon.rds2',
      ],
      'cloud.backend -> amazon': [
        'cloud.backend.service1 -> amazon.rds1',
        'cloud.backend.service2 -> amazon.rds2',
      ],
      'cloud.backend -> amazon.rds1': [
        'cloud.backend.service1 -> amazon.rds1',
      ],
      'cloud.backend -> amazon.rds2': [
        'cloud.backend.service2 -> amazon.rds2',
      ],
      'cloud.backend.service1 -> amazon': [
        'cloud.backend.service1 -> amazon.rds1',
      ],
      'cloud.backend.service2 -> amazon': [
        'cloud.backend.service2 -> amazon.rds2',
      ],
    })
    t.expect(cleanRedundantRelationships(connections)).toEqual(
      'cloud.backend.service1 -> amazon.rds1',
      'cloud.backend.service2 -> amazon.rds2',
    )
  })
})
