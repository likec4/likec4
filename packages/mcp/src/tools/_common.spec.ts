// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LayoutedLikeC4ModelData, LayoutedView } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildRenderPayload, projectConfigSchema, serializeConfig } from './_common'

const selectedView = {
  _stage: 'layouted',
  _type: 'deployment',
  id: 'selected',
  nodes: [
    { id: 'root.child', modelRef: 'root.child', tags: [], style: {} },
    { id: 'prod.node.app', deploymentRef: 'prod.node.app', tags: [], style: {} },
  ],
  edges: [{ id: 'edge', source: 'root.child', target: 'prod.node.app', relations: ['r1', 'dr1'] }],
} as unknown as LayoutedView

const modelData = {
  _stage: 'layouted',
  projectId: 'default',
  project: { id: 'default', styles: {}, manualLayouts: {} },
  specification: { elements: {}, deployments: {}, relationships: {}, tags: {} },
  globals: { predicates: {}, dynamicPredicates: {}, styles: {} },
  elements: {
    root: { id: 'root', kind: 'system', title: 'Root', style: {} },
    'root.child': { id: 'root.child', kind: 'system', title: 'Child', style: {} },
    unused: { id: 'unused', kind: 'system', title: 'Unused', style: {} },
  },
  imports: {
    external: [
      { id: 'service', kind: 'system', title: 'Service', style: {} },
      { id: 'service.api', kind: 'system', title: 'API', style: {} },
      { id: 'unused', kind: 'system', title: 'Unused import', style: {} },
    ],
  },
  relations: {
    r1: {
      id: 'r1',
      source: { model: 'root.child' },
      target: { project: 'external', model: 'service.api' },
    },
    unused: { id: 'unused', source: { model: 'unused' }, target: { model: 'root' } },
  },
  deployments: {
    elements: {
      prod: { id: 'prod', kind: 'environment', title: 'Prod', style: {} },
      'prod.node': { id: 'prod.node', kind: 'node', title: 'Node', style: {} },
      'prod.node.app': { id: 'prod.node.app', element: 'root.child', style: {} },
      unused: { id: 'unused', kind: 'environment', title: 'Unused', style: {} },
    },
    relations: {
      dr1: {
        id: 'dr1',
        source: { deployment: 'prod.node.app' },
        target: { deployment: 'prod.node.app', element: 'root.child' },
      },
      unused: {
        id: 'unused',
        source: { deployment: 'unused' },
        target: { deployment: 'prod' },
      },
    },
  },
  views: {
    selected: selectedView,
    other: { ...selectedView, id: 'other' },
  },
  manualLayouts: { unused: { hash: 'unused' } },
} as unknown as LayoutedLikeC4ModelData

describe('serializeConfig', () => {
  it('should serialize minimal config with name only', () => {
    const config = { name: 'test' }
    const result = serializeConfig(config)
    expect(result.name).toBe('test')
    expect(result.title).toBeUndefined()
    expect(result.contactPerson).toBeUndefined()
  })

  it('should serialize config with all optional fields', () => {
    const config = {
      name: 'test',
      title: 'Test Project',
      contactPerson: 'john@example.com',
      extends: '/path/to/base.config.json',
      exclude: ['**/node_modules/**', '**/dist/**'],
      include: { paths: ['src/**'], maxDepth: 5, fileThreshold: 100 },
      manualLayouts: { outDir: '.likec4/layouts' },
    }
    const result = serializeConfig(config)
    expect(result.name).toBe('test')
    expect(result.title).toBe('Test Project')
    expect(result.contactPerson).toBe('john@example.com')
    expect(result.extends).toBe('/path/to/base.config.json')
    expect(result.exclude).toEqual(['**/node_modules/**', '**/dist/**'])
    expect(result.include).toEqual({ paths: ['src/**'], maxDepth: 5, fileThreshold: 100 })
    expect(result.manualLayouts).toEqual({ outDir: '.likec4/layouts' })
  })

  it('should handle extends as array', () => {
    const config = { name: 'test', extends: ['/path/1', '/path/2'] }
    const result = serializeConfig(config)
    expect(result.extends).toEqual(['/path/1', '/path/2'])
  })

  it('should simplify styles to boolean flags when theme is present', () => {
    const config = {
      name: 'test',
      styles: {
        theme: { colors: { primary: '#000' } },
      },
    } as any
    const result = serializeConfig(config)
    expect(result.styles).toEqual({
      hasTheme: true,
      hasDefaults: false,
      hasCustomCss: false,
    })
  })

  it('should simplify styles to boolean flags when defaults is present', () => {
    const config = {
      name: 'test',
      styles: {
        defaults: { elementColor: 'blue' },
      },
    } as any
    const result = serializeConfig(config)
    expect(result.styles).toEqual({
      hasTheme: false,
      hasDefaults: true,
      hasCustomCss: false,
    })
  })

  it('should simplify styles to boolean flags when customCss is present', () => {
    const config = {
      name: 'test',
      styles: {
        customCss: { content: 'body { margin: 0; }' },
      },
    }
    const result = serializeConfig(config)
    expect(result.styles).toEqual({
      hasTheme: false,
      hasDefaults: false,
      hasCustomCss: true,
    })
  })

  it('should simplify styles to boolean flags when all are present', () => {
    const config = {
      name: 'test',
      styles: {
        theme: { colors: { primary: '#000' } },
        defaults: { elementColor: 'blue' },
        customCss: { content: 'body { margin: 0; }' },
      },
    } as any
    const result = serializeConfig(config)
    expect(result.styles).toEqual({
      hasTheme: true,
      hasDefaults: true,
      hasCustomCss: true,
    })
  })

  it('should detect empty styles', () => {
    const config = { name: 'test', styles: {} }
    const result = serializeConfig(config)
    expect(result.styles).toEqual({
      hasTheme: false,
      hasDefaults: false,
      hasCustomCss: false,
    })
  })

  it('should omit styles field when not present', () => {
    const config = { name: 'test' }
    const result = serializeConfig(config)
    expect(result.styles).toBeUndefined()
  })

  it('should omit generators field if present', () => {
    const config = { name: 'test', generators: { 'my-gen': () => {} } }
    const result = serializeConfig(config)
    expect(result).not.toHaveProperty('generators')
  })

  it('should handle include with default values', () => {
    const config = {
      name: 'test',
      include: { paths: ['src/**'] }, // Missing maxDepth and fileThreshold
    } as any
    const result = serializeConfig(config)
    expect(result.include).toEqual({
      paths: ['src/**'],
      maxDepth: 3,
      fileThreshold: 30,
    })
  })

  it('should handle manualLayouts with default outDir', () => {
    const config = {
      name: 'test',
      manualLayouts: {}, // Empty object
    } as any
    const result = serializeConfig(config)
    expect(result.manualLayouts).toEqual({
      outDir: '.likec4',
    })
  })

  it('should omit optional fields when not present', () => {
    const config = { name: 'test' }
    const result = serializeConfig(config)
    expect(result).toEqual({ name: 'test' })
  })

  it('should serialize metadata field with simple values', () => {
    const config = {
      name: 'test',
      metadata: {
        team: 'Platform Team',
        jira: 'PROJ-123',
        customKey: 'customValue',
      },
    }
    const result = serializeConfig(config)
    expect(result.metadata).toEqual({
      team: 'Platform Team',
      jira: 'PROJ-123',
      customKey: 'customValue',
    })
  })

  it('should handle nested metadata objects', () => {
    const config = {
      name: 'test',
      metadata: {
        team: {
          name: 'AV Platform',
          lead: 'Jane Doe',
        },
        links: {
          jira: 'https://jira.example.com/PROJ',
          wiki: 'https://wiki.example.com/project',
        },
      },
    }
    const result = serializeConfig(config)
    expect(result.metadata).toEqual({
      team: {
        name: 'AV Platform',
        lead: 'Jane Doe',
      },
      links: {
        jira: 'https://jira.example.com/PROJ',
        wiki: 'https://wiki.example.com/project',
      },
    })
  })

  it('should handle metadata with various data types', () => {
    const config = {
      name: 'test',
      metadata: {
        stringValue: 'hello',
        numberValue: 42,
        booleanValue: true,
        arrayValue: ['a', 'b', 'c'],
        nullValue: null,
      },
    }
    const result = serializeConfig(config)
    expect(result.metadata).toEqual({
      stringValue: 'hello',
      numberValue: 42,
      booleanValue: true,
      arrayValue: ['a', 'b', 'c'],
      nullValue: null,
    })
  })

  it('should omit metadata when not present', () => {
    const config = { name: 'test' }
    const result = serializeConfig(config)
    expect(result.metadata).toBeUndefined()
  })
})

describe('projectConfigSchema', () => {
  it('should validate config with metadata', () => {
    const config = {
      name: 'test',
      metadata: {
        team: 'Platform',
        jira: 'PROJ-123',
      },
    }

    const result = projectConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata).toEqual({
        team: 'Platform',
        jira: 'PROJ-123',
      })
    }
  })

  it('should validate config without metadata', () => {
    const config = { name: 'test' }

    const result = projectConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata).toBeUndefined()
    }
  })

  it('should validate config with nested metadata', () => {
    const config = {
      name: 'test',
      metadata: {
        nested: {
          deeply: {
            value: 'test',
          },
        },
      },
    }

    const result = projectConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata).toEqual({
        nested: {
          deeply: {
            value: 'test',
          },
        },
      })
    }
  })

  it('should validate metadata with various types', () => {
    const config = {
      name: 'test',
      metadata: {
        string: 'value',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      },
    }

    const result = projectConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
  })
})

describe('buildRenderPayload', () => {
  it('inlines local SVG icons without changing the source view or model', () => {
    const directory = mkdtempSync(join(tmpdir(), 'likec4-mcp-'))
    const iconPath = join(directory, 'node.svg')
    writeFileSync(iconPath, '<svg><path /></svg>')
    const iconUri = pathToFileURL(iconPath).href
    const view = {
      ...selectedView,
      nodes: selectedView.nodes.map(node => node.id === 'root.child' ? { ...node, icon: iconUri } : node),
    } as LayoutedView
    const data = {
      ...modelData,
      elements: {
        ...modelData.elements,
        'root.child': { ...modelData.elements['root.child'], style: { icon: iconUri } },
      },
      views: { ...modelData.views, selected: view },
    } as unknown as LayoutedLikeC4ModelData

    try {
      const payload = buildRenderPayload({
        projectId: 'default',
        viewId: 'selected',
        title: 'Selected',
        layoutedView: view,
        model: LikeC4Model.create(data),
      })
      const payloadModel = payload.model as typeof data

      expect(payload.view.nodes[0]?.icon).toMatch(/^data:image\/svg\+xml/)
      expect(payloadModel.elements['root.child']?.style.icon).toMatch(/^data:image\/svg\+xml/)
      expect(view.nodes[0]?.icon).toBe(iconUri)
      expect(data.elements['root.child']?.style.icon).toBe(iconUri)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('replaces unreadable local SVG icons with null', () => {
    const iconUri = pathToFileURL(join(tmpdir(), 'missing-node.svg')).href
    const view = {
      ...selectedView,
      nodes: selectedView.nodes.map(node => node.id === 'root.child' ? { ...node, icon: iconUri } : node),
    } as LayoutedView

    const payload = buildRenderPayload({
      projectId: 'default',
      viewId: 'selected',
      title: 'Selected',
      layoutedView: view,
      model: LikeC4Model.create(modelData),
    })

    expect(payload.view.nodes[0]?.icon).toBeNull()
  })

  it('keeps only records required by the selected view', () => {
    const payload = buildRenderPayload({
      projectId: 'default',
      viewId: 'selected',
      title: 'Selected',
      layoutedView: selectedView,
      model: LikeC4Model.create(modelData),
    })
    const scoped = payload.model as unknown as typeof modelData

    expect(Object.keys(scoped.elements)).toEqual(['root', 'root.child'])
    expect(Object.keys(scoped.imports)).toEqual(['external'])
    expect(scoped.imports['external']?.map(element => element.id)).toEqual(['service', 'service.api'])
    expect(Object.keys(scoped.relations)).toEqual(['r1'])
    expect(Object.keys(scoped.deployments.elements)).toEqual(['prod', 'prod.node', 'prod.node.app'])
    expect(Object.keys(scoped.deployments.relations)).toEqual(['dr1'])
    expect(Object.keys(scoped.views)).toEqual(['selected'])
    expect(scoped.manualLayouts).toEqual({})
  })

  it('keeps the complete model when fullModel is true', () => {
    const payload = buildRenderPayload({
      projectId: 'default',
      viewId: 'selected',
      title: 'Selected',
      layoutedView: selectedView,
      model: LikeC4Model.create(modelData),
      fullModel: true,
    })
    const full = payload.model as unknown as typeof modelData

    expect(full.elements['unused']).toBeDefined()
    expect(full.imports['external']?.some(element => element.id === 'unused')).toBe(true)
    expect(full.deployments.elements['unused']).toBeDefined()
    expect(Object.keys(full.views)).toEqual(['selected', 'other'])
    expect(full.manualLayouts).toEqual(modelData.manualLayouts)
  })
})
