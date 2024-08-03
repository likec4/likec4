import type { ComputedNode, ViewRule } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { $custom, $include } from '../compute-view/__test__/fixture'
import { applyCustomElementProperties } from './applyCustomElementProperties'

function nd(id: string): ComputedNode {
  return { id } as ComputedNode
}

describe('applyElementCustomProperties', () => {
  it('should return nodes if there are no rules', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [] as ViewRule[]
    expect(applyCustomElementProperties(rules, nodes)).toBe(nodes)
  })

  it('should return nodes if there are no CustomElement rules', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [$include('*')]
    expect(applyCustomElementProperties(rules, nodes)).toBe(nodes)
  })

  it('should apply custom properties to matching nodes', () => {
    const nodes = [nd('cloud'), nd('2')]
    const rules = [
      $include($custom('cloud', {
        title: 'value1',
        technology: 'value2'
      }))
    ]
    const result = applyCustomElementProperties(rules, nodes)
    expect(result).toEqual([{
      id: 'cloud',
      isCustomized: true,
      title: 'value1',
      technology: 'value2'
    }, { id: '2' }])
    expect(result).not.toBe(nodes) // should return new array
    expect(result[0]).not.toBe(nodes[0]) // should return new node
    expect(nodes[0]).toEqual(nd('cloud')) // should not mutate original node
    expect(result[1]).toBe(nodes[1]) // shoud not change non-matching nodes
  })

  it('should apply custom properties to matching nodes and omit nils', () => {
    const nodes = [
      nd('cloud'),
      {
        ...nd('customer'),
        title: 'Title',
        description: null,
        technology: null,
        shape: 'mobile',
        style: {}
      } satisfies ComputedNode
    ]
    const rules = [
      $include($custom('customer', {
        title: null as any, // null should be ignored
        technology: undefined as any, // undefined should be ignored
        description: '',
        border: undefined as any, // undefined should be ignored
        shape: 'queue',
        color: 'indigo',
        opacity: 90
      }))
    ]
    const result = applyCustomElementProperties(rules, nodes)
    expect(result).toEqual([
      {
        id: 'cloud'
      },
      {
        id: 'customer',
        title: 'Title',
        description: '',
        technology: null,
        shape: 'queue',
        color: 'indigo',
        isCustomized: true,
        style: {
          opacity: 90
        }
      }
    ])
  })

  it('should ignore rules for non-existent nodes', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [
      $include($custom('cloud', {
        title: 'value1',
        technology: 'value2'
      }))
    ]
    const result = applyCustomElementProperties(rules, nodes)
    expect(result).not.toBe(nodes) // should return new array
    expect(result).toEqual(nodes) // but with same nodes
  })
})
