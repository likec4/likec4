// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

describe('batch-read-elements tool', () => {
  it('should return details for multiple elements', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
        element component
      }
      model {
        frontend = system 'Frontend' {
          description 'User-facing web app'
          technology 'React'
          metadata {
            owner 'web-team'
          }

          auth = component 'Auth Module'
        }
        backend = system 'Backend' {
          description 'API server'
          technology 'Node.js'
        }
        frontend -> backend 'calls API'
      }
    `)

    const result = await pair.client.callTool({
      name: 'batch-read-elements',
      arguments: { ids: ['frontend', 'backend'], project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const elements = structured(result)['elements'] as Array<any>
    const notFound = structured(result)['notFound'] as string[]

    expect(elements).toHaveLength(2)
    expect(notFound).toHaveLength(0)

    const fe = elements.find((e: any) => e.id === 'frontend')
    expect(fe).toBeDefined()
    expect(fe.title).toBe('Frontend')
    expect(fe.description).toBe('User-facing web app')
    expect(fe.technology).toBe('React')
    expect(fe.metadata).toHaveProperty('owner', 'web-team')
    expect(fe.children).toContain('frontend.auth')
    expect(fe.outgoingCount).toBe(1)

    const be = elements.find((e: any) => e.id === 'backend')
    expect(be).toBeDefined()
    expect(be.title).toBe('Backend')
    expect(be.incomingCount).toBe(1)
  })

  it('should report not found elements', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        frontend = system 'Frontend'
      }
    `)

    const result = await pair.client.callTool({
      name: 'batch-read-elements',
      arguments: { ids: ['frontend', 'nonexistent', 'also-missing'], project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const elements = structured(result)['elements'] as Array<any>
    const notFound = structured(result)['notFound'] as string[]

    expect(elements).toHaveLength(1)
    expect(elements[0].id).toBe('frontend')
    expect(notFound).toEqual(['nonexistent', 'also-missing'])
  })

  it('should return empty results for all invalid ids', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        frontend = system 'Frontend'
      }
    `)

    const result = await pair.client.callTool({
      name: 'batch-read-elements',
      arguments: { ids: ['invalid1', 'invalid2'], project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const elements = structured(result)['elements'] as Array<any>
    const notFound = structured(result)['notFound'] as string[]

    expect(elements).toHaveLength(0)
    expect(notFound).toEqual(['invalid1', 'invalid2'])
  })

  it('should include relationship counts', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        a = system 'A'
        b = system 'B'
        c = system 'C'
        a -> b 'uses'
        a -> c 'calls'
        b -> c 'reads'
      }
    `)

    const result = await pair.client.callTool({
      name: 'batch-read-elements',
      arguments: { ids: ['a', 'b', 'c'], project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const elements = structured(result)['elements'] as Array<any>

    const a = elements.find((e: any) => e.id === 'a')
    expect(a.outgoingCount).toBe(2)
    expect(a.incomingCount).toBe(0)

    const b = elements.find((e: any) => e.id === 'b')
    expect(b.incomingCount).toBe(1)
    expect(b.outgoingCount).toBe(1)

    const c = elements.find((e: any) => e.id === 'c')
    expect(c.incomingCount).toBe(2)
    expect(c.outgoingCount).toBe(0)
  })

  describe('links and sourceLocation', () => {
    const MIXED_LINKS_DSL = `
      specification {
        element system
        element container
      }
      model {
        cloud = system 'Cloud System' {
          link https://likec4.dev/docs/dsl/model/
          link https://github.com/likec4/likec4 'GitHub Repository'

          ui = container 'Frontend' {
            link ./README.md 'Local Docs'
          }
        }
        backend = system 'Backend'
      }
    `
    const IDS = ['cloud', 'cloud.ui', 'backend']

    // Link shapes (titled/untitled/relative) are covered per-tool in mcp-tools-links.spec.ts.
    // This asserts what only a batch call can get wrong: attributing links to the right element.
    it('should attribute links to the right element in a mixed batch', async () => {
      await using pair = await createMCPTestPair(MIXED_LINKS_DSL)

      const result = await pair.client.callTool({
        name: 'batch-read-elements',
        arguments: { ids: IDS, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const elements = structured(result)['elements'] as Array<any>
      expect(elements).toHaveLength(3)

      const urlsById = Object.fromEntries(
        elements.map((e: any) => [e.id, e.links.map((l: any) => l.url)]),
      )

      expect(urlsById).toEqual({
        'cloud': ['https://likec4.dev/docs/dsl/model/', 'https://github.com/likec4/likec4'],
        'cloud.ui': ['./README.md'],
        'backend': [],
      })
    })

    it('should return the same links and sourceLocation as read-element', async () => {
      await using pair = await createMCPTestPair(MIXED_LINKS_DSL)

      const batch = await pair.client.callTool({
        name: 'batch-read-elements',
        arguments: { ids: IDS, project: 'default' },
      })
      const elements = structured(batch)['elements'] as Array<any>
      expect(elements).toHaveLength(IDS.length)

      for (const id of IDS) {
        const single = await pair.client.callTool({
          name: 'read-element',
          arguments: { id, project: 'default' },
        })
        const expected = structured(single)
        const actual = elements.find((e: any) => e.id === id)

        expect(actual.links).toEqual(expected['links'])
        expect(actual.sourceLocation).toEqual(expected['sourceLocation'])
      }
    })

    it('should return sourceLocation for every element', async () => {
      await using pair = await createMCPTestPair(MIXED_LINKS_DSL)

      const result = await pair.client.callTool({
        name: 'batch-read-elements',
        arguments: { ids: IDS, project: 'default' },
      })
      const elements = structured(result)['elements'] as Array<any>

      for (const element of elements) {
        const location = element.sourceLocation
        expect(location).not.toBeNull()
        expect(typeof location.path).toBe('string')
        expect(typeof location.range.start.line).toBe('number')
        expect(typeof location.range.start.character).toBe('number')
      }
    })
  })
})
