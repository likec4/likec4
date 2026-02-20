// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { queryByTagPattern } from './query-by-tag-pattern'

describe('query-by-tag-pattern tool', () => {
  describe('prefix matching', () => {
    it('should match tags starting with pattern', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag target_asil_qm
          tag target_asil_asil_b
          tag unit_asil_qm
          tag is_in_dag
        }
        model {
          a = system 'A' {
            #target_asil_qm
            #is_in_dag
          }
          b = system 'B' {
            #target_asil_asil_b
            #is_in_dag
          }
          c = system 'C' {
            #unit_asil_qm
            #is_in_dag
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'target_asil', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      const matchedTagValues = result.structuredContent!['matchedTagValues'] as string[]

      expect(results).toHaveLength(2)
      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(ids).not.toContain('c') // unit_asil_qm doesn't start with target_asil

      expect(matchedTagValues).toContain('target_asil_qm')
      expect(matchedTagValues).toContain('target_asil_asil_b')
      expect(matchedTagValues).not.toContain('unit_asil_qm')
    })
  })

  describe('contains matching', () => {
    it('should match tags containing pattern anywhere', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag target_asil_qm
          tag unit_asil_qm
          tag is_in_dag
        }
        model {
          a = system 'A' {
            #target_asil_qm
          }
          b = system 'B' {
            #unit_asil_qm
          }
          c = system 'C' {
            #is_in_dag
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'asil', matchMode: 'contains', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>

      expect(results).toHaveLength(2)
      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(ids).not.toContain('c')
    })
  })

  describe('suffix matching', () => {
    it('should match tags ending with pattern', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag target_asil_qm__tbc
          tag target_asil_asil_b__tbc
          tag target_asil_qm
        }
        model {
          a = system 'A' {
            #target_asil_qm__tbc
          }
          b = system 'B' {
            #target_asil_asil_b__tbc
          }
          c = system 'C' {
            #target_asil_qm
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: '__tbc', matchMode: 'suffix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>

      expect(results).toHaveLength(2)
      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(ids).not.toContain('c')
    })
  })

  describe('case insensitivity', () => {
    it('should be case-insensitive', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag TargetASIL
        }
        model {
          a = system 'A' {
            #TargetASIL
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'targetasil', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(1)
    })
  })

  describe('matchedTags field', () => {
    it('should include only matched tags per element', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag schedule_a
          tag schedule_b
          tag is_in_dag
        }
        model {
          a = system 'A' {
            #schedule_a
            #schedule_b
            #is_in_dag
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'schedule', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(1)
      expect(results[0].matchedTags).toEqual(['schedule_a', 'schedule_b'])
      expect(results[0].matchedTags).not.toContain('is_in_dag')
    })
  })

  describe('edge cases', () => {
    it('should return empty results for non-matching pattern', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag public
        }
        model {
          a = system 'A' {
            #public
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'nonexistent', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
      expect(result.structuredContent!['matchedTagValues']).toEqual([])
    })

    it('should collect all matchedTagValues across elements', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          tag sched_a
          tag sched_b
        }
        model {
          a = system 'A' {
            #sched_a
          }
          b = system 'B' {
            #sched_b
          }
        }
      `)

      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'sched_', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const matchedTagValues = result.structuredContent!['matchedTagValues'] as string[]
      expect(matchedTagValues).toContain('sched_a')
      expect(matchedTagValues).toContain('sched_b')
    })
  })
})
