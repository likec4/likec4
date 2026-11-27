import { describe } from 'vitest'
import { createMCPTest, structured, textContent } from './test-utils'

const DSL = `
  specification {
    element system
    element container
  }
  model {
    cloud = system 'Cloud System' {
      ui = container 'Frontend'
    }
  }
`

const it = createMCPTest(DSL)

describe('MCP tool protocol round-trip', () => {
  describe('happy path', () => {
    it('callTool(read-element) returns structuredContent for an existing element', async ({ callTool, expect }) => {
      const result = await callTool('read-element', { id: 'cloud', project: 'default' })

      expect(result.isError).toBeFalsy()
      expect(result.structuredContent).toBeDefined()

      const content = structured(result)
      expect(content['id']).toBe('cloud')
      expect(content['kind']).toBe('system')
      expect(content['title']).toBe('Cloud System')
      expect(content['children']).toEqual(['cloud.ui'])
    })

    it('exposes content array (CallToolResult shape) on every response', async ({ callTool, expect }) => {
      const result = await callTool('read-element', { id: 'cloud', project: 'default' })
      expect(Array.isArray(result.content)).toBe(true)
    })
  })

  describe('error frames', () => {
    it('returns isError=true with text content for a non-existent element', async ({ callTool, expect }) => {
      const result = await callTool('read-element', { id: 'does-not-exist', project: 'default' })

      expect(result.isError).toBe(true)
      const content = textContent(result)
      expect(content[0]?.type).toBe('text')
      expect(content[0]?.text).toMatch(/does-not-exist|not found/i)
    })

    it('returns isError=true with a Zod validation message for malformed input', async ({ callTool, expect }) => {
      const result = await callTool('read-element', { id: 123, project: 'default' })

      expect(result.isError).toBe(true)
      const content = textContent(result)
      expect(content[0]?.text).toMatch(/Input validation error|Expected string/i)
    })

    it('returns isError=true when the tool name is unknown', async ({ callTool, expect }) => {
      const result = await callTool('no-such-tool', {})

      expect(result.isError).toBe(true)
      const content = textContent(result)
      expect(content[0]?.text).toMatch(/not found/i)
    })
  })
})
