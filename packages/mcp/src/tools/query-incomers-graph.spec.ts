// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from '../__tests__/test-utils'

describe('query-incomers-graph', () => {
  it('should return complete incomers graph', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        system1 = system
        system2 = system
        system3 = system
        target = system

        system1 -> target
        system2 -> target
        system3 -> system2
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: { elementId: 'target', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const content = structured(result)
    const nodes = content['nodes'] as Record<string, { depth: number; incomers: Array<{ elementId: string }> }>

    expect(content['target']).toBe('target')
    expect(content['totalNodes']).toBe(4)
    expect(content['maxDepth']).toBe(2)

    expect(nodes['target']).toBeDefined()
    expect(nodes['target']!.depth).toBe(0)
    expect(nodes['target']!.incomers).toHaveLength(2)
    expect(nodes['target']!.incomers[0]).toHaveProperty('elementId')

    expect(nodes['system2']).toBeDefined()
    expect(nodes['system2']!.depth).toBe(1)
    expect(nodes['system2']!.incomers).toHaveLength(1)
    expect(nodes['system2']!.incomers[0]).toHaveProperty('elementId')

    expect(nodes['system3']).toBeDefined()
    expect(nodes['system3']!.depth).toBe(2)
    expect(nodes['system3']!.incomers).toHaveLength(0)
  })

  it('should handle cycles without infinite loop', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        a = system
        b = system
        c = system

        a -> b
        b -> c
        c -> a
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: { elementId: 'a', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    expect(structured(result)['totalNodes']).toBe(3)
  })

  it('should respect maxDepth limit', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        s1 = system
        s2 = system
        s3 = system
        s4 = system
        s5 = system

        s1 -> s2
        s2 -> s3
        s3 -> s4
        s4 -> s5
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: { elementId: 's5', includeIndirect: true, maxDepth: 2, maxNodes: 1000, project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const content = structured(result)

    expect(content['totalNodes']).toBe(3)
    expect(content['maxDepth']).toBe(2)
  })

  it('should return error for non-existent element', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        system1 = system
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: {
        elementId: 'non-existent',
        includeIndirect: true,
        maxDepth: 50,
        maxNodes: 1000,
        project: 'default',
      },
    })

    expect(result.isError).toBe(true)
    const content = textContent(result)[0]!
    expect('text' in content && content.text).toContain('Element "non-existent" not found')
  })

  it('should have totalNodes match actual node count', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
        element service
      }
      model {
        backend = system {
          api = service
          db = service
        }
        frontend = system {
          ui = service
        }
        target = system

        backend.api -> target
        backend.db -> target
        frontend.ui -> backend.api
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: { elementId: 'target', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const content = structured(result)
    const nodes = content['nodes'] as Record<string, { depth: number; incomers: Array<{ elementId: string }> }>
    const actualNodeCount = Object.keys(nodes).length

    // Critical assertion: totalNodes must match actual nodes returned
    expect(content['totalNodes']).toBe(actualNodeCount)
    expect(actualNodeCount).toBe(4) // target, backend.api, backend.db, frontend.ui

    // Verify maxDepth reflects actual maximum depth in returned nodes
    const maxDepthInNodes = Math.max(...Object.values(nodes).map((n: { depth: number }) => n.depth))
    expect(content['maxDepth']).toBe(maxDepthInNodes)
  })

  it('should handle maxNodes truncation correctly', async () => {
    await using pair = await createMCPTestPair(`
      specification {
        element system
      }
      model {
        s1 = system
        s2 = system
        s3 = system
        s4 = system
        s5 = system
        target = system

        s1 -> target
        s2 -> target
        s3 -> target
        s4 -> s1
        s5 -> s2
      }
    `)

    const result = await pair.client.callTool({
      name: 'query-incomers-graph',
      arguments: { elementId: 'target', includeIndirect: true, maxDepth: 50, maxNodes: 3, project: 'default' },
    })

    expect(result.structuredContent).toBeDefined()
    const content = structured(result)
    const nodes = content['nodes'] as Record<string, { depth: number; incomers: Array<{ elementId: string }> }>

    // Should be truncated to maxNodes
    expect(content['truncated']).toBe(true)
    expect(content['totalNodes']).toBe(3)
    expect(Object.keys(nodes).length).toBe(3)

    // totalNodes must match actual node count even when truncated
    expect(content['totalNodes']).toBe(Object.keys(nodes).length)
  })
})
