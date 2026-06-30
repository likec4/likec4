// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { relationshipEdgeLabelMaxWidth } from './StaticRelationshipsBrowser'

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
