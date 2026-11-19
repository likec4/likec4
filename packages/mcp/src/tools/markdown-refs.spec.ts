import { describe } from 'vitest'
import { createMCPTest, structured } from '../__tests__/test-utils'

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

const it = createMCPTest(source)

const resolved = 'Calls Payments Backend and the API, see Landscape, not missing'
const withResolvedDescription = {
  description: resolved,
}

describe('Markdown refs in MCP tools', () => {
  it('read-element returns titles', async ({ callTool, expect }) => {
    const data = await callTool.structured('read-element', {
      id: 'frontend',
      project: 'default',
    })
    expect(data).toMatchObject(withResolvedDescription)
    expect(JSON.stringify(data)).toContain('Through Payments Backend')
    expect(JSON.stringify(data)).not.toContain('[[')
  })

  it('read-element keeps plain strings as is', async ({ callTool, expect }) => {
    const result = await callTool.structured('read-element', {
      id: 'backend',
      project: 'default',
    })
    expect(result['description']).toBe('Plain [[frontend]] is not a ref')
  })

  it('read-view returns titles', async ({ callTool, expect }) => {
    const data = await callTool.structured<{ description: string; nodes: Array<{ id: string; description: string }> }>(
      'read-view',
      {
        viewId: 'index',
        project: 'default',
      },
    )

    expect(data.description).toBe('Overview of Frontend')
    const nodes = data.nodes
    expect(nodes.find(n => n.id === 'frontend')).toMatchObject(withResolvedDescription)
  })

  it('search-element matches and returns titles', async ({ callTool, expect }) => {
    const result = await callTool.structured<{ found: Array<{ id: string; description: string }> }>(
      'search-element',
      { search: 'Landscape' },
    )
    const found = result.found
    expect(found.find(f => f.id === 'frontend')).toMatchObject(withResolvedDescription)
  })

  it('list-diffs returns titles', async ({ callTool, expect }) => {
    const result = await callTool.structured<{ diffs: Array<{ description: string }> }>(
      'list-diffs',
      { project: 'default' },
    )
    const diffs = result.diffs
    expect(diffs[0]).toMatchObject({
      description: 'Replaces Payments Backend',
    })
  })
})
