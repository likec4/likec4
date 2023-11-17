import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('custom-element-expr', () => {
  it('include element and apply props', () => {
    const { nodes, nodeIds, edgeIds } = computeView([
      $include('amazon'),
      $include({
        custom: {
          element: 'cloud',
          title: 'CHANGED',
          navigateTo: 'custom'
        }
      }),
      $include({
        custom: {
          element: 'customer',
          title: null as any, // null should be ignored
          technology: '',
          description: undefined as any // undefined should be ignored
        }
      })
    ])
    expect(nodeIds).toEqual(['customer', 'cloud', 'amazon'])
    expect(edgeIds).toEqual(['customer:cloud', 'cloud:amazon'])
    const customer = nodes.find(n => n.id === 'customer')!
    expect(customer).toMatchObject({
      title: 'customer',
      technology: '',
      description: null
    })

    const cloud = nodes.find(n => n.id === 'cloud')!
    expect(cloud).toMatchObject({
      title: 'CHANGED',
      technology: null,
      description: null,
      navigateTo: 'custom'
    })
  })
})
