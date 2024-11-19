import { describe, expect, it } from 'vitest'
import type { ComputedEdge, ComputedNode, CustomRelationExpr, ViewID, ViewRule } from '../../types'
import { $include, $inout, $where } from '../element-view/__test__/fixture'
import { applyCustomRelationProperties } from './applyCustomRelationProperties'

type CustomRelationProperties = Omit<CustomRelationExpr['customRelation'], 'relation'>

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

  it('applies custom properties', () => {
    const nodes = [nd('1'), nd('support')]
    const edge = e('1:support')
    const propsToOverride: CustomRelationProperties = {
      description: 'some description',
      technology: 'some technology',

      notation: 'some notation',
      navigateTo: 'some link' as ViewID,
      notes: 'some notes',

      color: 'red',
      line: 'dashed',
      head: 'dot',
      tail: 'diamond'
    }
    const rules = [
      $include($inout('-> support ->'), { with: propsToOverride })
    ] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, [edge])).toStrictEqual([
      {
        ...edge,
        ...propsToOverride,
        isCustomized: true,
        label: undefined
      }
    ])
  })

  it('applies only to matching edges', () => {
    const nodes = [nd('1'), nd('support'), nd('3')]
    const edges = [e('1:support'), e('1:support', { tags: ['old'] })]
    const propsToOverride: CustomRelationProperties = { color: 'red' }
    const rules = [
      $include($where('-> support ->', { tag: { eq: 'old' } }), { with: propsToOverride })
    ] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, edges)).toStrictEqual([
      edges[0],
      {
        ...edges[1],
        color: propsToOverride.color,
        isCustomized: true,
        label: undefined
      }
    ])
  })

  it('applies values from the last rule', () => {
    const nodes = [nd('1'), nd('support'), nd('3')]
    const edge = e('1:support')
    const firstRuleProps: CustomRelationProperties = { color: 'red' }
    const lastRuleProps: CustomRelationProperties = { color: 'green' }
    const rules = [
      $include($inout('-> support ->'), { with: firstRuleProps }),
      $include($inout('-> support ->'), { with: lastRuleProps })
    ] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, [edge])).toStrictEqual([
      {
        ...edge,
        color: lastRuleProps.color,
        isCustomized: true,
        label: undefined
      }
    ])
  })

  it('skips nullish values', () => {
    const nodes = [nd('1'), nd('support')]
    const edge = e('1:support', {
      description: 'some description',
      technology: 'some technology',

      notation: 'some notation',
      navigateTo: 'some link' as ViewID,
      notes: 'some notes',

      color: 'red',
      line: 'dashed',
      head: 'dot',
      tail: 'diamond'
    })
    const propsToOverride = ({
      description: null,
      technology: null,

      notation: null,
      navigateTo: null,
      notes: null,

      color: null
    } as unknown) as CustomRelationProperties
    const rules = [
      $include($inout('-> support ->'), { with: propsToOverride })
    ] as ViewRule[]

    expect(applyCustomRelationProperties(rules, nodes, [edge])).toStrictEqual([
      {
        ...edge,
        isCustomized: true,
        label: undefined
      }
    ])
  })

  it('replace label with title if provided', () => {
    const nodes = [nd('1'), nd('support')]
    const edge = e('1:support')
    const propsToOverride: CustomRelationProperties = { title: 'some title' }
    const rules = [
      $include($inout('-> support ->'), { with: propsToOverride })
    ] as ViewRule[]

    const [customizedEdge] = applyCustomRelationProperties(rules, nodes, [edge])

    expect(customizedEdge?.label).toBe('some title')
  })

  it('marks as customized', () => {
    const nodes = [nd('1'), nd('support')]
    const edge = e('1:support')
    const propsToOverride: CustomRelationProperties = { title: 'some title' }
    const rules = [
      $include($inout('-> support ->'), { with: propsToOverride })
    ] as ViewRule[]

    const [customizedEdge] = applyCustomRelationProperties(rules, nodes, [edge])

    expect(customizedEdge?.isCustomized).toBe(true)
  })

  it('keeps original properties of the edge', () => {
    const nodes = [nd('1'), nd('support')]
    const edge = e('1:support', {
      someProp: 'some value'
    })
    const propsToOverride: CustomRelationProperties = {}
    const rules = [
      $include($inout('-> support ->'), { with: propsToOverride })
    ] as ViewRule[]

    const [customizedEdge] = applyCustomRelationProperties(rules, nodes, [edge])

    expect((customizedEdge as any)?.someProp).toBe((edge as any).someProp)
  })
})
