// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { subgraphSummary } from './subgraph-summary'

describe('subgraph-summary tool', () => {
  it('should return all descendants with depth info', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
        element module
      }
      model {
        parent = system 'Parent' {
          child1 = component 'Child 1' {
            grandchild1 = module 'Grandchild 1'
          }
          child2 = component 'Child 2'
        }
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'parent', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const data = result.structuredContent!

    const root = data['root'] as any
    expect(root.id).toBe('parent')
    expect(root.childCount).toBe(2)

    const descendants = data['descendants'] as Array<any>
    expect(descendants).toHaveLength(3)
    expect(data['totalDescendants']).toBe(3)
    expect(data['truncated']).toBe(false)
    expect(data['truncatedByDepth']).toBe(false)

    const child1 = descendants.find((d: any) => d.id === 'parent.child1')
    expect(child1).toBeDefined()
    expect(child1.depth).toBe(1)
    expect(child1.childCount).toBe(1)

    const child2 = descendants.find((d: any) => d.id === 'parent.child2')
    expect(child2).toBeDefined()
    expect(child2.depth).toBe(1)
    expect(child2.childCount).toBe(0)

    const grandchild1 = descendants.find((d: any) => d.id === 'parent.child1.grandchild1')
    expect(grandchild1).toBeDefined()
    expect(grandchild1.depth).toBe(2)
  })

  it('should respect maxDepth', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
        element module
      }
      model {
        parent = system 'Parent' {
          child = component 'Child' {
            grandchild = module 'Grandchild'
          }
        }
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'parent', maxDepth: 1, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const descendants = result.structuredContent!['descendants'] as Array<any>

    // Only direct children (depth=1), not grandchildren
    expect(descendants).toHaveLength(1)
    expect(descendants[0].id).toBe('parent.child')
    expect(descendants[0].depth).toBe(1)
    // Grandchild exists beyond maxDepth=1
    expect(result.structuredContent!['truncatedByDepth']).toBe(true)
  })

  it('should filter metadata by metadataKeys', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
      }
      model {
        parent = system 'Parent' {
          child = component 'Child' {
            metadata {
              owner 'team-a'
              tier 'critical'
              region 'us-east'
            }
          }
        }
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      {
        elementId: 'parent',
        maxDepth: 10,
        metadataKeys: ['owner', 'tier'],
        project: 'default' as ProjectId,
      },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const descendants = result.structuredContent!['descendants'] as Array<any>
    expect(descendants).toHaveLength(1)

    const child = descendants[0]
    expect(child.metadata).toHaveProperty('owner', 'team-a')
    expect(child.metadata).toHaveProperty('tier', 'critical')
    expect(child.metadata).not.toHaveProperty('region')
  })

  it('should include all metadata when metadataKeys not specified', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
      }
      model {
        parent = system 'Parent' {
          child = component 'Child' {
            metadata {
              owner 'team-a'
              tier 'critical'
            }
          }
        }
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'parent', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const descendants = result.structuredContent!['descendants'] as Array<any>
    const child = descendants[0]
    expect(child.metadata).toHaveProperty('owner', 'team-a')
    expect(child.metadata).toHaveProperty('tier', 'critical')
  })

  it('should include relationship counts', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
      }
      model {
        parent = system 'Parent' {
          child1 = component 'Child 1'
          child2 = component 'Child 2'
        }
        external = system 'External'
        external -> parent.child1 'calls'
        parent.child1 -> parent.child2 'uses'
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'parent', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const descendants = result.structuredContent!['descendants'] as Array<any>

    const child1 = descendants.find((d: any) => d.id === 'parent.child1')
    expect(child1.incomingCount).toBe(1) // external -> child1
    expect(child1.outgoingCount).toBe(1) // child1 -> child2

    const child2 = descendants.find((d: any) => d.id === 'parent.child2')
    expect(child2.incomingCount).toBe(1) // child1 -> child2
    expect(child2.outgoingCount).toBe(0)
  })

  it('should return empty descendants for leaf element', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        leaf = system 'Leaf'
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'leaf', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    expect(result.structuredContent!['descendants']).toHaveLength(0)
    expect(result.structuredContent!['totalDescendants']).toBe(0)
  })

  it('should error for non-existent element', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        a = system 'A'
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'nonexistent', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.isError).toBe(true)
    expect(result.content).toBeDefined()
    expect(result.content!.length).toBeGreaterThan(0)
    const content = result.content![0]!
    expect('text' in content && content.text).toContain('not found')
  })

  it('should include tags in descendants', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        element component
        tag public
        tag internal
      }
      model {
        parent = system 'Parent' {
          public_child = component 'Public' {
            #public
          }
          internal_child = component 'Internal' {
            #internal
          }
        }
      }
    `)

    const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
    const result = await handler(
      { elementId: 'parent', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const descendants = result.structuredContent!['descendants'] as Array<any>

    const pub = descendants.find((d: any) => d.id === 'parent.public_child')
    expect(pub.tags).toContain('public')

    const int = descendants.find((d: any) => d.id === 'parent.internal_child')
    expect(int.tags).toContain('internal')
  })
})
