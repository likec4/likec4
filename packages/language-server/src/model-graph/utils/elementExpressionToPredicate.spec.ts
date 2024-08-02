import type { ComputedNode, ElementKind, Expression as C4Expression } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { $expr, $where, type Expression, type FakeElementIds } from '../compute-view/__test__/fixture'
import { elementExprToPredicate } from './elementExpressionToPredicate'

const toPredicate = (expr: C4Expression) => elementExprToPredicate(expr as any)

type Node = Partial<
  ComputedNode | {
    id: FakeElementIds
    kind: string
    tags: string[]
  }
>

function nd(
  props: Partial<
    ComputedNode | {
      id: FakeElementIds
      kind: string
      tags: string[]
    }
  >
): ComputedNode {
  return {
    kind: 'element',
    ...props
  } as ComputedNode
}

function test$expr(expr: Expression) {
  const predicate = toPredicate($expr(expr))
  return {
    yes(node: Node) {
      expect(predicate(nd(node))).toBe(true)
    },
    no(node: Node) {
      expect(predicate(nd(node))).toBe(false)
    }
  }
}

describe('elementExprToPredicate', () => {
  it('returns a function that always returns true for wildcard expression', () => {
    const predicate = toPredicate($expr('*'))
    expect(predicate({} as any)).toBe(true)
  })

  it('returns a function that checks if the node id matches the expanded element expression', () => {
    const { yes, no } = test$expr('cloud._')
    yes({ id: 'cloud' })
    yes({ id: 'cloud.backend' })
    no({ id: 'cloud.backend.graphql' })
    yes({ id: 'cloud.frontend' })
    no({ id: 'cloud.frontend.adminPanel' })
    no({ id: 'customer' })
  })

  it('returns a function that checks if the node id matches the descedant element expression', () => {
    const { yes, no } = test$expr('cloud.*')
    yes({ id: 'cloud.backend.storage' })
    yes({ id: 'cloud.frontend' })
    no({ id: 'cloud' })
    no({ id: 'customer' })
  })

  it('returns a function that checks if the node id matches the element ref expression', () => {
    const { yes, no } = test$expr('cloud.backend')
    no({ id: 'cloud.backend.graphql' })
    yes({ id: 'cloud.backend' })
    no({ id: 'cloud.frontend' })
    no({ id: 'customer' })
  })

  it('returns a function that checks if the node id matches WHERE tag == clause', () => {
    const { yes, no } = test$expr($where('*', {
      tag: { eq: 'cloud' }
    }))
    no({ id: 'amazon' })
    yes({ id: 'customer', tags: ['cloud'] })
  })

  it('returns a function that checks if the node id matches WHERE tag != clause', () => {
    const { yes, no } = test$expr($where('*', {
      tag: { neq: 'cloud' }
    }))
    yes({ id: 'amazon' })
    yes({ id: 'amazon.s3', tags: ['aws'] })
    no({ id: 'customer', tags: ['cloud'] })
  })
})
