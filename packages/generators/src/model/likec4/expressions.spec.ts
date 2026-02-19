import type { WhereOperator } from '@likec4/core'
import { dedent } from 'strip-indent'
import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import {
  type Ops,
  materialize,
  withctx,
} from './base'
import { whereOperator } from './expressions'

/**
 * Returns expect function to execute operations on the given context
 */
function expectOnCtx<A>(ctx: A) {
  const exec = withctx(ctx)
  return (...ops: Ops<A>): Assertion<string> =>
    viExpect(
      materialize(exec(...ops)),
    )
}

/**
 * Returns expect function to execute operations on the given context
 */
function expectWhereOperator(operator: WhereOperator<any>) {
  const exec = withctx(operator)
  return viExpect(
    materialize(exec(whereOperator())),
  )
}

describe('whereOperator', () => {
  it('should print tag equal', () => {
    expectWhereOperator({
      tag: 'tag1',
    }).toBe('tag is #tag1')

    expectWhereOperator({
      tag: {
        eq: 'tag2',
      },
    }).toBe('tag is #tag2')

    expectWhereOperator({
      tag: {
        neq: 'tag2',
      },
    }).toBe('tag is not #tag2')
  })

  it('should print kind equal', () => {
    expectWhereOperator({
      kind: 'system',
    }).toBe('kind is system')

    expectWhereOperator({
      kind: {
        eq: 'system',
      },
    }).toBe('kind is system')

    expectWhereOperator({
      kind: {
        neq: 'system',
      },
    }).toBe('kind is not system')
  })

  it('should print participant operator', () => {
    expectWhereOperator({
      participant: 'source',
      operator: { tag: 'tag1' },
    }).toBe('source.tag is #tag1')

    expectWhereOperator({
      participant: 'target',
      operator: { kind: { neq: 'system' } },
    }).toBe('target.kind is not system')
  })

  it('should print not operator', () => {
    expectWhereOperator({
      not: {
        tag: 'tag1',
      },
    }).toBe('not ( tag is #tag1 )')

    expectWhereOperator({
      not: {
        participant: 'target',
        operator: { kind: { neq: 'system' } },
      },
    }).toBe('not ( target.kind is not system )')
  })

  it('should print and operator', () => {
    expectWhereOperator({
      and: [
        { tag: 'tag1' },
        { kind: { neq: 'system' } },
      ],
    }).toBe(dedent(`
      tag is #tag1
      and kind is not system
    `))
  })

  it('should print or operator', () => {
    expectWhereOperator({
      or: [
        { tag: 'tag1' },
        { kind: { neq: 'system' } },
      ],
    }).toBe(dedent(`
      tag is #tag1
      or kind is not system
    `))
  })

  it('should wrap or operands in braces inside and', () => {
    expectWhereOperator({
      and: [
        {
          or: [
            { tag: 'tag1' },
            { kind: { neq: 'system' } },
          ],
        },
        {
          participant: 'source',
          operator: {
            tag: 'tag2',
          },
        },
      ],
    }).toBe(dedent(`
      (tag is #tag1
      or kind is not system)
      and source.tag is #tag2
    `))
  })

  it('should wrap and operands in braces inside or', () => {
    expectWhereOperator({
      or: [
        {
          and: [
            { tag: 'tag1' },
            { kind: { neq: 'system' } },
          ],
        },
        {
          participant: 'target',
          operator: {
            kind: 'system',
          },
        },
      ],
    }).toBe(dedent(`
      (tag is #tag1
      and kind is not system)
      or target.kind is system
    `))
  })
})
