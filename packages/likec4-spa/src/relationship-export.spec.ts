// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import {
  createRelationshipExportView,
  createRelationshipExportViewModel,
  generateRelationshipDrawioEditUrl,
  generateRelationshipExportSource,
  normalizeRelationshipScope,
  relationshipExportFilename,
  relationshipExportSearchSchema,
  renderRelationshipDotSvg,
} from './relationship-export'

describe('relationship export helpers', () => {
  const specs = Builder
    .specification({
      elements: {
        el: {},
      },
    })

  const model = specs
    .model(({ el, rel }, _) =>
      _(
        el('cloud', 'Cloud').with(
          el('backend', 'Backend'),
        ),
        el('amazon', 'Amazon'),
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

  it('defaults relationship export scope to the current view', ({ expect }) => {
    expect(normalizeRelationshipScope(undefined)).toBe('view')
    expect(normalizeRelationshipScope('global')).toBe('global')
  })

  it('parses relationship export search params', ({ expect }) => {
    expect(relationshipExportSearchSchema.parse({ relationships: 'cloud.backend', relationshipScope: 'global' }))
      .toEqual({
        relationships: 'cloud.backend',
        relationshipScope: 'global',
      })
    expect(relationshipExportSearchSchema.parse({ relationships: '', relationshipScope: 'local' })).toEqual({
      relationships: undefined,
      relationshipScope: undefined,
    })
  })

  it('creates a stable filename from the base view and subject', ({ expect }) => {
    expect(relationshipExportFilename('index', 'cloud.backend', 'png')).toBe(
      'index-relationships-cloud.backend.png',
    )
  })

  it('wraps the generated relationship view as a generator-compatible view model', ({ expect }) => {
    const view = createRelationshipExportView({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })
    const viewmodel = createRelationshipExportViewModel(model, view)

    expect(viewmodel.titleOrId).toBe('Context relationships of Backend')
    expect(viewmodel.$view.id).toBe('index-relationships-cloud.backend')
    expect(viewmodel.$model).toBe(model)
    expect(viewmodel.$styles).toBe(model.$styles)
  })

  it('generates DOT, D2, Mermaid, PlantUML and Draw.io sources for relationship views', async ({ expect }) => {
    const params = {
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    } as const

    await expect(generateRelationshipExportSource('dot', params)).resolves.toContain('"Backend"')
    await expect(generateRelationshipExportSource('d2', params)).resolves.toContain('Backend')
    await expect(generateRelationshipExportSource('mmd', params)).resolves.toContain('Backend')
    await expect(generateRelationshipExportSource('puml', params)).resolves.toContain('Backend')
    await expect(generateRelationshipExportSource('drawio', params)).resolves.toContain('<mxfile ')
  })

  it('renders relationship DOT as an SVG preview', async ({ expect }) => {
    const dot = await generateRelationshipExportSource('dot', {
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })

    await expect(renderRelationshipDotSvg(dot)).resolves.toContain('<svg')
  })

  it('generates a draw.io edit URL for relationship views', async ({ expect }) => {
    const url = await generateRelationshipDrawioEditUrl({
      model,
      baseViewId: 'index',
      subjectId: 'cloud.backend',
      scope: 'view',
    })

    expect(url).toMatch(/^https:\/\/app\.diagrams\.net\/#create=/)
  })
})
