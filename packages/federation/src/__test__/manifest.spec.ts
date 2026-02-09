import { LikeC4Model } from '@likec4/core/model'
import { describe, expect, it } from 'vitest'
import { buildManifest } from '../manifest'

describe('buildManifest', () => {
  it('builds a manifest from a model with exported elements', () => {
    const model = LikeC4Model.fromDump({
      _stage: 'computed',
      projectId: 'auth-service',
      project: {
        id: 'auth-service',
        name: 'auth-service',
        title: 'Auth Service',
      },
      specification: {
        elements: {
          service: {},
          component: {},
        },
      },
      elements: {
        authService: {
          id: 'authService',
          kind: 'service',
          title: 'Auth Service',
          style: {},
        },
        'authService.api': {
          id: 'authService.api',
          kind: 'component',
          title: 'Auth API',
          style: {},
        },
        'authService.db': {
          id: 'authService.db',
          kind: 'component',
          title: 'Auth DB',
          style: {},
        },
        unrelated: {
          id: 'unrelated',
          kind: 'service',
          title: 'Unrelated Service',
          style: {},
        },
      },
      relations: {
        'rel1': {
          id: 'rel1',
          source: { model: 'authService.api' },
          target: { model: 'authService.db' },
          title: 'reads from',
        },
        'rel2': {
          id: 'rel2',
          source: { model: 'authService.api' },
          target: { model: 'unrelated' },
          title: 'calls',
        },
      },
      deployments: {},
      views: {},
    })

    const manifest = buildManifest(model, {
      exports: ['authService'],
    }, {
      version: '1.0.0',
    })

    expect(manifest.schema).toBe('likec4/federation/v1')
    expect(manifest.name).toBe('auth-service')
    expect(manifest.version).toBe('1.0.0')

    // Should include authService and its children
    expect(Object.keys(manifest.elements)).toContain('authService')
    expect(Object.keys(manifest.elements)).toContain('authService.api')
    expect(Object.keys(manifest.elements)).toContain('authService.db')

    // Should NOT include unrelated
    expect(Object.keys(manifest.elements)).not.toContain('unrelated')

    // Should include rel1 (both endpoints exported) but not rel2 (target not exported)
    expect(Object.keys(manifest.relations)).toContain('rel1')
    expect(Object.keys(manifest.relations)).not.toContain('rel2')

    // No views exported
    expect(manifest.views).toBeUndefined()
  })

  it('returns empty elements when no patterns match', () => {
    const model = LikeC4Model.fromDump({
      _stage: 'computed',
      projectId: 'test',
      specification: {
        elements: { service: {} },
      },
      elements: {
        myService: {
          id: 'myService',
          kind: 'service',
          title: 'My Service',
          style: {},
        },
      },
      relations: {},
      deployments: {},
      views: {},
    })

    const manifest = buildManifest(model, {
      exports: ['nonExistent'],
    }, {
      version: '1.0.0',
    })

    expect(Object.keys(manifest.elements)).toHaveLength(0)
    expect(Object.keys(manifest.relations)).toHaveLength(0)
  })

  it('exports all elements when patterns cover everything', () => {
    const model = LikeC4Model.fromDump({
      _stage: 'computed',
      projectId: 'test',
      specification: {
        elements: { service: {} },
      },
      elements: {
        a: { id: 'a', kind: 'service', title: 'A', style: {} },
        b: { id: 'b', kind: 'service', title: 'B', style: {} },
      },
      relations: {},
      deployments: {},
      views: {},
    })

    const manifest = buildManifest(model, {
      exports: ['a', 'b'],
    }, {
      version: '0.1.0',
    })

    expect(Object.keys(manifest.elements)).toEqual(['a', 'b'])
  })

  it('builds a manifest without version when not provided', () => {
    const model = LikeC4Model.fromDump({
      _stage: 'computed',
      projectId: 'test',
      specification: {
        elements: { service: {} },
      },
      elements: {
        a: { id: 'a', kind: 'service', title: 'A', style: {} },
      },
      relations: {},
      deployments: {},
      views: {},
    })

    const manifest = buildManifest(model, {
      exports: ['a'],
    }, {})

    expect(manifest.schema).toBe('likec4/federation/v1')
    expect(manifest.version).toBeUndefined()
    expect(Object.keys(manifest.elements)).toContain('a')
  })
})
