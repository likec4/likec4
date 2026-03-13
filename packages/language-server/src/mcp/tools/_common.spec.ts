// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { projectConfigSchema, serializeConfig } from './_common'

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
