// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import { computeRelationshipViewExport } from './export-view'

describe('computeRelationshipViewExport', () => {
  const specs = Builder
    .specification({
      elements: {
        el: {},
      },
    })

  it('creates a layouted relationship export view for the selected subject and base view', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud').with(
            el('backend'),
          ),
          el('amazon'),
          rel('cloud.backend', 'amazon', 'uses'),
        )
      )
      .views(({ view, $include }, _) =>
        _(
          view('index', 'Context').with(
            $include('cloud.*'),
            $include('amazon'),
          ),
        )
      )
      .toLikeC4Model()

    const view = computeRelationshipViewExport({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })

    expect(view).toMatchObject({
      _stage: 'layouted',
      _type: 'element',
      id: 'index-relationships-cloud.backend',
      title: 'Context relationships of backend',
      autoLayout: {
        direction: 'LR',
      },
    })
    expect(view.nodes.map(n => n.id)).toContain('subject-cloud.backend')
    expect(view.edges).toHaveLength(1)
  })
})
