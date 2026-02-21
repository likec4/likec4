// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { queryByTags } from './query-by-tags'

describe('query-by-tags tool', () => {
  describe('allOf logic', () => {
    it('should match elements with all specified tags', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: ['public', 'api'], anyOf: [], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string; tags: string[] }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('api1')
      expect(ids).toContain('api2')
      expect(ids).not.toContain('web')
    })

    it('should not match if missing any tag', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: ['public', 'api'], anyOf: [], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('anyOf logic', () => {
    it('should match elements with at least one tag', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: [], anyOf: ['deprecated', 'legacy'], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(3)
      const ids = results.map(r => r.id)
      expect(ids).toContain('old1')
      expect(ids).toContain('old2')
      expect(ids).toContain('old3')
      expect(ids).not.toContain('new')
    })

    it('should not match if has none of the tags', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: [], anyOf: ['deprecated', 'legacy'], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('noneOf logic', () => {
    it('should match elements without any specified tags', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: [], anyOf: [], noneOf: ['deprecated', 'legacy'], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('good1')
      expect(ids).toContain('good2')
      expect(ids).not.toContain('bad1')
      expect(ids).not.toContain('bad2')
    })

    it('should not match if has any of the tags', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: [], anyOf: [], noneOf: ['deprecated', 'legacy'], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
    })
  })

  describe('combined conditions', () => {
    it('should apply AND logic across all conditions', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        {
          allOf: ['microservice'],
          anyOf: ['public', 'internal'],
          noneOf: ['deprecated'],
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('good')
      expect(ids).toContain('bad1')
      expect(ids).not.toContain('bad2') // Has deprecated
      expect(ids).not.toContain('bad3') // Missing microservice
    })

    it('should reject query with no conditions', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          service = system 'Service'
        }
      `)

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)

      const result = await handler(
        { allOf: [], anyOf: [], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.isError).toBe(true)
      const content = result.content![0]!
      expect('text' in content && content.text).toContain('At least one condition')
    })
  })

  describe('edge cases', () => {
    it('should be case-sensitive', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: ['public'], anyOf: [], noneOf: [], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0) // Should not match due to case sensitivity
    })

    it('should handle elements with no tags', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = queryByTags(services.likec4.LanguageServices)
      const result = await handler(
        { allOf: [], anyOf: [], noneOf: ['deprecated'], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results.length).toBeGreaterThanOrEqual(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('tagged')
      expect(ids).toContain('untagged')
    })
  })
})
