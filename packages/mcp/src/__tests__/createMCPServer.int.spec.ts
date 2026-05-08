import { describe, expect, it } from 'vitest'
import { createMCPTestPair } from './test-utils'

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

const EXPECTED_TOOLS = [
  'list-projects',
  'read-project-summary',
  'read-element',
  'read-deployment',
  'read-view',
  'search-element',
  'find-relationships',
  'find-relationship-paths',
  'query-graph',
  'query-incomers-graph',
  'query-outgoers-graph',
  'query-by-metadata',
  'query-by-tags',
  'query-by-tag-pattern',
  'batch-read-elements',
  'element-diff',
  'subgraph-summary',
  'apply-semantic-layout',
] as const

describe('createMCPServer — registration & discovery', () => {
  it('advertises tools, prompts, resources, and logging capabilities', async () => {
    await using pair = await createMCPTestPair(DSL)
    const caps = pair.client.getServerCapabilities()
    expect(caps).toBeDefined()
    expect(caps!.tools).toBeDefined()
    expect(caps!.prompts).toBeDefined()
    expect(caps!.resources).toBeDefined()
    expect(caps!.logging).toBeDefined()
  })

  it('exposes server identity', async () => {
    await using pair = await createMCPTestPair(DSL)
    const info = pair.client.getServerVersion()
    expect(info?.name).toBe('LikeC4')
    expect(info?.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('lists all expected tools, each with a description and input schema', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { tools } = await pair.client.listTools()
    const names = tools.map(t => t.name).sort()

    expect(names).toEqual([...EXPECTED_TOOLS].sort())

    for (const tool of tools) {
      expect(tool.description, `tool ${tool.name} missing description`).toBeTruthy()
      expect(tool.description!.length).toBeGreaterThan(0)
      expect(tool.inputSchema, `tool ${tool.name} missing inputSchema`).toBeDefined()
      expect(tool.inputSchema.type).toBe('object')
    }
  })

  it('marks read-only tools with annotations', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { tools } = await pair.client.listTools()
    const readElement = tools.find(t => t.name === 'read-element')
    expect(readElement?.annotations?.readOnlyHint).toBe(true)
  })

  it('lists the apply_semantic_layout prompt', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { prompts } = await pair.client.listPrompts()
    const names = prompts.map(p => p.name)
    expect(names).toContain('apply_semantic_layout')
  })

  it('lists project resources via the resource template', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { resources } = await pair.client.listResources()
    expect(resources.length).toBeGreaterThan(0)
    const defaultProject = resources.find(r => r.uri === 'likec4://project/default')
    expect(defaultProject).toBeDefined()
    expect(defaultProject!.name).toBeTruthy()
  })

  it('lists the resource template', async () => {
    await using pair = await createMCPTestPair(DSL)
    const { resourceTemplates } = await pair.client.listResourceTemplates()
    const template = resourceTemplates.find(t => t.uriTemplate === 'likec4://project/{projectId}')
    expect(template).toBeDefined()
    expect(template!.name).toBe('likec4-project')
    expect(template!.mimeType).toBe('application/json')
  })
})
