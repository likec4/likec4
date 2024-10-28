import type { ComputedEdge, ComputedNode, ViewRule } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { $include, $where } from '../compute-view/__test__/fixture'
import { applyCustomRelationProperties } from './applyCustomRelationProperties'

function nd(id: string): ComputedNode {
  return { id } as ComputedNode
}

function e(id: string, props = {}): ComputedEdge {
  const [source, target] = id.split(':')
  return { id, source, target, ...props } as ComputedEdge
}

describe('applyRelationCustomProperties', () => {
  it('should return edges if there are no rules', () => {
    const nodes = [nd('1'), nd('2')]
    const edges = [e('1:2')]
    const rules = [] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, edges)).toStrictEqual(edges)
  })

  it('should apply custom properties to edges by where clause', () => {
    const nodes = [nd('1'), nd('support'), nd('3')]
    const edges = [e('1:support'), e('support:3', { tags: ['old'] })]
    const rules = [
      $include(
        $where('-> support ->', {
          tag: { eq: 'old' }
        }),
        {
          with: {
            color: 'red'
          }
        }
      )
    ] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, edges)).toStrictEqual([
      e('1:support'),
      e('support:3', { color: 'red', tags: ['old'], isCustomized: true, label: undefined })
    ])
  })
})
