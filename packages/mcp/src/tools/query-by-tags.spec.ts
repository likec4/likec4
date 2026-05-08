// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured, textContent } from '../__tests__/test-utils'

describe('query-by-tags tool', () => {
  describe('allOf logic', () => {
    it('should match elements with all specified tags', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag public
          tag api
          tag rest
        }
        model {
          api1 = system 'API 1' {
            #public
            #api
            #rest
          }
          api2 = system 'API 2' {
            #public
            #api
          }
          web = system 'Web' {
            #public
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: ['public', 'api'], anyOf: [], noneOf: [], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string; tags: string[] }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('api1')
      expect(ids).toContain('api2')
      expect(ids).not.toContain('web')
    })

    it('should not match if missing any tag', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag public
          tag api
        }
        model {
          service = system 'Service' {
            #public
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: ['public', 'api'], anyOf: [], noneOf: [], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('anyOf logic', () => {
    it('should match elements with at least one tag', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag deprecated
          tag legacy
        }
        model {
          old1 = system 'Old 1' {
            #deprecated
          }
          old2 = system 'Old 2' {
            #legacy
          }
          old3 = system 'Old 3' {
            #deprecated
            #legacy
          }
          new = system 'New'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: ['deprecated', 'legacy'], noneOf: [], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(3)
      const ids = results.map(r => r.id)
      expect(ids).toContain('old1')
      expect(ids).toContain('old2')
      expect(ids).toContain('old3')
      expect(ids).not.toContain('new')
    })

    it('should not match if has none of the tags', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag active
        }
        model {
          service = system 'Service' {
            #active
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: ['deprecated', 'legacy'], noneOf: [], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('noneOf logic', () => {
    it('should match elements without any specified tags', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag active
          tag stable
          tag deprecated
          tag legacy
        }
        model {
          good1 = system 'Good 1' {
            #active
            #stable
          }
          good2 = system 'Good 2' {
            #active
          }
          bad1 = system 'Bad 1' {
            #active
            #deprecated
          }
          bad2 = system 'Bad 2' {
            #legacy
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: [], noneOf: ['deprecated', 'legacy'], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('good1')
      expect(ids).toContain('good2')
      expect(ids).not.toContain('bad1')
      expect(ids).not.toContain('bad2')
    })

    it('should not match if has any of the tags', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag active
          tag deprecated
        }
        model {
          service = system 'Service' {
            #active
            #deprecated
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: [], noneOf: ['deprecated', 'legacy'], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('combined conditions', () => {
    it('should apply AND logic across all conditions', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag public
          tag internal
          tag microservice
          tag deprecated
        }
        model {
          good = system 'Good' {
            #public
            #microservice
          }
          bad1 = system 'Bad 1' {
            #internal
            #microservice
          }
          bad2 = system 'Bad 2' {
            #public
            #microservice
            #deprecated
          }
          bad3 = system 'Bad 3' {
            #public
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: {
          allOf: ['microservice'],
          anyOf: ['public', 'internal'],
          noneOf: ['deprecated'],
          project: 'default',
        },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('good')
      expect(ids).toContain('bad1')
      expect(ids).not.toContain('bad2') // Has deprecated
      expect(ids).not.toContain('bad3') // Missing microservice
    })

    it('should reject query with no conditions', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
        }
        model {
          service = system 'Service'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: [], noneOf: [], project: 'default' },
      })

      expect(result.isError).toBe(true)
      const content = textContent(result)[0]!
      expect('text' in content && content.text).toContain('At least one condition')
    })
  })

  describe('edge cases', () => {
    it('should be case-sensitive', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag Public
        }
        model {
          service = system 'Service' {
            #Public
          }
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: ['public'], anyOf: [], noneOf: [], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0) // Should not match due to case sensitivity
    })

    it('should handle elements with no tags', async () => {
      await using pair = await createMCPTestPair(`
        specification {
          element system
          tag public
        }
        model {
          tagged = system 'Tagged' {
            #public
          }
          untagged = system 'Untagged'
        }
      `)

      const result = await pair.client.callTool({
        name: 'query-by-tags',
        arguments: { allOf: [], anyOf: [], noneOf: ['deprecated'], project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<{ id: string }>
      expect(results.length).toBeGreaterThanOrEqual(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('tagged')
      expect(ids).toContain('untagged')
    })
  })
})
