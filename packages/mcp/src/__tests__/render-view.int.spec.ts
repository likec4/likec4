import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from './test-utils'

const DSL = `
  specification {
    element system
  }
  model {
    cloud = system 'Cloud System'
  }
  views {
    view index {
      include *
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
})
