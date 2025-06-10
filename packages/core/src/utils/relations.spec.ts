import { sort } from 'remeda'
import { describe, expect, it } from 'vitest'
import { type RelationshipLike, compareRelations } from './relations'

const relations = [
  {
    source: {
      model: 'customer',
    },
    target: {
      model: 'cloud.frontend.dashboard',
    },
  },
  {
    source: {
      model: 'support',
    },
    target: {
      model: 'cloud.frontend.supportPanel',
    },
  },
  {
    source: {
      model: 'cloud.backend.storage',
    },
    target: {
      model: 'amazon.s3',
    },
  },
  {
    source: {
      model: 'amazon.api',
    },
    target: {
      model: 'cloud.backend.graphql',
    },
  },
  {
    source: {
      model: 'cloud.backend.graphql',
    },
    target: {
      model: 'cloud.backend.storage',
    },
  },
  {
    source: {
      model: 'cloud.frontend.dashboard',
    },
    target: {
      model: 'cloud.backend.graphql',
    },
  },
  {
    source: {
      model: 'cloud.frontend.supportPanel',
    },
    target: {
      model: 'cloud.backend.graphql',
    },
  },
] satisfies RelationshipLike[]

describe('compareRelations', () => {
  function rel(source: string, target: string): RelationshipLike {
    return {
      source: {
        model: source,
      },
      target: {
        model: target,
      },
    }
  }
  function sorted(...relations: Array<RelationshipLike>) {
    return sort(relations, compareRelations).map(r => r.source.model + ' -> ' + r.target.model)
  }

  it('should sort by source and target', () => {
    expect(sorted(rel('customer', 'cloud.ui'), rel('customer', 'cloud'))).toEqual([
      'customer -> cloud',
      'customer -> cloud.ui',
    ])

    expect(
      sorted(
        rel('1', '2.1'),
        rel('1', '2'),
        rel('1.1.1', '2'),
        rel('1.1.1', '2.1'),
        rel('1.1', '2'),
      ),
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
        rel('cloud', 'aws'),
      ),
    ).toEqual([
      'cloud -> aws',
      'cloud.1 -> aws.1',
      'cloud.1.1 -> aws.1',
      'cloud.1 -> cloud.2',
      'cloud.1 -> cloud.2.1',
      'cloud.1.1 -> cloud.2',
      'cloud.1.1 -> cloud.2.1',
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
        rel('cloud', 'aws'),
      ),
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
      'cloud.ui.2 -> cloud.ui.1',
    ])
  })

  it('should sort relations from example', () => {
    expect(sorted(...relations)).toEqual([
      'customer -> cloud.frontend.dashboard',
      'support -> cloud.frontend.supportPanel',
      'amazon.api -> cloud.backend.graphql',
      'cloud.backend.storage -> amazon.s3',
      'cloud.frontend.dashboard -> cloud.backend.graphql',
      'cloud.frontend.supportPanel -> cloud.backend.graphql',
      'cloud.backend.graphql -> cloud.backend.storage',
    ])
  })
})
