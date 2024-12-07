import { describe, expect, it } from 'vitest'
import type { Element } from '../../types/element'
import type { RelationWhereExpr } from '../../types/expression'
import type { ComputedNode } from '../../types/view'
import { $incoming, $inout, $outgoing, $relation, $where } from '../element-view/__test__/fixture'
import { type FilterableEdge, relationExpressionToPredicates } from './relationExpressionToPredicates'

function el(id: string): ComputedNode {
  return { id } as ComputedNode
}

function r(id: string, props = {}): FilterableEdge {
  const [source, target] = id.split(':')
  return {
    id,
    source: el(source!),
    target: el(target!),
    ...props
  } as FilterableEdge
}

describe('relationExpressionToPredicates', () => {
  describe('inout', () => {
    it('returns true if any side matches reference', () => {
      const matchingRelation1 = r('a:support')
      const matchingRelation2 = r('support:a')

      const predicate = relationExpressionToPredicates($inout('-> support ->'))

      expect(predicate(matchingRelation1)).toBe(true)
      expect(predicate(matchingRelation2)).toBe(true)
    })

    it('returns false if neither one side matches reference', () => {
      const nonMatchingRelation = r('b:a')

      const predicate = relationExpressionToPredicates($inout('-> support ->'))

      expect(predicate(nonMatchingRelation)).toBe(false)
    })
  })

  describe('incoming', () => {
    it('returns true if target matches reference', () => {
      const matchingRelation = r('a:support')

      const predicate = relationExpressionToPredicates($incoming('-> support'))

      expect(predicate(matchingRelation)).toBe(true)
    })

    it('returns false if target does not matche reference', () => {
      const nonMatchingRelation = r('b:a')

      const predicate = relationExpressionToPredicates($incoming('-> support'))

      expect(predicate(nonMatchingRelation)).toBe(false)
    })
  })

  describe('incoming', () => {
    it('returns true if target matches reference', () => {
      const matchingRelation = r('support:b')

      const predicate = relationExpressionToPredicates($outgoing('support ->'))

      expect(predicate(matchingRelation)).toBe(true)
    })

    it('returns false if target does not matche reference', () => {
      const nonMatchingRelation = r('b:a')

      const predicate = relationExpressionToPredicates($outgoing('support ->'))

      expect(predicate(nonMatchingRelation)).toBe(false)
    })
  })

  describe('explicit', () => {
    it('returns true if both source and target exactly match', () => {
      const matchingRelation = r('support:cloud')

      const predicate = relationExpressionToPredicates($relation('support -> cloud'))

      expect(predicate(matchingRelation)).toBe(true)
    })

    it('returns true if bidirectional and source is swapped with target match', () => {
      const matchingRelation = r('cloud:support')

      const predicate = relationExpressionToPredicates($relation('support <-> cloud'))

      expect(predicate(matchingRelation)).toBe(true)
    })

    it('returns false if at least source or target does not match', () => {
      const nonMatchingRelation1 = r('support:a')
      const nonMatchingRelation2 = r('b:cloud')
      const nonMatchingRelation3 = r('cloud:support')

      const predicate = relationExpressionToPredicates($relation('support -> cloud'))

      expect(predicate(nonMatchingRelation1)).toBe(false)
      expect(predicate(nonMatchingRelation2)).toBe(false)
      expect(predicate(nonMatchingRelation3)).toBe(false)
    })
  })

  describe('where', () => {
    it('returns true if condition is met', () => {
      const matchingRelation = r('support:cloud', { tags: ['aws'] })

      const predicate = relationExpressionToPredicates(
        $where(
          $relation('support -> cloud'),
          { tag: { eq: 'aws' } }
        ) as RelationWhereExpr
      )

      expect(predicate(matchingRelation)).toBe(true)
    })

    it('returns false if condition is not met', () => {
      const nonMatchingRelation = r('support:cloud', { tags: ['foo'] })

      const predicate = relationExpressionToPredicates(
        $where(
          $relation('support -> cloud'),
          { tag: { eq: 'aws' } }
        ) as RelationWhereExpr
      )

      expect(predicate(nonMatchingRelation)).toBe(false)
    })

    it('returns false if internal expression resolved to false', () => {
      const nonMatchingRelation = r('support:b', { tags: ['aws'] })

      const predicate = relationExpressionToPredicates(
        $where(
          $relation('support -> cloud'),
          { tag: { eq: 'aws' } }
        ) as RelationWhereExpr
      )

      expect(predicate(nonMatchingRelation)).toBe(false)
    })
  })
})
