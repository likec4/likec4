// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { MCPServerFactory } from '../mcp/server/MCPServerFactory'
import { readDeployment } from '../mcp/tools/read-deployment'
import { readElement } from '../mcp/tools/read-element'
import { createTestServices } from '../test'

describe('MCP server integration - tools expose links', () => {
  it('read-element returns links when called via tool handler by name', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        element system
      }
      model {
        cloud = system 'Cloud System' {
          link https://likec4.dev/docs
          link https://github.com/likec4/likec4 'repo'
        }
      }
    `)

    await buildLikeC4Model()

    // Spin up MCP server (in-memory) to ensure registration works
    const mcpFactory = new MCPServerFactory({
      likec4: { LanguageServices: services.likec4.LanguageServices } as any,
      shared: { lsp: {} } as any,
    } as any)
    const _server = mcpFactory.create()

    // Get the tool by name via the registration tuple
    const [name, _cfg, handler] = readElement(services.likec4.LanguageServices)
    expect(name).toBe('read-element')

    const result = await handler({ id: 'cloud', project: 'default' as ProjectId } as any, {} as any)

    expect(result.structuredContent).toBeDefined()
    const links = result.structuredContent!['links'] as Array<{ url: string; title: string | null }>
    expect(Array.isArray(links)).toBe(true)
    expect(links.length).toBe(2)
    expect(links[0]!.url).toBe('https://likec4.dev/docs')
    expect(links[0]!.title).toBeNull()
    expect(links[1]!.url).toBe('https://github.com/likec4/likec4')
    expect(links[1]!.title).toBe('repo')
  })

  it('read-deployment returns links for deployment nodes', async () => {
    const { validate, buildLikeC4Model, services } = createTestServices()

    await validate(`
      specification {
        deploymentNode cluster
      }
      model {}
      deployment {
        dc = cluster 'DC' {
          link https://status.example.com 'status'
        }
      }
    `)

    await buildLikeC4Model()

    const mcpFactory = new MCPServerFactory({
      likec4: { LanguageServices: services.likec4.LanguageServices } as any,
      shared: { lsp: {} } as any,
    } as any)
    const _server = mcpFactory.create()

    const [name, _cfg, handler] = readDeployment(services.likec4.LanguageServices)
    expect(name).toBe('read-deployment')

    const result = await handler({ id: 'dc', project: 'default' as ProjectId } as any, {} as any)

    expect(result.structuredContent).toBeDefined()
    const links = result.structuredContent!['links'] as Array<{ url: string; title: string | null }>
    expect(Array.isArray(links)).toBe(true)
    expect(links.length).toBe(1)
    expect(links[0]!.url).toBe('https://status.example.com')
    expect(links[0]!.title).toBe('status')
  })
})
