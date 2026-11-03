import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

/**
 * Refs in Markdown (`[[fqn]]`, `[[view:id]]`) are returned with element and view titles
 */
const source = `
  specification {
    element system
  }
  model {
    frontend = system 'Frontend' {
      description '''
        Calls [[backend]] and [[backend|the API]], see [[view:index]], not [[missing]]
      '''
    }
    backend = system 'Payments Backend' {
      description 'Plain [[frontend]] is not a ref'
    }
    frontend -> backend {
      description '''Through [[backend]]'''
    }
  }
  views {
    view index {
      title 'Landscape'
      description '''Overview of [[frontend]]'''
      include *
    }
  }
  diff rfc 'Replace backend' {
    description '''Replaces [[backend]]'''
    remove {
      backend
    }
  }
`

const resolved = 'Calls Payments Backend and the API, see Landscape, not missing'

describe('Markdown refs in MCP tools', () => {
  it('read-element returns titles', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'read-element',
      arguments: { id: 'frontend', project: 'default' },
    })
    const data = structured(result)
    expect(data['description']).toBe(resolved)
    expect(JSON.stringify(data)).toContain('Through Payments Backend')
    expect(JSON.stringify(data)).not.toContain('[[')
  })

  it('read-element keeps plain strings as is', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'read-element',
      arguments: { id: 'backend', project: 'default' },
    })
    expect(structured(result)['description']).toBe('Plain [[frontend]] is not a ref')
  })

  it('read-view returns titles', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'read-view',
      arguments: { viewId: 'index', project: 'default' },
    })
    const data = structured(result)
    expect(data['description']).toBe('Overview of Frontend')
    const nodes = data['nodes'] as Array<Record<string, unknown>>
    expect(nodes.find(n => n['id'] === 'frontend')?.['description']).toBe(resolved)
  })

  it('search-element matches and returns titles', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'search-element',
      arguments: { search: 'Landscape' },
    })
    const found = structured(result)['found'] as Array<Record<string, unknown>>
    expect(found.find(f => f['id'] === 'frontend')?.['description']).toBe(resolved)
  })

  it('list-diffs returns titles', async () => {
    await using pair = await createMCPTestPair(source)
    const result = await pair.client.callTool({
      name: 'list-diffs',
      arguments: { project: 'default' },
    })
    const diffs = structured(result)['diffs'] as Array<Record<string, unknown>>
    expect(diffs[0]?.['description']).toBe('Replaces Payments Backend')
  })
})
