// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import { computeRelationshipsView } from './compute'
import { layoutRelationshipsView } from './layout'

describe('layoutRelationshipsView', () => {
  const specs = Builder
    .specification({
      elements: {
        el: {},
      },
    })

  it('emits one aggregated edge for multiple displayed relationships between the same nodes', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud').with(
            el('backend'),
          ),
          el('amazon'),
          rel('cloud.backend', 'amazon', 'uses'),
          rel('cloud.backend', 'amazon', 'publishes'),
        )
      )
      .toLikeC4Model()

    const relationshipData = computeRelationshipsView('cloud.backend', model, null)
    const layouted = layoutRelationshipsView(relationshipData)

    expect(layouted.edges).toHaveLength(1)
    const edge = layouted.edges[0]!
    expect(edge).toMatchObject({
      source: 'subject-cloud.backend',
      target: 'out-amazon',
      label: '2 relationships',
    })
    expect(edge.relations).toHaveLength(2)
    expect(edge.points.length).toBeGreaterThan(0)
    expect((edge.points.length - 1) % 3).toBe(0)
  })
})
