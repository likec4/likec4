// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { describe } from 'vitest'
import { createMCPTest, createMCPTestPair, structured, textContent } from './test-utils'

const UNRELATED_ELEMENTS = Array.from(
  { length: 250 },
  (_, index) => `unused${index} = system 'Unused ${index} ${'x'.repeat(500)}'`,
).join('\n')

const DSL = `
  specification {
    element system
    element container
    tag tag1
    tag tag2
  }
  model {
    selected = system 'Selected' {
      child = container 'Child'
    }
    peer = system 'Peer' {
      #tag1 #tag2
    }
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

const it = createMCPTest(DSL)

describe('preview-view tool', () => {
  it('renders a brand-new view referencing existing elements', { timeout: 30000 }, async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: 'view draft { include selected.child\ninclude peer }',
    })

    expect(result.isError).toBeFalsy()
    const content = structured(result)
    expect(content['id']).toBe('draft')
    expect(content['project']).toBe('default')

    const view = content['view'] as Record<string, unknown>
    const nodes = view['nodes'] as Array<Record<string, unknown>>
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('renders a preview for a project with a non-default ID', async ({ expect }) => {
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

  it('does not persist the preview — the real project is unaffected', async ({ callTool, expect }) => {
    await callTool('preview-view', {
      dsl: 'view draft { include selected.child\ninclude peer }',
    })

    const result = await callTool('render-view', { viewId: 'draft' })
    expect(result.isError).toBeTruthy()
  })

  it('returns a tool error when dsl has no view declaration', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', { dsl: 'include *' })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('view <id>')
  })

  it('returns a tool error when dsl references a nonexistent element', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: 'view draft of doesNotExist { include * }',
    })

    expect(result.isError).toBeTruthy()
  })

  it('returns a tool error when dsl has a syntax error inside a valid view header', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: 'view draft { include selected.child',
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('Failed to build preview')
  })

  it('returns structuredContent.model with the same shape as render-view', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: 'view draft { include selected.child\ninclude peer }',
    })

    expect(result.isError).toBeFalsy()
    const content = structured<{ model: any; render?: any }>(result)
    expect(content).not.toHaveProperty('render')
    expect(content).toHaveProperty('model')
    const model = content.model
    expect(model.elements).toEqual({
      peer: expect.objectContaining({ id: 'peer', tags: ['tag1', 'tag2'] }),
      selected: expect.objectContaining({ id: 'selected' }),
      'selected.child': expect.objectContaining({ id: 'selected.child' }),
    })
    expect(model).toHaveProperty('relations')
    expect(model).toHaveProperty('deployments')
    expect(model.views).toEqual({
      draft: expect.objectContaining({
        id: 'draft',
        _type: 'element',
        _stage: 'layouted',
      }),
    })
  })

  it('returns a view-scoped preview model by default', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: `view draft {
        include selected.child
        include peer
      }`,
    })
    const content = structured(result)
    const model = content['model'] as Record<string, Record<string, unknown>>

    expect(model['elements']!['unrelated']).toBeUndefined()
    expect(Object.keys(model['views']!)).toEqual(['draft'])
    expect(Buffer.byteLength(JSON.stringify(content))).toBeLessThan(100_000)
  })

  it('returns the complete preview model when fullModel is true', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: `view draft {
        include selected.child
        include peer
      }`,
      fullModel: true,
    })
    const model = structured(result)['model'] as Record<string, Record<string, unknown>>

    expect(model['elements']!['unrelated']).toBeDefined()
    expect(Object.keys(model['views']!)).toEqual(['draft', 'index', 'unrelatedView'])
  })

  it('returns a tool error when the view id already exists in the project', async ({ callTool, expect }) => {
    const result = await callTool('preview-view', {
      dsl: 'view index { include * }',
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('"index" already exists')
  })

  // // Keep last: disposing this ad-hoc pair clears the shared language-services context
  // it('renders a preview for a project with a non-default ID', { timeout: 30000 }, async ({ expect }) => {
  //   await using pair = await createMCPTestPair({
  //     dsl: DSL,
  //     projectConfig: { name: 'named-project' },
  //   })
  //   const result = await pair.client.callTool({
  //     name: 'preview-view',
  //     arguments: {
  //       project: 'named-project',
  //       dsl: 'view draft { include selected.child\ninclude peer }',
  //     },
  //   })

  //   expect(result.isError).toBeFalsy()
  //   expect(structured(result)['project']).toBe('named-project')
  // })
})
