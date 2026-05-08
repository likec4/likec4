import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from './test-utils'

const ELEMENT_DSL = `
  specification {
    element system
  }
  model {
    cloud = system 'Cloud System' {
      link https://likec4.dev/docs
      link https://github.com/likec4/likec4 'repo'
    }
  }
`

const DEPLOYMENT_DSL = `
  specification {
    deploymentNode cluster
  }
  model {}
  deployment {
    dc = cluster 'DC' {
      link https://status.example.com 'status'
    }
  }
`

describe('MCP links exposure (protocol-level)', () => {
  describe('read-element', () => {
    it('returns links via callTool', async () => {
      await using pair = await createMCPTestPair(ELEMENT_DSL)
      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'cloud', project: 'default' },
      })

      expect(result.isError).toBeFalsy()
      const content = structured(result)
      const links = content['links'] as Array<{ url: string; title: string | null }>

      expect(links).toHaveLength(2)
      expect(links[0]!.url).toBe('https://likec4.dev/docs')
      expect(links[0]!.title).toBeNull()
      expect(links[1]!.url).toBe('https://github.com/likec4/likec4')
      expect(links[1]!.title).toBe('repo')
    })
  })

  describe('read-deployment', () => {
    it('returns links for deployment nodes via callTool', async () => {
      await using pair = await createMCPTestPair(DEPLOYMENT_DSL)
      const result = await pair.client.callTool({
        name: 'read-deployment',
        arguments: { id: 'dc', project: 'default' },
      })

      expect(result.isError).toBeFalsy()
      const content = structured(result)
      const links = content['links'] as Array<{ url: string; title: string | null }>

      expect(links).toHaveLength(1)
      expect(links[0]!.url).toBe('https://status.example.com')
      expect(links[0]!.title).toBe('status')
    })
  })
})
