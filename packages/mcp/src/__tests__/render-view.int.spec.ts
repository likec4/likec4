// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from './test-utils'

const UNRELATED_ELEMENTS = Array.from(
  { length: 250 },
  (_, index) => `unused${index} = system 'Unused ${index} ${'x'.repeat(500)}'`,
).join('\n')

const DSL = `
  specification {
    element system
    element container
  }
  model {
    selected = system 'Selected' {
      child = container 'Child'
    }
    peer = system 'Peer'
    unrelated = system 'Unrelated' {
      hidden = container 'Hidden'
    }
    ${UNRELATED_ELEMENTS}
    selected.child -> peer 'uses'
  }
  views {
    view index {
      include selected.child
      include peer
    }
    view unrelatedView {
      include unrelated.*
    }
  }
`

describe('render-view tool', () => {
  it('callTool(render-view) returns structuredContent with a layouted view', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index' },
    })

    expect(result.isError).toBeFalsy()

    const content = structured(result)
    expect(content['id']).toBe('index')
    expect(content['project']).toBe('default')

    const view = content['view'] as Record<string, unknown>
    const nodes = view['nodes'] as Array<Record<string, unknown>>
    expect(nodes.length).toBeGreaterThan(0)

    const firstNode = nodes[0]!
    expect(typeof firstNode['x']).toBe('number')
    expect(typeof firstNode['y']).toBe('number')
    expect(typeof firstNode['width']).toBe('number')
    expect(typeof firstNode['height']).toBe('number')
  })

  it('returns structuredContent.model — enough for the UI to build a LikeC4Model (LikeC4ModelProvider)', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index' },
    })

    const content = structured(result)
    const model = content['model'] as Record<string, unknown>
    expect(model).toBeDefined()
    expect(model['specification']).toBeDefined()
    expect(model['elements']).toBeDefined()
    expect(model['relations']).toBeDefined()
    expect(model['deployments']).toBeDefined()

    const views = model['views'] as Record<string, unknown>
    expect(views['index']).toBeDefined()
  })

  it('normalizes render options for the embedded diagram', async () => {
    await using pair = await createMCPTestPair(DSL)
    const defaultResult = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index' },
    })
    const customResult = await pair.client.callTool({
      name: 'render-view',
      arguments: {
        viewId: 'index',
        render: { size: 'large', fitView: false, initialZoom: 0.75 },
      },
    })

    expect(structured(defaultResult)['render']).toEqual({ size: 'standard', fitView: true })
    expect(structured(customResult)['render']).toEqual({ size: 'large', fitView: false, initialZoom: 0.75 })
  })

  it('rejects an out-of-range render initialZoom', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: {
        viewId: 'index',
        render: { initialZoom: 4 },
      },
    })

    expect(result.isError).toBe(true)
    expect(textContent(result)[0]?.text).toMatch(/initialZoom/)
  })

  it('returns a bounded view-scoped model by default', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index' },
    })
    const content = structured(result)
    const model = content['model'] as Record<string, Record<string, unknown>>

    expect(Object.keys(model['elements']!)).toEqual(['selected', 'peer', 'selected.child'])
    expect(Object.keys(model['relations']!)).toHaveLength(1)
    expect(Object.keys(model['views']!)).toEqual(['index'])
    expect(JSON.stringify(content)).not.toContain('Hidden')
    expect(Buffer.byteLength(JSON.stringify(content))).toBeLessThan(100_000)
  })

  it('returns the complete model when fullModel is true', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index', fullModel: true },
    })
    const model = structured(result)['model'] as Record<string, Record<string, unknown>>

    expect(model['elements']!['unrelated']).toBeDefined()
    expect(Object.keys(model['views']!)).toEqual(['index', 'unrelatedView'])
  })

  it('exposes a text fallback alongside structuredContent', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'index' },
    })

    const text = textContent(result)
    expect(text[0]?.type).toBe('text')
    expect(text[0]?.text).toBeTruthy()
  })

  it('returns isError=true with a text message for an unknown viewId', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'does-not-exist' },
    })

    expect(result.isError).toBe(true)
    const text = textContent(result)
    expect(text[0]?.text).toMatch(/does-not-exist/)
  })
})

describe('render-view resource', () => {
  it('lists ui://likec4/render-view.html as a resource', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { resources } = await pair.client.listResources()
    expect(resources.map(r => r.uri)).toContain('ui://likec4/render-view.html')
  })

  it('declares the MCP App readiness marker in the render client', () => {
    const clientSource = readFileSync(new URL('../app-ui/render-view.client.tsx', import.meta.url), 'utf8')

    expect(clientSource).toContain('data-testid="mcp-render-view-ready"')
  })
})
