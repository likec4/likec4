import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import type { AnyTypes, ElementViewRulesBuilder, Types } from '../../builder'
import { RelationExpr } from '../../types'
import type { Color, WhereOperator } from '../../types'
import { TestHelper } from './__test__/TestHelper'

function includeWhereWith<T extends AnyTypes>(
  expr: `${T['Fqn'] | '*'} -> ${T['Fqn'] | '*'}`,
  condition: WhereOperator<Types.ToAux<T>>,
  color: Color,
): ElementViewRulesBuilder<T> {
  return b => {
    const parsed = b.$expr(expr)
    if (!RelationExpr.is(parsed)) {
      throw new Error('Expected a relationship expression')
    }
    return b.include({
      customRelation: {
        expr: {
          where: {
            expr: parsed,
            condition,
          },
        },
        color,
      },
    })
  }
}

describe('custom relation with where metadata', () => {
  const builder = Builder
    .specification({
      elements: {
        app: {},
      },
      tags: {
        removed: {},
      },
      metadataKeys: ['removedIn'],
    })
    .model(({ app }, m) =>
      m(
        app('a'),
        app('b'),
        app('c'),
        app('d'),
        app('d.d1'),
        app('d.d2'),
      )
    )
    .model(({ rel }, m) =>
      m(
        rel('a', 'b', { title: 'removed', metadata: { removedIn: 't01' } }),
        rel('b', 'c', { title: 'kept' }),
        rel('c', 'd.d1', { title: 'removed', metadata: { removedIn: ['t01', 't02'] } }),
        rel('c', 'd.d2', { title: 'kept', metadata: { removedIn: 't03' } }),
      )
    )

  const t = TestHelper.from(builder)

  const edgesOf = (...rules: ElementViewRulesBuilder<typeof builder['Types']>[]) => {
    const view = t.computeView(...rules)
    return Object.fromEntries(view.edges.map(e => [e.id, e]))
  }

  it('applies overrides to relationships matching metadata value', () => {
    const edges = edgesOf(
      t.$include('a'),
      t.$include('b'),
      t.$include('c'),
      t.$include('* -> *'),
      includeWhereWith('* -> *', { metadata: { key: 'removedIn', value: 't01' } }, 'red'),
    )
    expect(edges['a -> b']).toMatchObject({ color: 'red', isCustomized: true })
    expect(edges['b -> c']?.color).not.toBe('red')
    expect(edges['b -> c']).not.toHaveProperty('isCustomized')
  })

  it('applies overrides when metadata key is present', () => {
    const edges = edgesOf(
      t.$include('* -> *'),
      includeWhereWith('* -> *', { metadata: { key: 'removedIn' } }, 'red'),
    )
    expect(edges['a -> b']).toMatchObject({ color: 'red', isCustomized: true })
    expect(edges['b -> c']).not.toHaveProperty('isCustomized')
  })

  it('does not apply neq overrides to relationships with that metadata value', () => {
    const edges = edgesOf(
      t.$include('* -> *'),
      includeWhereWith('* -> *', { metadata: { key: 'removedIn', value: { neq: 't01' } } }, 'green'),
    )
    expect(edges['a -> b']).not.toHaveProperty('isCustomized')
    expect(edges['a -> b']?.color).not.toBe('green')
    expect(edges['b -> c']).toMatchObject({ color: 'green', isCustomized: true })
  })

  it('matches metadata of any relationship merged into the edge', () => {
    // c -> d combines c -> d.d1 (removedIn t01, t02) and c -> d.d2 (removedIn t03)
    const t02 = edgesOf(
      t.$include('c'),
      t.$include('d'),
      includeWhereWith('c -> d', { metadata: { key: 'removedIn', value: 't02' } }, 'red'),
    )
    expect(t02['c -> d']).toMatchObject({ color: 'red', isCustomized: true })

    const not_t03 = edgesOf(
      t.$include('c'),
      t.$include('d'),
      t.$include('c -> d'),
      includeWhereWith('c -> d', { metadata: { key: 'removedIn', value: { neq: 't03' } } }, 'red'),
    )
    expect(not_t03['c -> d']).not.toHaveProperty('isCustomized')
  })
})
