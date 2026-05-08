// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from '../__tests__/test-utils'

describe('query-graph tool', () => {
  describe('ancestors', () => {
    it('should return all parent elements up to root', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
          element component
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend' {
              auth = component 'Auth' {
                service = component 'Auth Service'
              }
            }
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: {
          elementId: 'shop.frontend.auth.service',
          queryType: 'ancestors',
          includeIndirect: true,
          project: 'default',
        },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string; name: string }>
      expect(results).toHaveLength(3)
      expect(results[0]!.id).toBe('shop.frontend.auth')
      expect(results[1]!.id).toBe('shop.frontend')
      expect(results[2]!.id).toBe('shop')
    })

    it('should return empty array for root element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          shop = system 'Shop'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'ancestors', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('descendants', () => {
    it('should return all child elements recursively', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
          element component
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend' {
              auth = component 'Auth'
            }
            backend = container 'Backend'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'descendants', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results.length).toBeGreaterThanOrEqual(3)
      const ids = results.map(r => r.id)
      expect(ids).toContain('shop.frontend')
      expect(ids).toContain('shop.backend')
      expect(ids).toContain('shop.frontend.auth')
    })

    it('should return empty array for leaf element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: {
          elementId: 'shop.frontend',
          queryType: 'descendants',
          includeIndirect: true,
          project: 'default',
        },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('siblings', () => {
    it('should return elements at same hierarchy level', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend'
            backend = container 'Backend'
            database = container 'Database'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop.frontend', queryType: 'siblings', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('shop.backend')
      expect(ids).toContain('shop.database')
    })

    it('should return empty array for only child', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop.frontend', queryType: 'siblings', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('children', () => {
    it('should return direct children only', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
          element component
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend' {
              auth = component 'Auth'
            }
            backend = container 'Backend'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'children', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('shop.frontend')
      expect(ids).toContain('shop.backend')
      expect(ids).not.toContain('shop.frontend.auth') // Not a direct child
    })

    it('should return empty array for leaf element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend'
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop.frontend', queryType: 'children', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('parent', () => {
    it('should return direct parent element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
          element component
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend' {
              auth = component 'Auth'
            }
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: {
          elementId: 'shop.frontend.auth',
          queryType: 'parent',
          includeIndirect: true,
          project: 'default',
        },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('shop.frontend')
    })

    it('should return empty array for root element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          shop = system 'Shop'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'parent', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('incomers', () => {
    it('should return elements with outgoing relationships to this element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'
          database = system 'Database'

          frontend -> database
          backend -> database
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'database', queryType: 'incomers', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('frontend')
      expect(ids).toContain('backend')
    })

    it('should return empty array when no incoming relationships', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'frontend', queryType: 'incomers', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })

    it('should respect includeIndirect=false for nested incoming relationships', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          external = system 'External'
          shop = system 'Shop' {
            api = container 'API'
          }

          external -> shop.api
        }
      `)

      const directOnly = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'incomers', includeIndirect: false, project: 'default' },
      })
      const withIndirect = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'incomers', includeIndirect: true, project: 'default' },
      })

      const directResults = structured(directOnly)['results'] as Array<{ id: string }>
      const indirectResults = structured(withIndirect)['results'] as Array<{ id: string }>
      expect(directResults).toHaveLength(0)
      expect(indirectResults.map(r => r.id)).toContain('external')
    })
  })

  describe('outgoers', () => {
    it('should return elements receiving relationships from this element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'
          database = system 'Database'

          frontend -> backend
          frontend -> database
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'frontend', queryType: 'outgoers', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('backend')
      expect(ids).toContain('database')
    })

    it('should return empty array when no outgoing relationships', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'frontend', queryType: 'outgoers', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })

    it('should respect includeIndirect=false for nested outgoing relationships', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
        }
        model {
          target = system 'Target'
          shop = system 'Shop' {
            api = container 'API'
          }

          shop.api -> target
        }
      `)

      const directOnly = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'outgoers', includeIndirect: false, project: 'default' },
      })
      const withIndirect = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'outgoers', includeIndirect: true, project: 'default' },
      })

      const directResults = structured(directOnly)['results'] as Array<{ id: string }>
      const indirectResults = structured(withIndirect)['results'] as Array<{ id: string }>
      expect(directResults).toHaveLength(0)
      expect(indirectResults.map(r => r.id)).toContain('target')
    })
  })

  describe('error handling', () => {
    it('should throw error for non-existent element', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          shop = system 'Shop'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: {
          elementId: 'nonexistent',
          queryType: 'ancestors',
          includeIndirect: true,
          project: 'default',
        },
      })

      expect(result.isError).toBe(true)
      const content = textContent(result)[0]!
      expect('text' in content && content.text).toContain('Element "nonexistent" not found')
    })
  })

  describe('metadata and tags', () => {
    it('should include metadata and tags in results', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          element container
          tag public
        }
        model {
          shop = system 'Shop' {
            frontend = container 'Frontend' {
              #public
              metadata {
                owner 'platform-team'
                tier 'critical'
              }
            }
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-graph',
        arguments: { elementId: 'shop', queryType: 'children', includeIndirect: true, project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{
        id: string
        tags: string[]
        metadata: Record<string, string>
      }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('shop.frontend')
      expect(results[0]!.tags).toContain('public')
      expect(results[0]!.metadata).toEqual({ owner: 'platform-team', tier: 'critical' })
    })
  })
})
