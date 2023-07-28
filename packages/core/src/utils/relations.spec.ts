import { describe, expect, it } from 'vitest'
import type { Fqn, Relation, RelationID } from '../types'
import { isAnyBetween, isAnyInOut, isBetween, isIncoming, isInside, isOutgoing } from './relations'

const relations = [
  {
    id: 'customer:cloud.frontend.dashboard' as RelationID,
    source: 'customer' as Fqn,
    target: 'cloud.frontend.dashboard' as Fqn,
    title: ''
  },
  {
    id: 'support:cloud.frontend.adminPanel' as RelationID,
    source: 'support' as Fqn,
    target: 'cloud.frontend.adminPanel' as Fqn,
    title: ''
  },
  {
    id: 'cloud.backend.storage:amazon.s3' as RelationID,
    source: 'cloud.backend.storage' as Fqn,
    target: 'amazon.s3' as Fqn,
    title: ''
  },
  {
    id: 'amazon.api:cloud.backend.graphql' as RelationID,
    source: 'amazon.api' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  },
  {
    id: 'cloud.backend.graphql:cloud.backend.storage' as RelationID,
    source: 'cloud.backend.graphql' as Fqn,
    target: 'cloud.backend.storage' as Fqn,
    title: ''
  },
  {
    id: 'cloud.frontend.dashboard:cloud.backend.graphql' as RelationID,
    source: 'cloud.frontend.dashboard' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  },
  {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql' as RelationID,
    source: 'cloud.frontend.adminPanel' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  }
] satisfies Relation[]

describe('relation predicates', () => {
  const expectRelations = (predicate: (relation: Relation) => boolean) =>
    expect(relations.filter(predicate).map(r => r.id))

  const customer = 'customer' as Fqn
  const cloud = 'cloud' as Fqn
  const frontend = 'cloud.frontend' as Fqn
  const backend = 'cloud.backend' as Fqn

  it('isBetween: cloud.frontend -> cloud.backend', () => {
    expectRelations(isBetween(frontend, backend)).toEqual([
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend.adminPanel:cloud.backend.graphql'
    ])
  })

  it('isBetween: cloud.backend -> cloud.frontend', () => {
    expectRelations(isBetween(backend, frontend)).toEqual([])
  })

  it('isBetween: cloud.backend -> cloud.backend', () => {
    expectRelations(isBetween(backend, backend)).toEqual([
      'cloud.backend.graphql:cloud.backend.storage'
    ])
  })

  it('isBetween: customer -> cloud', () => {
    expectRelations(isBetween(customer, cloud)).toEqual(['customer:cloud.frontend.dashboard'])
  })

  it('isIncoming: customer', () => {
    expectRelations(isIncoming(customer)).toEqual([])
  })

  it('isIncoming: cloud', () => {
    expectRelations(isIncoming(cloud)).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'amazon.api:cloud.backend.graphql'
    ])
  })

  it('isIncoming: cloud.frontend', () => {
    expectRelations(isIncoming(frontend)).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel'
    ])
  })

  it('isIncoming: cloud.frontend.dashboard', () => {
    expectRelations(isIncoming('cloud.frontend.dashboard' as Fqn)).toEqual([
      'customer:cloud.frontend.dashboard'
    ])
  })

  it('isOutgoing: cloud', () => {
    expectRelations(isOutgoing(cloud)).toEqual(['cloud.backend.storage:amazon.s3'])
  })

  it('isOutgoing: cloud.backend.storage', () => {
    expectRelations(isOutgoing('cloud.backend.storage' as Fqn)).toEqual([
      'cloud.backend.storage:amazon.s3'
    ])
  })

  it('isInside: cloud', () => {
    expectRelations(isInside(cloud)).toEqual([
      'cloud.backend.graphql:cloud.backend.storage',
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend.adminPanel:cloud.backend.graphql'
    ])
  })

  it('isInside: cloud.backend', () => {
    expectRelations(isInside(backend)).toEqual(['cloud.backend.graphql:cloud.backend.storage'])
  })

  it('isAnyInOut: cloud', () => {
    expectRelations(isAnyInOut(cloud)).toEqual([
      'customer:cloud.frontend.dashboard',
      'support:cloud.frontend.adminPanel',
      'cloud.backend.storage:amazon.s3',
      'amazon.api:cloud.backend.graphql'
    ])
  })

  it('isAnyBetween: cloud and amazon', () => {
    expectRelations(isAnyBetween(cloud, 'amazon' as Fqn)).toEqual([
      'cloud.backend.storage:amazon.s3',
      'amazon.api:cloud.backend.graphql'
    ])
  })

  it.todo('hasRelation')
})
