// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { createMCPTestPair, structured } from '../__tests__/test-utils'

describe('query-by-tag-pattern tool', () => {
  describe('prefix matching', () => {
    it('should match tags starting with pattern', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'target_asil', matchMode: 'prefix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      const matchedTagValues = structured(result)['matchedTagValues'] as string[]

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
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'asil', matchMode: 'contains', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>

      expect(results).toHaveLength(2)
      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(ids).not.toContain('c')
    })
  })

  describe('suffix matching', () => {
    it('should match tags ending with pattern', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: '__tbc', matchMode: 'suffix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>

      expect(results).toHaveLength(2)
      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(ids).not.toContain('c')
    })
  })

  describe('case insensitivity', () => {
    it('should be case-insensitive', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'targetasil', matchMode: 'prefix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(1)
    })
  })

  describe('matchedTags field', () => {
    it('should include only matched tags per element', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'schedule', matchMode: 'prefix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(1)
      expect(results[0].matchedTags).toEqual(['schedule_a', 'schedule_b'])
      expect(results[0].matchedTags).not.toContain('is_in_dag')
    })
  })

  describe('edge cases', () => {
    it('should return empty results for non-matching pattern', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'nonexistent', matchMode: 'prefix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const results = structured(result)['results'] as Array<any>
      expect(results).toHaveLength(0)
      expect(structured(result)['matchedTagValues']).toEqual([])
    })

    it('should collect all matchedTagValues across elements', async () => {
      await using pair = await createMCPTestPair(`
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

      const result = await pair.client.callTool({
        name: 'query-by-tag-pattern',
        arguments: { pattern: 'sched_', matchMode: 'prefix', project: 'default' },
      })

      expect(result.structuredContent).toBeDefined()
      const matchedTagValues = structured(result)['matchedTagValues'] as string[]
      expect(matchedTagValues).toContain('sched_a')
      expect(matchedTagValues).toContain('sched_b')
    })
  })
})
