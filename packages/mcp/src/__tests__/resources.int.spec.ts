import { describe } from 'vitest'
import { createMCPTest } from './test-utils'

const DSL = `
  specification {
    element system
  }
  model {
    cloud = system 'Cloud System'
  }
`

const it = createMCPTest(DSL)

describe('MCP resources protocol round-trip', () => {
  it('listResources returns a project entry per project', async ({ pair, expect }) => {
    const { resources } = await pair.client.listResources()
    const uris = resources.map(r => r.uri)
    expect(uris).toContain('likec4://project/default')
  })

  it('readResource returns a JSON payload describing the project', async ({ pair, expect }) => {
    const result = await pair.client.readResource({
      uri: 'likec4://project/default',
    })

    expect(result.contents).toHaveLength(1)
    const entry = result.contents[0]!
    expect(entry.uri).toBe('likec4://project/default')
    expect('text' in entry).toBe(true)

    const payload = JSON.parse((entry as { text: string }).text) as {
      id: string
      title: string
      folder: string
    }
    expect(payload.id).toBe('default')
    expect(payload.title).toBeTruthy()
    expect(payload.folder).toBeTruthy()
  })

  it('readResource for an unknown projectId returns empty contents', async ({ pair, expect }) => {
    const result = await pair.client.readResource({
      uri: 'likec4://project/unknown-project',
    })
    expect(result.contents).toHaveLength(0)
  })
})
