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

  it('inherits scoped view styling for relationship export nodes', ({ expect }) => {
    const styledSpecs = Builder
      .specification({
        elements: {
          el: {
            style: {
              opacity: 20,
            },
          },
        },
      })

    const model = styledSpecs
      .model(({ el, rel }, _) =>
        _(
          el('cloud').with(
            el('backend', {
              icon: 'tech:nestjs',
            }),
          ),
          el('amazon'),
          rel('cloud.backend', 'amazon', 'uses'),
        )
      )
      .views(({ view, $include, $style }, _) =>
        _(
          view('index', 'Context').with(
            $include('cloud.*'),
            $include('amazon'),
            $style('cloud.backend', {
              color: 'green',
              icon: 'none',
              shape: 'component',
              opacity: 80,
            }),
            $style('amazon', {
              color: 'amber',
              shape: 'queue',
            }),
          ),
        )
      )
      .toLikeC4Model()

    expect(model.element('cloud.backend').icon).toBe('tech:nestjs')

    const view = computeRelationshipViewExport({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })

    expect(view.nodes.find(n => n.id === 'subject-cloud.backend')).toMatchObject({
      color: 'green',
      icon: null,
      shape: 'component',
      style: expect.objectContaining({
        opacity: 80,
      }),
    })
    expect(view.nodes.find(n => n.id === 'out-amazon')).toMatchObject({
      color: 'amber',
      shape: 'queue',
    })
  })

  it('inherits scoped ancestor styling for relationship export nodes', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud', {
            color: 'red',
            shape: 'component',
          }).with(
            el('backend', {
              shape: 'queue',
            }),
          ),
          el('amazon'),
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
              shape: 'browser',
              opacity: 80,
            }),
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

    expect(view.nodes.find(n => n.id === 'subject-cloud.backend')).toMatchObject({
      color: 'green',
      shape: 'queue',
      style: expect.objectContaining({
        opacity: 80,
      }),
    })
  })

  it('preserves child styling when inheriting from a scoped ancestor', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud', {
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
          el('amazon'),
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

    expect(view.nodes.find(n => n.id === 'subject-cloud.backend')).toMatchObject({
      color: 'red',
      icon: 'tech:nestjs',
      shape: 'queue',
      style: expect.objectContaining({
        opacity: 40,
        size: 'xs',
      }),
    })
  })

  it('inherits styling from the nearest scoped ancestor', ({ expect }) => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('cloud').with(
            el('region').with(
              el('backend'),
            ),
          ),
          el('amazon'),
          rel('cloud.region.backend', 'amazon', 'uses'),
        )
      )
      .views(({ view, $include, $style }, _) =>
        _(
          view('index', 'Context').with(
            $include('cloud'),
            $include('cloud.region'),
            $include('amazon'),
            $style('cloud', {
              color: 'red',
              opacity: 80,
            }),
            $style('cloud.region', {
              color: 'green',
              opacity: 60,
            }),
          ),
        )
      )
      .toLikeC4Model()

    const view = computeRelationshipViewExport({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.region.backend',
      scope: 'view',
    })

    expect(view.nodes.find(n => n.id === 'subject-cloud.region.backend')).toMatchObject({
      color: 'green',
      style: expect.objectContaining({
        opacity: 60,
      }),
    })
  })

  it('preserves computed element defaults for global relationship export nodes', ({ expect }) => {
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
      .toLikeC4Model({
        id: 'test',
        styles: {
          defaults: {
            size: 'lg',
          },
        },
      })

    const view = computeRelationshipViewExport({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'global',
    })

    expect(view.nodes.find(n => n.id === 'subject-cloud.backend')?.style).toMatchObject({
      opacity: 15,
      size: 'lg',
    })
  })
})
