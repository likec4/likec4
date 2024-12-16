import { describe, expect, it } from 'vitest'
import { $include, computeView } from './fixture'

describe('expand-element-expr', () => {
  it('dont expand if no in/out relations ', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('cloud._')
    ])
    expect(nodeIds).toEqual(['cloud'])
    expect(edgeIds).toEqual([])
  })

  it('expand nested with in/out relations', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud._')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud',
      'cloud.frontend'
    ])
    expect(edgeIds).toEqual([
      'customer:cloud.frontend'
    ])
  })

  it('expand nested with in/out relations (with implicits)', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('cloud._'), // should expand cloud and cloud.frontend
      $include('amazon') // should include cloud.backend (implicit from cloud._)
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'amazon'
    ])
    expect(edgeIds).toEqual([
      'customer:cloud.frontend',
      'cloud.backend:amazon'
    ])
  })

  it('expand nested with in/out relations (with implicits and nested relations)', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('customer'),
      $include('amazon.s3'),
      $include('cloud._')
    ])
    expect(nodeIds).toEqual([
      'customer',
      'cloud',
      'cloud.frontend',
      'cloud.backend',
      'amazon.s3'
    ])
    expect(edgeIds).toEqual([
      'cloud.frontend:cloud.backend',
      'customer:cloud.frontend',
      'cloud.backend:amazon.s3'
    ])
  })

  it('expand if nested have relations with elements outside', () => {
    const { nodeIds, edgeIds } = computeView([
      $include('cloud._'),
      $include('amazon._')
    ])
    expect(nodeIds).toEqual([
      'cloud',
      'cloud.backend',
      'amazon',
      'amazon.s3'
    ])
    expect(edgeIds).toEqual([
      'cloud.backend:amazon.s3'
    ])
  })
})
