// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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

describe('preview-view tool', () => {
  it('renders a brand-new view referencing existing elements', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft { include selected.child\ninclude peer }' },
    })

    expect(result.isError).toBeFalsy()
    const content = structured(result)
    expect(content['id']).toBe('draft')
    expect(content['project']).toBe('default')

    const view = content['view'] as Record<string, unknown>
    const nodes = view['nodes'] as Array<Record<string, unknown>>
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('renders a preview for a project with a non-default ID', async () => {
    await using pair = await createMCPTestPair({
      dsl: DSL,
      projectConfig: { name: 'named-project' },
    })
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: {
        project: 'named-project',
        dsl: 'view draft { include selected.child\ninclude peer }',
      },
    })

    expect(result.isError).toBeFalsy()
    expect(structured(result)['project']).toBe('named-project')
  })

  it('does not persist the preview — the real project is unaffected', async () => {
    await using pair = await createMCPTestPair(DSL)
    await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft { include selected.child\ninclude peer }' },
    })

    const result = await pair.client.callTool({
      name: 'render-view',
      arguments: { viewId: 'draft' },
    })
    expect(result.isError).toBeTruthy()
  })

  it('returns a tool error when dsl has no view declaration', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'include *' },
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('view <id>')
  })

  it('returns a tool error when dsl references a nonexistent element', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft of doesNotExist { include * }' },
    })

    expect(result.isError).toBeTruthy()
  })

  it('returns a tool error when dsl has a syntax error inside a valid view header', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft { include selected.child' },
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('Failed to build preview')
  })

  it('returns structuredContent.model with the same shape as render-view', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft { include selected.child\ninclude peer }' },
    })

    expect(result.isError).toBeFalsy()
    const content = structured(result)
    const model = content['model'] as Record<string, unknown>
    expect(content['render']).toBeUndefined()
    expect(model).toBeDefined()
    expect(model['specification']).toBeDefined()
    expect(model['elements']).toBeDefined()
    expect(model['relations']).toBeDefined()
    expect(model['deployments']).toBeDefined()

    const views = model['views'] as Record<string, unknown>
    expect(views['draft']).toBeDefined()
  })

  it('returns a view-scoped preview model by default', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: {
        dsl: `view draft {
          include selected.child
          include peer
        }`,
      },
    })
    const content = structured(result)
    const model = content['model'] as Record<string, Record<string, unknown>>

    expect(model['elements']!['unrelated']).toBeUndefined()
    expect(Object.keys(model['views']!)).toEqual(['draft'])
    expect(Buffer.byteLength(JSON.stringify(content))).toBeLessThan(100_000)
  })

  it('returns the complete preview model when fullModel is true', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: {
        dsl: `view draft {
          include selected.child
          include peer
        }`,
        fullModel: true,
      },
    })
    const model = structured(result)['model'] as Record<string, Record<string, unknown>>

    expect(model['elements']!['unrelated']).toBeDefined()
    expect(Object.keys(model['views']!)).toEqual(['draft', 'index', 'unrelatedView'])
  })

  it('returns a tool error when the view id already exists in the project', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view index { include * }' },
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('"index" already exists')
  })
})
