// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { Builder } from '@likec4/core/builder'
import { computeRelationshipsView, computeRelationshipViewExport } from '@likec4/core/compute-view'
import { describe, it } from 'vitest'
import { layoutRelationshipsView } from './layout'

describe('relationship browser layout', () => {
  it('resolves scoped ancestor styles like relationship source exports', ({ expect }) => {
    const specs = Builder
      .specification({
        elements: {
          el: {
            style: {
              opacity: 20,
            },
          },
        },
      })

    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud', {
            color: 'blue',
            icon: 'tech:cloud',
          }).with(
            el('backend', {
              color: 'red',
              icon: 'tech:nestjs',
              shape: 'queue',
              style: {
                opacity: 40,
                size: 'xs',
              },
            }),
          ),
          el('amazon', {
            icon: 'tech:aws',
          }),
          rel('cloud.backend', 'amazon', 'uses'),
        )
      )
      .views(({ view, $include, $style }, _) =>
        _(
          view('index', 'Context').with(
            $include('cloud'),
            $include('amazon'),
            $style('cloud', {
              color: 'green',
              icon: 'tech:aws',
              opacity: 80,
              shape: 'browser',
              size: 'xl',
            }),
            $style('amazon', {
              color: 'amber',
              icon: 'none',
              shape: 'queue',
            }),
          ),
        )
      )
      .toLikeC4Model()

    const sourceExport = computeRelationshipViewExport({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })
    const browserExport = layoutRelationshipsView(
      computeRelationshipsView('cloud.backend', model, 'index', 'view'),
      model.view('index'),
    )

    const sourceNode = (modelRef: string) => sourceExport.nodes.find(n => n.modelRef === modelRef)
    const browserNode = (modelRef: string) => browserExport.nodes.find(n => n.modelRef === modelRef)

    expect(browserNode('cloud.backend')).toMatchObject({
      color: sourceNode('cloud.backend')?.color,
      icon: sourceNode('cloud.backend')?.icon,
      shape: sourceNode('cloud.backend')?.shape,
      style: sourceNode('cloud.backend')?.style,
    })
    expect(browserNode('amazon')).toMatchObject({
      color: sourceNode('amazon')?.color,
      icon: sourceNode('amazon')?.icon,
      shape: sourceNode('amazon')?.shape,
      style: sourceNode('amazon')?.style,
    })
  })
})
