import { describe, expect, it } from 'vitest'
import {
  type ComputedNode,
  type ElementViewRuleStyle as ViewRuleStyle,
  type IconUrl,
  type ModelExpression,
  type NonEmptyArray,
  GroupElementKind,
} from '../../types'
import { $expr } from '../element-view/__test__/fixture'
import { applyViewRuleStyles } from './applyViewRuleStyles'

function nd(id: string, props?: any): ComputedNode {
  return { id, ...props } as ComputedNode
}

function g(id: string): ComputedNode {
  return { id, kind: GroupElementKind } as any
}

function r(
  targets: NonEmptyArray<ModelExpression>,
  props: Partial<Omit<ViewRuleStyle, 'targets'>>,
): ViewRuleStyle {
  return {
    targets,
    style: {},
    ...props,
  }
}

describe('applyViewRuleStyles', () => {
  it('returns nodes if there are no rules', () => {
    const nodes = [nd('1'), nd('2')]

    const rules = [] as ViewRuleStyle[]

    expect(applyViewRuleStyles(rules, nodes)).toStrictEqual(nodes)
  })

  it('does not modify groups', () => {
    const groups = [g('1'), g('2')] as ComputedNode[]

    const rules = [r([$expr('*')], { notation: 'some notation' })] as ViewRuleStyle[]

    expect(applyViewRuleStyles(rules, groups)).toStrictEqual(groups)
  })

  it('aplies rule if any of predicates match', () => {
    const nodes = [nd('support'), nd('customer')] as ComputedNode[]

    const rules = [
      r([
        $expr('support'),
        $expr('cloud'),
      ], { notation: 'some notation' }),
    ]

    expect(applyViewRuleStyles(rules, nodes)).toStrictEqual([
      {
        ...nodes[0],
        notation: 'some notation',
      },
      nodes[1],
    ])
  })

  it('updates properties of matched node from rule', () => {
    const nodes = [nd('support'), nd('customer')] as ComputedNode[]

    const rules = [
      r([
        $expr('support'),
        $expr('cloud'),
      ], {
        notation: 'some notation',
        style: {
          color: 'red',
          icon: 'aws:lambda' as IconUrl,
          border: 'dashed',
          shape: 'browser',
          multiple: true,
          opacity: 30,
        },
      }),
    ]

    expect(applyViewRuleStyles(rules, nodes)).toStrictEqual([
      {
        ...nodes[0],
        notation: 'some notation',
        color: 'red',
        icon: 'aws:lambda',
        shape: 'browser',
        style: {
          border: 'dashed',
          opacity: 30,
          multiple: true,
        },
      },
      nodes[1],
    ])
  })

  it('skips nullish properties in rule', () => {
    const nodes = [nd('support', {
      notation: 'some notation',
      color: 'red',
      icon: 'aws:lambda',
      shape: 'browser',
      style: {
        border: 'dashed',
        opacity: 30,
      },
    })] as ComputedNode[]

    expect(applyViewRuleStyles([r([$expr('*')], {})], nodes)).toStrictEqual([nodes[0]])
    expect(applyViewRuleStyles([r([$expr('*')], { style: {} })], nodes)).toStrictEqual([nodes[0]])
  })
})
