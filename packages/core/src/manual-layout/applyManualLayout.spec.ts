import { describe, expect, it } from 'vitest'

import { indexBy } from 'remeda'
import { _type } from '../types'
import { type NodeIds, type Patches, generateView } from './__test__/fixture'
import { applyManualLayout } from './applyManualLayout'

function testApplyManualLayout(patches?: Patches) {
  const { snapshot, layouted } = generateView(patches)

  const result = applyManualLayout(layouted, snapshot)

  const resultNodes = indexBy(result.nodes, n => n.id as NodeIds)
  const snapshotNodes = indexBy(snapshot.nodes, n => n.id as NodeIds)

  return {
    result,
    resultNodes,
    snapshotNodes,
    snapshot,
    layouted,
  }
}

describe('applyManualLayout', () => {
  it('should detect type-changed drift', () => {
    const { result, snapshot, layouted } = testApplyManualLayout({
      view: {
        // Change view type from 'element' to 'deployment'
        _type: 'deployment' as any,
      },
    })
    expect(layouted[_type]).toBe('deployment')

    expect(result.drifts).toEqual(['type-changed'])
    expect(result[_type]).toBe(snapshot[_type])
    expect(result[_type]).not.toBe(layouted[_type])
  })

  it('should apply manual layout without drifts when nothing changed', () => {
    const { result, snapshot } = testApplyManualLayout()

    expect(result._layout).toBe('manual')
    expect(result.drifts).toBeUndefined()
    expect(result.nodes).toHaveLength(snapshot.nodes.length)
  })

  it('should detect nodes-added drift', () => {
    const { result } = testApplyManualLayout({
      nodes: {
        'newnode': {
          title: 'New Node',
          x: 100,
          y: 100,
        },
      },
    })

    expect(result.drifts).toEqual(['nodes-added'])
  })

  it('should detect nodes-removed drift', () => {
    const { result, resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': null,
      },
    })

    expect(result.drifts).toEqual(['nodes-removed'])
    expect(result.nodes).toContain(customer)
    expect(customer.drifts).toContain('missing')
  })

  it('should auto-apply color and kind changes', () => {
    const { result, resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          color: 'secondary',
          kind: 'system',
        },
      },
    })

    expect(customer.color).toBe('secondary')
    expect(customer.kind).toBe('system')
    expect(customer.drifts).toBeUndefined()
    expect(result.drifts).toBeUndefined()
  })

  it('should auto-apply tags changes', () => {
    const { result, resultNodes, snapshotNodes } = testApplyManualLayout({
      nodes: {
        'customer': {
          tags: ['tag-1', 'tag-3'],
        },
      },
    })
    expect(resultNodes.customer).not.toEqual(snapshotNodes.customer)

    expect(resultNodes.customer.tags).toEqual(['tag-1', 'tag-3'])
    expect(resultNodes.customer.drifts).toBeUndefined()
    expect(result.drifts).toBeUndefined()
  })

  it('should auto-apply shape change when size not changed', () => {
    const { resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          shape: 'cylinder',
        },
      },
    })

    expect(customer.shape).toBe('cylinder')
    expect(customer.drifts).toBeUndefined()
  })

  it('should detect shape-changed drift when size increased', () => {
    const { result, resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': d => {
          d.shape = 'cylinder'
          d.width = d.width + 100
        },
      },
    })

    expect(customer.drifts).toEqual(['shape-changed'])
    expect(result.drifts).toEqual(['nodes-drift'])
  })

  it('should auto-apply title change when size not changed', () => {
    const { resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          title: 'Updated Customer',
        },
      },
    })

    expect(customer.title).toBe('Updated Customer')
    expect(customer.drifts).toBeUndefined()
  })

  it('should detect label-changed drift when size increased significantly', () => {
    const { result, resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': d => {
          d.title = 'A Much Longer Title That Requires More Space'
          d.width = d.width + 100
          d.height = d.height + 50
        },
      },
    })

    expect(customer.drifts).toEqual(['label-changed'])
    expect(result.drifts).toEqual(['nodes-drift'])
  })

  it('should auto-apply icon change when icon was already set', () => {
    const { resultNodes } = testApplyManualLayout({
      nodes: {
        'saas.frontend': {
          icon: 'tech:vue',
        },
      },
    })

    expect(resultNodes['saas.frontend'].icon).toBe('tech:vue')
    expect(resultNodes['saas.frontend'].drifts).toBeUndefined()
  })

  it('should auto-apply icon removal', () => {
    const { resultNodes } = testApplyManualLayout({
      nodes: {
        'saas.frontend': {
          icon: 'none',
        },
      },
    })

    expect(resultNodes['saas.frontend'].icon).toBe('none')
    expect(resultNodes['saas.frontend'].drifts).toBeUndefined()
  })

  it('should detect label-changed drift when icon added and size increased', () => {
    const { result, resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': d => {
          d.icon = 'tech:aws'
          d.width = d.width + 100
        },
      },
    })

    expect(customer.drifts).toEqual(['label-changed'])
    expect(result.drifts).toEqual(['nodes-drift'])
  })

  it('should auto-apply description and technology changes', () => {
    const description = {
      md: 'Updated description to markdown',
    }
    const { resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          description: description,
          technology: 'Web',
        },
      },
    })

    expect(customer.description).toEqual(description)
    expect(customer.technology).toBe('Web')
    expect(customer.drifts).toBeUndefined()
  })

  it('should detect parent-changed drift', () => {
    const { result, resultNodes } = testApplyManualLayout({
      nodes: {
        'saas.frontend': {
          parent: 'customer' as any,
        },
      },
    })

    expect(resultNodes['saas.frontend'].drifts).toEqual(['parent-changed'])
    expect(result.drifts).toEqual(['nodes-drift'])
  })

  it('should detect became-compound drift', () => {
    const { resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          children: ['saas'] as any,
        },
      },
    })

    expect(customer.drifts).toContain('became-compound')
  })

  it('should detect became-leaf drift', () => {
    const { resultNodes } = testApplyManualLayout({
      nodes: {
        'saas': {
          children: [],
        },
      },
    })

    expect(resultNodes.saas.drifts).toContain('became-leaf')
  })

  it('should detect children-changed drift', () => {
    const { resultNodes } = testApplyManualLayout({
      nodes: {
        'saas': d => {
          d.children = ['saas.frontend'] as any
        },
      },
    })

    expect(resultNodes.saas.drifts).toContain('children-changed')
  })

  it('should auto-apply style.border, style.opacity, style.multiple', () => {
    const { resultNodes: { customer } } = testApplyManualLayout({
      nodes: {
        'customer': {
          style: {
            border: 'dashed',
            opacity: 0.5,
            multiple: true,
          },
        },
      },
    })

    expect(customer.style.border).toBe('dashed')
    expect(customer.style.opacity).toBe(0.5)
    expect(customer.style.multiple).toBe(true)
    expect(customer.drifts).toBeUndefined()
  })

  it('should apply view metadata from auto-layouted', () => {
    const { result } = testApplyManualLayout({
      view: {
        title: 'New Title',
        description: {
          txt: 'New Description',
        },
        tags: ['view-tag'],
      },
    })

    expect(result.title).toBe('New Title')
    expect(result.description).toEqual({
      txt: 'New Description',
    })
    expect(result.tags).toEqual(['view-tag'])
  })

  it('should auto-apply labels to compound nodes always', () => {
    const { result, resultNodes } = testApplyManualLayout({
      nodes: {
        'saas': d => {
          d.title = 'Updated SaaS'
          d.description = {
            md: 'New description',
          }
          d.width = d.width + 200
        },
      },
    })

    expect(resultNodes.saas.title).toBe('Updated SaaS')
    expect(resultNodes.saas.description).toEqual({ md: 'New description' })
    expect(resultNodes.saas.drifts).toBeUndefined()
    expect(result.drifts).toBeUndefined()
  })
})
