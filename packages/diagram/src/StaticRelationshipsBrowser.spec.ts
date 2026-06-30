// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { compoundPortTop, relationshipEdgeLabelMaxWidth } from './StaticRelationshipsBrowser'

describe('relationshipEdgeLabelMaxWidth', () => {
  it('subtracts label padding from the absolute edge span', ({ expect }) => {
    expect(relationshipEdgeLabelMaxWidth(100, 300)).toBe(130)
    expect(relationshipEdgeLabelMaxWidth(300, 100)).toBe(130)
  })

  it('never returns a negative label width', ({ expect }) => {
    expect(relationshipEdgeLabelMaxWidth(100, 130)).toBe(0)
    expect(relationshipEdgeLabelMaxWidth(130, 100)).toBe(0)
  })

  it('caps long relationship labels', ({ expect }) => {
    expect(relationshipEdgeLabelMaxWidth(100, 700)).toBe(250)
  })
})

describe('compoundPortTop', () => {
  it('spaces compound handles inside the node bounds', ({ expect }) => {
    expect(compoundPortTop(0, 3)).toBe('25%')
    expect(compoundPortTop(1, 3)).toBe('50%')
    expect(compoundPortTop(2, 3)).toBe('75%')
  })

  it('keeps the last compound handle inside the node for dense ports', ({ expect }) => {
    const top = compoundPortTop(9, 10)

    expect(Number.parseFloat(top)).toBeCloseTo(90.909, 3)
    expect(top).toMatch(/%$/)
  })
})
