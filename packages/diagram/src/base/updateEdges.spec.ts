// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import type { BaseEdge } from './types'
import { updateEdges } from './updateEdges'

type TestEdge = BaseEdge<{
  label: string
}>

function createEdge(
  id: string,
  overrides: Partial<TestEdge> = {},
): TestEdge {
  return {
    id,
    type: 'default',
    source: 'source',
    target: 'target',
    data: {
      label: id,
    },
    ...overrides,
  }
}

describe('updateEdges', () => {
  it('updates ariaLabel property', () => {
    const current = [createEdge('edge1', { ariaLabel: 'Old label' })]
    const update = [createEdge('edge1', { ariaLabel: 'New label' })]

    const result = updateEdges(current, update)

    expect(result).not.toBe(current)
    expect(result[0]?.ariaLabel).toBe('New label')
    expect(result[0]?.data).toBe(current[0]?.data)
  })

  it('updates ariaRole property', () => {
    const current = [createEdge('edge1', { ariaRole: 'group' })]
    const update = [createEdge('edge1', { ariaRole: 'button' })]

    const result = updateEdges(current, update)

    expect(result).not.toBe(current)
    expect(result[0]?.ariaRole).toBe('button')
    expect(result[0]?.data).toBe(current[0]?.data)
  })
})
