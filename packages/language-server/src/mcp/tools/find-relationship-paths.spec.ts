// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { findRelationshipPaths } from './find-relationship-paths'

describe('find-relationship-paths tool', () => {
  describe('direct paths', () => {
    it('should find 1-hop direct relationship', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'

          frontend -> backend
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number; steps: any[] }>
      expect(paths).toHaveLength(1)
      expect(paths[0]!.length).toBe(1)
      expect(paths[0]!.steps).toHaveLength(1)
      expect(paths[0]!.steps[0]!.source).toBe('frontend')
      expect(paths[0]!.steps[0]!.target).toBe('backend')
    })
  })

  describe('multi-hop paths', () => {
    it('should find 2-hop path', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          cache = system 'Cache'
          backend = system 'Backend'

          frontend -> cache
          cache -> backend
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number; steps: any[] }>
      expect(paths.length).toBeGreaterThanOrEqual(1)

      // Find the 2-hop path
      const twoHopPath = paths.find(p => p.length === 2)
      expect(twoHopPath).toBeDefined()
      expect(twoHopPath!.steps).toHaveLength(2)
      expect(twoHopPath!.steps[0]!.source).toBe('frontend')
      expect(twoHopPath!.steps[0]!.target).toBe('cache')
      expect(twoHopPath!.steps[1]!.source).toBe('cache')
      expect(twoHopPath!.steps[1]!.target).toBe('backend')
    })

    it('should find multiple paths', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          cache = system 'Cache'
          backend = system 'Backend'

          frontend -> backend
          frontend -> cache
          cache -> backend
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number; steps: any[] }>
      expect(paths.length).toBeGreaterThanOrEqual(2)

      // Should have both direct (1-hop) and indirect (2-hop) paths
      const lengths = paths.map(p => p.length)
      expect(lengths).toContain(1) // Direct path
      expect(lengths).toContain(2) // Via cache
    })

    it('should sort paths by length', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'
          d = system 'D'

          a -> d
          a -> b
          b -> c
          c -> d
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'd', maxDepth: 5, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number }>
      expect(paths.length).toBeGreaterThanOrEqual(1)

      // Verify paths are sorted by length (shortest first)
      for (let i = 1; i < paths.length; i++) {
        expect(paths[i]!.length).toBeGreaterThanOrEqual(paths[i - 1]!.length)
      }
    })
  })

  describe('maxDepth', () => {
    it('should respect maxDepth limit', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'
          d = system 'D'

          a -> b
          b -> c
          c -> d
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'd', maxDepth: 2, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number }>

      // Should not find the 3-hop path when maxDepth=2
      expect(paths.length).toBe(0)
    })

    it('should find path within maxDepth', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'

          a -> b
          b -> c
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'c', maxDepth: 3, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number }>
      expect(paths.length).toBeGreaterThanOrEqual(1)
      expect(paths[0]!.length).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should return empty array when no path exists', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<any>
      expect(paths).toHaveLength(0)
    })

    it('should avoid cycles within a returned path', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'
          d = system 'D'

          a -> b
          b -> c
          c -> a
          b -> d
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'd', maxDepth: 5, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{
        steps: Array<{ source: string; target: string }>
      }>
      expect(paths.length).toBeGreaterThan(0)

      for (const path of paths) {
        const visited = new Set<string>()
        for (const step of path.steps) {
          expect(visited.has(step.source)).toBe(false)
          visited.add(step.source)
        }
      }
    })

    it('should reject source equals target', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'frontend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.isError).toBe(true)
      const content = result.content![0]!
      expect('text' in content && content.text).toContain('Source and target must be different')
    })

    it('should return empty paths for parent-child with no relationships', async () => {
      const { validate, services } = createTestServices()

      await validate(`
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

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'shop',
          targetId: 'shop.frontend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<any>
      expect(paths).toHaveLength(0)
    })

    it('should handle non-existent source', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          backend = system 'Backend'
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'nonexistent',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.isError).toBe(true)
      const content = result.content![0]!
      expect('text' in content && content.text).toContain('Source element "nonexistent" not found')
    })

    it('should handle non-existent target', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend'
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'nonexistent',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.isError).toBe(true)
      const content = result.content![0]!
      expect('text' in content && content.text).toContain('Target element "nonexistent" not found')
    })
  })

  describe('relationship details', () => {
    it('should include relationship metadata in path steps', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
          relationship uses
        }
        model {
          frontend = system 'Frontend'
          backend = system 'Backend'

          frontend -> backend {
            title 'Calls API'
            technology 'HTTPS'
          }
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        {
          sourceId: 'frontend',
          targetId: 'backend',
          maxDepth: 3,
          includeIndirect: false,
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{
        steps: Array<{
          relationship: {
            kind: string | null
            title: string | null
            technology: string | null
            tags: string[]
          }
        }>
      }>
      expect(paths.length).toBeGreaterThanOrEqual(1)
      const path = paths.find(p => p.steps[0]!.relationship.title === 'Calls API')
      expect(path).toBeDefined()
      expect(path!.steps[0]!.relationship.technology).toBe('HTTPS')
    })
  })

  describe('default maxDepth', () => {
    it('should not find paths beyond maxDepth of 3', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'
          d = system 'D'
          e = system 'E'

          a -> b
          b -> c
          c -> d
          d -> e
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'e', maxDepth: 3, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{ length: number }>

      // 4-hop path should not be found with default maxDepth=3
      expect(paths.length).toBe(0)
    })
  })

  describe('multiple relationships between same elements', () => {
    it('should distinguish multiple relationships with different properties', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          api = system 'API'
          database = system 'Database'

          api -> database 'reads' {
            technology 'SQL'
          }
          api -> database 'writes' {
            technology 'gRPC'
          }
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'api', targetId: 'database', maxDepth: 3, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{
        length: number
        steps: Array<{
          source: string
          target: string
          relationship: {
            title: string | null
            technology: string | null
          }
        }>
      }>

      // Should find 2 distinct paths
      expect(paths).toHaveLength(2)

      // Both paths should be 1 hop
      expect(paths[0]!.length).toBe(1)
      expect(paths[1]!.length).toBe(1)

      // Extract the relationship details
      const rel1 = paths[0]!.steps[0]!.relationship
      const rel2 = paths[1]!.steps[0]!.relationship

      // Should have both relationships with their distinct properties
      const titles = [rel1.title, rel2.title].sort()
      const technologies = [rel1.technology, rel2.technology].sort()

      expect(titles).toEqual(['reads', 'writes'])
      expect(technologies).toEqual(['SQL', 'gRPC'])
    })

    it('should preserve relationship details in multi-hop paths with parallel edges', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          a = system 'A'
          b = system 'B'
          c = system 'C'

          a -> b 'fast' {
            technology 'HTTP/2'
          }
          a -> b 'slow' {
            technology 'HTTP/1'
          }
          b -> c 'reliable'
        }
      `)

      const [_name, _config, handler] = findRelationshipPaths(services.likec4.LanguageServices)
      const result = await handler(
        { sourceId: 'a', targetId: 'c', maxDepth: 3, includeIndirect: false, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const paths = result.structuredContent!['paths'] as Array<{
        length: number
        steps: Array<{
          relationship: {
            title: string | null
            technology: string | null
          }
        }>
      }>

      // Should find 2 distinct 2-hop paths (a->b via fast, b->c) and (a->b via slow, b->c)
      expect(paths).toHaveLength(2)
      expect(paths[0]!.length).toBe(2)
      expect(paths[1]!.length).toBe(2)

      // First step of each path should have different titles/technologies
      const firstSteps = paths.map(p => p.steps[0]!.relationship)
      const titles = firstSteps.map(r => r.title).sort()
      const technologies = firstSteps.map(r => r.technology).sort()

      expect(titles).toEqual(['fast', 'slow'])
      expect(technologies).toEqual(['HTTP/1', 'HTTP/2'])

      // Second step should be the same for both paths
      const secondSteps = paths.map(p => p.steps[1]!.relationship)
      expect(secondSteps[0]!.title).toBe('reliable')
      expect(secondSteps[1]!.title).toBe('reliable')
    })
  })
})
