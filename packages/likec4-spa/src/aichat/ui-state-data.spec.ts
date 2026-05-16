// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import {
  buildElementTemplateVariables,
  getSelectedElementId,
  interpolateChatTemplate,
  mapElementContextData,
  mapViewEdgeData,
} from './ui-state-data'

describe('AI UI state data', () => {
  it('maps view edges without relation details by default', () => {
    const [edge] = mapViewEdgeData(viewModel())

    expect(edge).toEqual({
      id: 'edge-1',
      source: 'sensorServices',
      target: 'ssr_app',
      label: '[...]',
      technology: 'nvsci',
    })
  })

  it('maps underlying relation metadata when requested', () => {
    const [edge] = mapViewEdgeData(viewModel(), { includeRelations: true })

    expect(edge?.relations).toEqual([
      {
        id: 'rel-1',
        source: 'sensorServices.cameraSensor0.outputSelectorIsp1',
        target: 'ssr_app',
        title: 'IMAGE_NATIVE_PROCESSED -> EXTERNAL:SENSOR_SERVICES_SSR_CAMERA_SENSOR0_CUDA_PROCESSED1 :dwImageHandle_t',
        technology: 'nvsci',
        metadata: {
          datatype: 'dwImageHandle_t',
          src_port: 'IMAGE_NATIVE_PROCESSED',
          dst_port: 'EXTERNAL:SENSOR_SERVICES_SSR_CAMERA_SENSOR0_CUDA_PROCESSED1',
          tags: 'camera, ssr',
        },
      },
    ])
  })

  it('maps rich element context with configured relationship metadata', () => {
    const { api, view } = elementFixture()

    expect(mapElementContextData(api, view, {
      relationships: {
        links: true,
      },
    })).toEqual({
      id: 'cloud.api',
      title: 'API',
      kind: 'component',
      technology: 'Node.js',
      summary: 'Handles requests',
      description: 'GraphQL API',
      tags: ['public'],
      links: [{ url: 'https://example.com/api', title: 'API docs' }],
      metadata: {
        owner: 'team-a',
        tags: 'critical, external',
        details: '{"tier":"gold"}',
      },
      parent: {
        id: 'cloud',
        title: 'Cloud',
        kind: 'system',
        technology: null,
      },
      children: [],
      incoming: [
        {
          id: 'rel-web-api',
          source: {
            id: 'cloud.web',
            title: 'Web',
            kind: 'component',
            technology: 'React',
          },
          target: {
            id: 'cloud.api',
            title: 'API',
            kind: 'component',
            technology: 'Node.js',
          },
          title: 'calls',
          technology: 'HTTPS',
          metadata: {
            datatype: 'JSON',
          },
          links: [{ url: 'https://example.com/relation', title: null }],
        },
      ],
      outgoing: [
        {
          id: 'rel-api-db',
          source: {
            id: 'cloud.api',
            title: 'API',
            kind: 'component',
            technology: 'Node.js',
          },
          target: {
            id: 'cloud.db',
            title: 'Database',
            kind: 'component',
            technology: 'PostgreSQL',
          },
          title: 'reads',
          technology: 'SQL',
          metadata: {
            port: '5432',
          },
        },
      ],
      alsoAppearsInViews: [{
        id: 'api',
        title: 'API',
        type: 'element',
      }],
    })
  })

  it('honors element context switches and limits', () => {
    const { api, view } = elementFixture()

    expect(mapElementContextData(api, view, {
      element: {
        description: false,
        metadata: false,
        incoming: false,
        outgoing: false,
        alsoAppearsInViews: false,
      },
      limits: {
        children: 1,
      },
    })).toMatchObject({
      id: 'cloud.api',
      children: [],
    })
    expect(mapElementContextData(api, view, {
      element: {
        description: false,
        metadata: false,
        incoming: false,
        outgoing: false,
        alsoAppearsInViews: false,
      },
    })).not.toHaveProperty('description')
  })

  it('builds template variables and hides empty suggested questions', () => {
    const { api, view } = elementFixture()
    const variables = buildElementTemplateVariables(api, view)

    expect(interpolateChatTemplate(
      'What depends on {title} in {view}?',
      variables,
      { hideIfEmpty: true },
    )).toBe('What depends on API in Overview?')
    expect(interpolateChatTemplate(
      'Uses {unknown}',
      variables,
      { hideIfEmpty: true },
    )).toBe('Uses {unknown}')
    expect(interpolateChatTemplate(
      'What uses {technology}?',
      buildElementTemplateVariables(null, view),
      { hideIfEmpty: true },
    )).toBeNull()
  })

  it('gets selected or focused element id from diagram context', () => {
    expect(getSelectedElementId({
      focusedNode: 'api-node',
      xynodes: [{
        id: 'api-node',
        data: {
          modelFqn: 'cloud.api',
        },
      }],
    })).toBe('cloud.api')
  })
})

function viewModel() {
  return {
    edges: () => [
      {
        id: 'edge-1',
        source: { id: 'sensorServices' },
        target: { id: 'ssr_app' },
        label: '[...]',
        technology: 'nvsci',
        relationships: () => [
          {
            id: 'rel-1',
            source: { id: 'sensorServices.cameraSensor0.outputSelectorIsp1' },
            target: { id: 'ssr_app' },
            title:
              'IMAGE_NATIVE_PROCESSED -> EXTERNAL:SENSOR_SERVICES_SSR_CAMERA_SENSOR0_CUDA_PROCESSED1 :dwImageHandle_t',
            technology: 'nvsci',
            metadata: {
              datatype: 'dwImageHandle_t',
              src_port: 'IMAGE_NATIVE_PROCESSED',
              dst_port: 'EXTERNAL:SENSOR_SERVICES_SSR_CAMERA_SENSOR0_CUDA_PROCESSED1',
              tags: ['camera', 'ssr'],
            },
          },
        ],
      },
    ],
  }
}

function richText(text: string) {
  return {
    isEmpty: text.length === 0,
    text,
  }
}

function elementFixture() {
  const view = {
    id: 'overview',
    title: 'Overview',
    _type: 'element' as const,
  }
  const apiView = {
    id: 'api',
    title: 'API',
    _type: 'element' as const,
  }
  const parent = {
    id: 'cloud',
    title: 'Cloud',
    kind: 'system',
    technology: null,
    summary: richText(''),
    description: richText(''),
    tags: [],
    links: [],
    metadata: {},
    parent: null,
    children: () => [],
    incoming: () => [],
    outgoing: () => [],
    views: () => [view],
  }
  const web = {
    id: 'cloud.web',
    title: 'Web',
    kind: 'component',
    technology: 'React',
    summary: richText(''),
    description: richText(''),
    tags: [],
    links: [],
    metadata: {},
    parent,
    children: () => [],
    incoming: () => [],
    outgoing: () => [],
    views: () => [view],
  }
  const db = {
    id: 'cloud.db',
    title: 'Database',
    kind: 'component',
    technology: 'PostgreSQL',
    summary: richText(''),
    description: richText(''),
    tags: [],
    links: [],
    metadata: {},
    parent,
    children: () => [],
    incoming: () => [],
    outgoing: () => [],
    views: () => [view],
  }
  const api = {
    id: 'cloud.api',
    title: 'API',
    kind: 'component',
    technology: 'Node.js',
    summary: richText('Handles requests'),
    description: richText('GraphQL API'),
    tags: ['public'],
    links: [{ url: 'https://example.com/api', title: 'API docs' }],
    metadata: {
      owner: 'team-a',
      tags: ['critical', 'external'],
      details: { tier: 'gold' },
    },
    parent,
    children: () => [],
    incoming: () => [
      {
        id: 'rel-web-api',
        source: web,
        target: api,
        title: 'calls',
        technology: 'HTTPS',
        metadata: {
          datatype: 'JSON',
        },
        links: [{ url: 'https://example.com/relation', title: null }],
      },
    ],
    outgoing: () => [
      {
        id: 'rel-api-db',
        source: api,
        target: db,
        title: 'reads',
        technology: 'SQL',
        metadata: {
          port: '5432',
        },
        links: [],
      },
    ],
    views: () => [view, apiView],
  }
  return { api, view }
}
