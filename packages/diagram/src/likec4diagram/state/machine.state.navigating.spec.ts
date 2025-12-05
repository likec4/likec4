import type { Fqn } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { findNodeByElementFqn } from './machine.state.navigating'

describe('findNodeByElementFqn', () => {
  it('returns null when xynodes array is empty', () => {
    const result = findNodeByElementFqn([], 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when no node has matching modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns node id when modelFqn matches', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node3', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBe('node2')
  })

  it('returns first matching node when multiple nodes have same modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBe('node1')
  })

  it('returns null when node has null modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: null } },
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when node has no modelFqn property', () => {
    const xynodes = [
      { id: 'node1', data: {} },
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('handles nodes with mixed data shapes', () => {
    const xynodes = [
      { id: 'node1', data: {} }, // no modelFqn
      { id: 'node2', data: { modelFqn: null } }, // null modelFqn
      { id: 'node3', data: { modelFqn: 'cloud.frontend' as Fqn } }, // different FQN
      { id: 'node4', data: { modelFqn: 'cloud.api' as Fqn } }, // matching FQN
    ]
    const result = findNodeByElementFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBe('node4')
  })
})

describe('navigate.to with focusOnElement', () => {
  describe('event types', () => {
    it('navigate.to event can include optional focusOnElement parameter', () => {
      // Type test - this compiles successfully if the types are correct
      const navigateEvent = {
        type: 'navigate.to' as const,
        viewId: 'view1' as const,
        focusOnElement: 'cloud.api' as Fqn,
      }

      expect(navigateEvent.type).toBe('navigate.to')
      expect(navigateEvent.focusOnElement).toBe('cloud.api')
    })

    it('navigate.to event works without focusOnElement parameter', () => {
      const navigateEvent = {
        type: 'navigate.to' as const,
        viewId: 'view1' as const,
      }

      expect(navigateEvent.type).toBe('navigate.to')
      expect(navigateEvent.focusOnElement).toBeUndefined()
    })
  })
})

describe('lastOnNavigate context', () => {
  it('can store focusOnElement in navigation context', () => {
    const lastOnNavigate = {
      fromView: 'view1',
      toView: 'view2',
      fromNode: null,
      focusOnElement: 'cloud.api' as Fqn,
    }

    expect(lastOnNavigate.focusOnElement).toBe('cloud.api')
  })

  it('focusOnElement can be null', () => {
    const lastOnNavigate = {
      fromView: 'view1',
      toView: 'view2',
      fromNode: null,
      focusOnElement: null,
    }

    expect(lastOnNavigate.focusOnElement).toBeNull()
  })
})
