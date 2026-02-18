// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { batchReadElements } from './batch-read-elements'

describe('batch-read-elements tool', () => {
  it('should return details for multiple elements', async () => {
    const { validate, services } = createTestServices()

    await validate(`
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

    const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
    const result = await handler(
      { ids: ['frontend', 'backend'], project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const elements = result.structuredContent!['elements'] as Array<any>
    const notFound = result.structuredContent!['notFound'] as string[]

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
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        frontend = system 'Frontend'
      }
    `)

    const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
    const result = await handler(
      { ids: ['frontend', 'nonexistent', 'also-missing'], project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const elements = result.structuredContent!['elements'] as Array<any>
    const notFound = result.structuredContent!['notFound'] as string[]

    expect(elements).toHaveLength(1)
    expect(elements[0].id).toBe('frontend')
    expect(notFound).toEqual(['nonexistent', 'also-missing'])
  })

  it('should return empty results for all invalid ids', async () => {
    const { validate, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        frontend = system 'Frontend'
      }
    `)

    const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
    const result = await handler(
      { ids: ['invalid1', 'invalid2'], project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const elements = result.structuredContent!['elements'] as Array<any>
    const notFound = result.structuredContent!['notFound'] as string[]

    expect(elements).toHaveLength(0)
    expect(notFound).toEqual(['invalid1', 'invalid2'])
  })

  it('should include relationship counts', async () => {
    const { validate, services } = createTestServices()

    await validate(`
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

    const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
    const result = await handler(
      { ids: ['a', 'b', 'c'], project: 'default' as ProjectId },
      {} as any,
    )

    expect(result.structuredContent).toBeDefined()
    const elements = result.structuredContent!['elements'] as Array<any>

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
})
