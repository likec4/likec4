// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { elementDiff } from './element-diff'

describe('element-diff tool', () => {
  it('should detect property differences', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        a = system 'System A' {
          description 'First system'
          technology 'React'
        }
        b = system 'System B' {
          description 'Second system'
          technology 'Vue'
        }
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'b', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const data = result.structuredContent!
    const propertyDiffs = data['propertyDiffs'] as Array<any>

    expect(propertyDiffs.find((d: any) => d.property === 'title')).toEqual({
      property: 'title',
      element1Value: 'System A',
      element2Value: 'System B',
    })
    expect(propertyDiffs.find((d: any) => d.property === 'description')).toEqual({
      property: 'description',
      element1Value: 'First system',
      element2Value: 'Second system',
    })
    expect(propertyDiffs.find((d: any) => d.property === 'technology')).toEqual({
      property: 'technology',
      element1Value: 'React',
      element2Value: 'Vue',
    })
    // kind should be the same
    expect(propertyDiffs.find((d: any) => d.property === 'kind')).toBeUndefined()
  })

  it('should detect tag differences', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        tag public
        tag internal
        tag api
        tag deprecated
      }
      model {
        a = system 'A' {
          #public
          #api
          #deprecated
        }
        b = system 'B' {
          #public
          #internal
          #api
        }
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'b', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const tags = result.structuredContent!['tags'] as any

    expect(tags.common).toContain('public')
    expect(tags.common).toContain('api')
    expect(tags.onlyInElement1).toContain('deprecated')
    expect(tags.onlyInElement2).toContain('internal')
  })

  it('should detect metadata differences', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        a = system 'A' {
          metadata {
            owner 'team-a'
            tier 'critical'
            version '1.0'
          }
        }
        b = system 'B' {
          metadata {
            owner 'team-b'
            tier 'critical'
            region 'us-east'
          }
        }
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'b', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const metadata = result.structuredContent!['metadata'] as any

    expect(metadata.common).toHaveProperty('tier', 'critical')
    expect(metadata.onlyInElement1).toHaveProperty('version', '1.0')
    expect(metadata.onlyInElement2).toHaveProperty('region', 'us-east')
    expect(metadata.different).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'owner', element1Value: 'team-a', element2Value: 'team-b' }),
      ]),
    )
  })

  it('should compare relationship counts', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        a = system 'A'
        b = system 'B'
        shared = system 'Shared'
        onlyA = system 'Only A source'
        onlyB = system 'Only B source'

        onlyA -> a 'uses'
        shared -> a 'uses'
        shared -> b 'uses'
        onlyB -> b 'uses'

        a -> shared 'calls'
        b -> shared 'calls'
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'b', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const relationships = result.structuredContent!['relationships'] as any

    expect(relationships.incomingShared).toBe(1) // shared -> both
    expect(relationships.incomingOnlyElement1).toBe(1) // onlyA -> a
    expect(relationships.incomingOnlyElement2).toBe(1) // onlyB -> b
    expect(relationships.outgoingShared).toBe(1) // both -> shared
  })

  it('should error for non-existent elements', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        a = system 'A'
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'nonexistent', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.isError).toBe(true)
    const content = result.content![0]!
    expect('text' in content && content.text).toContain('not found')
  })

  it('should show no diffs for identical elements compared to themselves', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
        tag public
      }
      model {
        a = system 'A' {
          #public
          metadata {
            owner 'team'
          }
        }
      }
    `)

    const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
    const result = await handler(
      { element1Id: 'a', element2Id: 'a', project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const data = result.structuredContent!

    expect((data['propertyDiffs'] as any[]).length).toBe(0)
    expect((data['tags'] as any).onlyInElement1).toHaveLength(0)
    expect((data['tags'] as any).onlyInElement2).toHaveLength(0)
    expect((data['metadata'] as any).different).toHaveLength(0)
    expect(Object.keys((data['metadata'] as any).onlyInElement1)).toHaveLength(0)
    expect(Object.keys((data['metadata'] as any).onlyInElement2)).toHaveLength(0)
  })
})
