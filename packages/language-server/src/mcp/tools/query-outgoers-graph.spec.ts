// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { queryOutgoersGraph } from './query-outgoers-graph'

describe('query-outgoers-graph', () => {
  it('should return complete outgoers graph', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        source = system
        consumer1 = system
        consumer2 = system
        consumer3 = system

        source -> consumer1
        source -> consumer2
        consumer2 -> consumer3
      }
    `)

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'source', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const content = result.structuredContent!
    const nodes = content['nodes'] as Record<string, { depth: number; outgoers: Array<{ elementId: string }> }>

    expect(content['target']).toBe('source')
    expect(content['totalNodes']).toBe(4)
    expect(content['maxDepth']).toBe(2)

    expect(nodes['source']).toBeDefined()
    expect(nodes['source']!.depth).toBe(0)
    expect(nodes['source']!.outgoers).toHaveLength(2)
    expect(nodes['source']!.outgoers[0]).toHaveProperty('elementId')

    expect(nodes['consumer2']).toBeDefined()
    expect(nodes['consumer2']!.depth).toBe(1)
    expect(nodes['consumer2']!.outgoers).toHaveLength(1)
    expect(nodes['consumer2']!.outgoers[0]).toHaveProperty('elementId')

    expect(nodes['consumer3']).toBeDefined()
    expect(nodes['consumer3']!.depth).toBe(2)
    expect(nodes['consumer3']!.outgoers).toHaveLength(0)
  })

  it('should handle cycles without infinite loop', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
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

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'a', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    expect(result.structuredContent!['totalNodes']).toBe(3)
  })

  it('should respect maxDepth limit', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
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

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 's1', includeIndirect: true, maxDepth: 2, maxNodes: 1000, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const content = result.structuredContent!

    expect(content['totalNodes']).toBe(3)
    expect(content['maxDepth']).toBe(2)
  })

  it('should return error for non-existent element', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        system1 = system
      }
    `)

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      {
        elementId: 'non-existent',
        includeIndirect: true,
        maxDepth: 50,
        maxNodes: 1000,
        project: 'default' as ProjectId,
      },
      {} as any,
    )

    expect(result.isError).toBe(true)
    const content = result.content![0]!
    expect('text' in content && content.text).toContain('Element "non-existent" not found')
  })

  it('should have totalNodes match actual node count', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        element system
        element service
      }
      model {
        source = system {
          api = service
        }
        backend = system {
          db = service
        }
        frontend = system {
          ui = service
        }

        source.api -> backend.db
        source.api -> frontend.ui
        backend.db -> frontend.ui
      }
    `)

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'source.api', includeIndirect: true, maxDepth: 50, maxNodes: 1000, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const content = result.structuredContent!
    const nodes = content['nodes'] as Record<string, { depth: number; outgoers: Array<{ elementId: string }> }>
    const actualNodeCount = Object.keys(nodes).length

    // Critical assertion: totalNodes must match actual nodes returned
    expect(content['totalNodes']).toBe(actualNodeCount)
    expect(actualNodeCount).toBe(3) // source.api, backend.db, frontend.ui

    // Verify maxDepth reflects actual maximum depth in returned nodes
    const maxDepthInNodes = Math.max(...Object.values(nodes).map((n: { depth: number }) => n.depth))
    expect(content['maxDepth']).toBe(maxDepthInNodes)
  })

  it('should handle maxNodes truncation correctly', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        source = system
        c1 = system
        c2 = system
        c3 = system
        c4 = system
        c5 = system

        source -> c1
        source -> c2
        source -> c3
        c1 -> c4
        c2 -> c5
      }
    `)

    await buildLikeC4Model()

    const [, , handler] = queryOutgoersGraph(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'source', includeIndirect: true, maxDepth: 50, maxNodes: 3, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const content = result.structuredContent!
    const nodes = content['nodes'] as Record<string, { depth: number; outgoers: Array<{ elementId: string }> }>

    // Should be truncated to maxNodes
    expect(content['truncated']).toBe(true)
    expect(content['totalNodes']).toBe(3)
    expect(Object.keys(nodes).length).toBe(3)

    // totalNodes must match actual node count even when truncated
    expect(content['totalNodes']).toBe(Object.keys(nodes).length)
  })
})
