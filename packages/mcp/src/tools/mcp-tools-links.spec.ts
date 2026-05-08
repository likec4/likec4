// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

describe('MCP Tools - Links', () => {
  // These tests verify that MCP server tools correctly return link information
  // in their structured content responses. The tools query the model and
  // transform links to the expected format:
  // { title: link.title ?? null, url: link.url, relative: link.relative ?? null }

  describe('read-element tool', () => {
    it('should include links in element response', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          cloud = system 'Cloud System' {
            link https://likec4.dev/docs/dsl/model/
            link https://github.com/likec4/likec4 'GitHub Repository'

            ui = container 'Frontend' {
              link https://docs.example.com/frontend 'Documentation'
              link ./README.md 'Local Docs'
            }
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'cloud', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(2)

      // Verify MCP tool transforms links correctly
      expect(links[0]!.url).toBe('https://likec4.dev/docs/dsl/model/')
      expect(links[0]!.title).toBeNull() // MCP transforms undefined to null

      expect(links[1]!.url).toBe('https://github.com/likec4/likec4')
      expect(links[1]!.title).toBe('GitHub Repository')
    })

    it('should have empty links array for elements without links', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          cloud = system 'Cloud System'
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'cloud', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(0)
    })

    it('should not crash when element.links is null/undefined', async () => {
      // Test with minimal element that has no links property
      await using pair = await createMCPTestPair(`
        specification {
          element component
        }
        model {
          minimal = component 'Minimal'
        }
      `)

      // This should not throw even if element.links is null/undefined
      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'minimal', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(Array.isArray(links)).toBe(true)
      expect(links).toHaveLength(0)
    })

    it('should handle relative links correctly', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element container
        }
        model {
          ui = container 'Frontend' {
            link ./docs/README.md 'Relative Documentation'
            link ../CONTRIBUTING.md
            link /absolute/path.md 'Absolute Path'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'ui', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(3)

      // Verify MCP tool transforms all links correctly
      expect(links[0]!.url).toBe('./docs/README.md')
      expect(links[0]!.title).toBe('Relative Documentation')

      expect(links[1]!.url).toBe('../CONTRIBUTING.md')
      expect(links[1]!.title).toBeNull()

      expect(links[2]!.url).toBe('/absolute/path.md')
      expect(links[2]!.title).toBe('Absolute Path')
    })

    it('should preserve link order', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          cloud = system 'Cloud System' {
            link https://first.com 'First'
            link https://second.com 'Second'
            link https://third.com 'Third'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-element',
        arguments: { id: 'cloud', project: 'default' },
      })

      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toHaveLength(3)
      expect(links[0]!.url).toBe('https://first.com')
      expect(links[1]!.url).toBe('https://second.com')
      expect(links[2]!.url).toBe('https://third.com')
    })
  })

  describe('read-deployment tool', () => {
    it('should include links in deployment nodes', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          deploymentNode cluster
        }
        model {}
        deployment {
          datacenter = cluster 'Data Center' {
            link https://datacenter.example.com 'Monitoring Dashboard'
            link https://status.example.com
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-deployment',
        arguments: { id: 'datacenter', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(2)

      expect(links[0]!.url).toBe('https://datacenter.example.com')
      expect(links[0]!.title).toBe('Monitoring Dashboard')

      expect(links[1]!.url).toBe('https://status.example.com')
      expect(links[1]!.title).toBeNull()
    })

    it('should have empty links array for deployment nodes without links', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          deploymentNode cluster
        }
        model {
          cloud = system 'Cloud System'
        }
        deployment {
          datacenter = cluster 'Data Center'
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-deployment',
        arguments: { id: 'datacenter', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(0)
    })

    it('should not crash when deployment node links is null/undefined', async () => {
      // Test with minimal deployment node that has no links property
      await using pair = await createMCPTestPair(`
        specification {
          deploymentNode server
        }
        model {}
        deployment {
          minimal = server 'Minimal Server'
        }
      `)

      // This should not throw even if element.links is null/undefined
      const result = await pair.client.callTool({
        name: 'read-deployment',
        arguments: { id: 'minimal', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(Array.isArray(links)).toBe(true)
      expect(links).toHaveLength(0)
    })

    it('should include links in deployed instances', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          deploymentNode server
        }
        model {
          cloud = system 'Cloud System'
        }
        deployment {
          server1 = server 'Web Server' {
            cloudInstance = instanceOf cloud {
              link https://console.example.com 'Console'
              link https://health.example.com
            }
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'read-deployment',
        arguments: { id: 'server1.cloudInstance', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const links = structured(result)['links'] as Array<{ url: string; title: string | null }>
      expect(links).toBeDefined()
      expect(links).toHaveLength(2)

      expect(links[0]!.url).toBe('https://console.example.com')
      expect(links[0]!.title).toBe('Console')

      expect(links[1]!.url).toBe('https://health.example.com')
      expect(links[1]!.title).toBeNull()
    })
  })
})
