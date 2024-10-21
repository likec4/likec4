import { describe, expect, it } from 'vitest'
import { $include, $style, computeView } from './fixture'

describe('custom-element-expr', () => {
  it('include element and apply props', () => {
    const { nodes, nodeIds, edgeIds } = computeView([
      $include('amazon'),
      $include('cloud', {
        with: {
          title: 'CHANGED',
          navigateTo: 'custom'
        }
      }),
      $include('customer', {
        with: {
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

  it('takes precedence over style rules', () => {
    const { nodes } = computeView([
      // has shape browser and primary color
      $include('cloud.frontend'),
      // style all elements
      $style('*', {
        color: 'muted'
      }),
      // override color
      $include('cloud', {
        with: {
          color: 'red'
        }
      }),
      // override shape
      $include('amazon', {
        with: {
          shape: 'queue'
        }
      }),
      // style only cloud, color should be red
      $style('cloud', {
        color: 'green',
        shape: 'cylinder'
      })
    ])
    const cloud = nodes.find(n => n.id === 'cloud')
    expect(cloud).toMatchObject({
      color: 'red',
      shape: 'cylinder'
    })
    const amazon = nodes.find(n => n.id === 'amazon')
    expect(amazon).toMatchObject({
      color: 'muted',
      shape: 'queue'
    })
    const frontend = nodes.find(n => n.id === 'cloud.frontend')
    expect(frontend).toMatchObject({
      color: 'muted',
      shape: 'browser'
    })
  })
})
