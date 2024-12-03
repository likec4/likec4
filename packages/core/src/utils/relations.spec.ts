import { sort } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { Fqn, Relation, RelationId } from '../types'
import { compareRelations, isAnyBetween, isAnyInOut, isBetween, isIncoming, isInside, isOutgoing } from './relations'

const relations = [
  {
    id: 'customer:cloud.frontend.dashboard' as RelationId,
    source: 'customer' as Fqn,
    target: 'cloud.frontend.dashboard' as Fqn,
    title: ''
  },
  {
    id: 'support:cloud.frontend.adminPanel' as RelationId,
    source: 'support' as Fqn,
    target: 'cloud.frontend.adminPanel' as Fqn,
    title: ''
  },
  {
    id: 'cloud.backend.storage:amazon.s3' as RelationId,
    source: 'cloud.backend.storage' as Fqn,
    target: 'amazon.s3' as Fqn,
    title: ''
  },
  {
    id: 'amazon.api:cloud.backend.graphql' as RelationId,
    source: 'amazon.api' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  },
  {
    id: 'cloud.backend.graphql:cloud.backend.storage' as RelationId,
    source: 'cloud.backend.graphql' as Fqn,
    target: 'cloud.backend.storage' as Fqn,
    title: ''
  },
  {
    id: 'cloud.frontend.dashboard:cloud.backend.graphql' as RelationId,
    source: 'cloud.frontend.dashboard' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  },
  {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql' as RelationId,
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

  it('isBetween: cloud.frontend.dashboard -> cloud.backend', () => {
    expectRelations(isBetween('cloud.frontend.dashboard' as Fqn, backend)).toEqual([
      'cloud.frontend.dashboard:cloud.backend.graphql'
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

  it('isOutgoing: cloud.frontend', () => {
    expectRelations(isOutgoing(frontend)).toEqual([
      'cloud.frontend.dashboard:cloud.backend.graphql',
      'cloud.frontend.adminPanel:cloud.backend.graphql'
    ])
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

  it('isInside: cloud.frontend', () => {
    expectRelations(isInside(frontend)).toEqual([])
  })

  it('isInside: cloud.backend', () => {
    expectRelations(isInside(backend)).toEqual(['cloud.backend.graphql:cloud.backend.storage'])
  })

  it('isAnyInOut: customer', () => {
    expectRelations(isAnyInOut(customer)).toEqual(['customer:cloud.frontend.dashboard'])
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
})

describe('compareRelations', () => {
  function rel(source: string, target: string) {
    return {
      source,
      target
    }
  }
  function sorted(...relations: Array<{ source: string; target: string }>) {
    return sort(relations, compareRelations).map(r => r.source + ' -> ' + r.target)
  }

  it('should sort by source and target', () => {
    expect(sorted(rel('customer', 'cloud.ui'), rel('customer', 'cloud'))).toEqual([
      'customer -> cloud',
      'customer -> cloud.ui'
    ])

    expect(
      sorted(
        rel('1', '2.1'),
        rel('1', '2'),
        rel('1.1.1', '2'),
        rel('1.1.1', '2.1'),
        rel('1.1', '2')
      )
    ).toEqual(['1 -> 2', '1 -> 2.1', '1.1 -> 2', '1.1.1 -> 2', '1.1.1 -> 2.1'])
  })

  it('should sort by parent', () => {
    expect(
      sorted(
        // same parent
        rel('cloud.1.1', 'cloud.2.1'),
        rel('cloud.1.1', 'cloud.2'),
        rel('cloud.1', 'cloud.2.1'),
        rel('cloud.1', 'cloud.2'),
        // no same parent
        rel('cloud.1.1', 'aws.1'),
        rel('cloud.1', 'aws.1'),
        rel('cloud', 'aws')
      )
    ).toEqual([
      'cloud -> aws',
      'cloud.1 -> aws.1',
      'cloud.1.1 -> aws.1',
      'cloud.1 -> cloud.2',
      'cloud.1 -> cloud.2.1',
      'cloud.1.1 -> cloud.2',
      'cloud.1.1 -> cloud.2.1'
    ])
  })

  it('should sort by ancestors', () => {
    expect(
      sorted(
        // same parent 2nd level
        rel('cloud.api.1', 'cloud.api.2'),
        rel('cloud.ui.1', 'cloud.ui.2'),
        rel('cloud.ui.2', 'cloud.ui.1'),
        // same ancestor cloud
        rel('cloud.ui.1', 'cloud.api.1'),
        rel('cloud.ui.2', 'cloud.api.2'),
        rel('cloud.ui', 'cloud.api.1'),
        // same parent 1st level
        rel('cloud.ui', 'cloud.api'),
        // no same parent
        rel('cloud.api.1', 'aws.1'),
        rel('cloud.api', 'aws.1'),
        rel('cloud.api', 'aws'),
        rel('cloud.ui.1', 'aws.1'),
        rel('cloud.ui', 'aws'),
        rel('cloud', 'aws')
      )
    ).toEqual([
      'cloud -> aws',
      'cloud.api -> aws',
      'cloud.ui -> aws',
      'cloud.api -> aws.1',
      'cloud.api.1 -> aws.1',
      'cloud.ui.1 -> aws.1',
      'cloud.ui -> cloud.api',
      'cloud.ui -> cloud.api.1',
      'cloud.ui.1 -> cloud.api.1',
      'cloud.ui.2 -> cloud.api.2',
      'cloud.api.1 -> cloud.api.2',
      'cloud.ui.1 -> cloud.ui.2',
      'cloud.ui.2 -> cloud.ui.1'
    ])
  })

  it('should sort relations from example', () => {
    expect(sorted(...relations)).toEqual([
      'customer -> cloud.frontend.dashboard',
      'support -> cloud.frontend.adminPanel',
      'amazon.api -> cloud.backend.graphql',
      'cloud.backend.storage -> amazon.s3',
      'cloud.frontend.dashboard -> cloud.backend.graphql',
      'cloud.frontend.adminPanel -> cloud.backend.graphql',
      'cloud.backend.graphql -> cloud.backend.storage'
    ])
  })
})
