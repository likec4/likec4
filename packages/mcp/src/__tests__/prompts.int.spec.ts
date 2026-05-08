import { describe, expect, it } from 'vitest'
import { createMCPTestPair } from './test-utils'

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

describe('MCP prompts protocol round-trip', () => {
  it('getPrompt returns a user message with apply-semantic-layout instructions', async () => {
    await using pair = await createMCPTestPair(DSL)
    const result = await pair.client.getPrompt({
      name: 'apply_semantic_layout',
      arguments: { projectId: 'default', viewId: 'index' },
    })

    expect(result.messages).toHaveLength(1)
    const message = result.messages[0]!
    expect(message.role).toBe('user')
    expect(message.content.type).toBe('text')

    const text = (message.content as { type: 'text'; text: string }).text
    expect(text).toContain('apply-semantic-layout')
    expect(text).toContain('projectId: `default`')
    expect(text).toContain('viewId: `index`')
  })

  it('exposes prompt argument descriptions in listPrompts', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { prompts } = await pair.client.listPrompts()
    const prompt = prompts.find(p => p.name === 'apply_semantic_layout')
    expect(prompt).toBeDefined()

    const argNames = prompt!.arguments?.map(a => a.name).sort()
    expect(argNames).toEqual(['projectId', 'viewId'])
  })
})
