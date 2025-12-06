import type { Fqn } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { findNodeByModelFqn } from './utils'

describe('findNodeByModelFqn', () => {
  it('returns null when xynodes array is empty', () => {
    const result = findNodeByModelFqn([], 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when no node has matching modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns node when modelFqn matches', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node3', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } })
  })

  it('returns first matching node when multiple nodes have same modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node1', data: { modelFqn: 'cloud.api' as Fqn } })
  })

  it('returns null when node has null modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: null } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when node has no modelFqn property', () => {
    const xynodes = [
      { id: 'node1', data: {} },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('handles nodes with mixed data shapes', () => {
    const xynodes = [
      { id: 'node1', data: {} }, // no modelFqn
      { id: 'node2', data: { modelFqn: null } }, // null modelFqn
      { id: 'node3', data: { modelFqn: 'cloud.frontend' as Fqn } }, // different FQN
      { id: 'node4', data: { modelFqn: 'cloud.api' as Fqn } }, // matching FQN
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node4', data: { modelFqn: 'cloud.api' as Fqn } })
  })
})
