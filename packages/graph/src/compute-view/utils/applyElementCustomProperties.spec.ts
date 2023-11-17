import type { ComputedNode, ViewRule } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { $include } from '../__test__/fixture'
import { applyElementCustomProperties } from './applyElementCustomProperties'

function nd(id: string): ComputedNode {
  return { id } as ComputedNode
}

describe('applyElementCustomProperties', () => {
  it('should return nodes if there are no rules', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [] as ViewRule[]
    expect(applyElementCustomProperties(rules, nodes)).toBe(nodes)
  })

  it('should return nodes if there are no CustomElement rules', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [$include('*')]
    expect(applyElementCustomProperties(rules, nodes)).toBe(nodes)
  })

  it('should apply custom properties to matching nodes', () => {
    const nodes = [nd('cloud'), nd('2')]
    const rules = [
      $include({
        custom: {
          element: 'cloud',
          title: 'value1',
          technology: 'value2'
        }
      })
    ]
    const result = applyElementCustomProperties(rules, nodes)
    expect(result).toEqual([{ id: 'cloud', title: 'value1', technology: 'value2' }, { id: '2' }])
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
        technology: null
      }
    ]
    const rules = [
      $include({
        custom: {
          element: 'customer',
          title: null as any, // null should be ignored
          technology: undefined as any, // undefined should be ignored
          description: ''
        }
      })
    ]
    const result = applyElementCustomProperties(rules, nodes)
    expect(result).toEqual([
      { id: 'cloud' },
      { id: 'customer', title: 'Title', description: '', technology: null }
    ])
  })

  it('should ignore rules for non-existent nodes', () => {
    const nodes = [nd('1'), nd('2')]
    const rules = [
      $include({
        custom: {
          element: 'cloud',
          title: 'value1',
          technology: 'value2'
        }
      })
    ]
    const result = applyElementCustomProperties(rules, nodes)
    expect(result).not.toBe(nodes) // should return new array
    expect(result).toEqual(nodes) // but with same nodes
  })
})
