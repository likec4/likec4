import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from './test-utils'

const DSL = `
  specification {
    element system
  }
  model {
    cloud = system 'Cloud System'
    other = system 'Other System'
  }
  views {
    view index {
      include cloud
    }
  }
`

describe('preview-view tool', () => {
  it('renders a brand-new view referencing existing elements', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft of other { include * }' },
    })

    expect(result.isError).toBeFalsy()
    const content = structured(result)
    expect(content['id']).toBe('draft')
    expect(content['project']).toBe('default')

    const view = content['view'] as Record<string, unknown>
    const nodes = view['nodes'] as Array<Record<string, unknown>>
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('does not persist the preview — the real project is unaffected', async () => {
    await using pair = await createMCPTestPair(DSL)
    await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft of other { include * }' },
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
      arguments: { dsl: 'view draft of other { include' },
    })

    expect(result.isError).toBeTruthy()
    const [frame] = textContent(result)
    expect(frame?.text).toContain('Failed to build preview')
  })

  it('returns structuredContent.model with the same shape as render-view', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.callTool({
      name: 'preview-view',
      arguments: { dsl: 'view draft of other { include * }' },
    })

    expect(result.isError).toBeFalsy()
    const content = structured(result)
    const model = content['model'] as Record<string, unknown>
    expect(model).toBeDefined()
    expect(model['specification']).toBeDefined()
    expect(model['elements']).toBeDefined()
    expect(model['relations']).toBeDefined()
    expect(model['deployments']).toBeDefined()

    const views = model['views'] as Record<string, unknown>
    expect(views['draft']).toBeDefined()
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
