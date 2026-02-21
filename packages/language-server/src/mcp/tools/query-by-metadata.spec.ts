// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { queryByMetadata } from './query-by-metadata'

describe('query-by-metadata tool', () => {
  describe('exact match', () => {
    it('should find elements with exact metadata value', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'platform-team'
            }
          }
          backend = system 'Backend' {
            metadata {
              owner 'platform-team'
            }
          }
          database = system 'Database' {
            metadata {
              owner 'data-team'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'owner', value: 'platform-team', matchMode: 'exact', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string; matchedValue: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('frontend')
      expect(ids).toContain('backend')
      expect(ids).not.toContain('database')
      expect(results[0]!.matchedValue).toBe('platform-team')
    })

    it('should be case-sensitive', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'Platform-Team'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'owner', value: 'platform-team', matchMode: 'exact', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(0) // Should not match due to case sensitivity
    })
  })

  describe('contains match', () => {
    it('should find elements containing substring', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          lambda1 = system 'Lambda 1' {
            metadata {
              tech 'AWS Lambda'
            }
          }
          lambda2 = system 'Lambda 2' {
            metadata {
              tech 'aws-lambda-nodejs'
            }
          }
          ec2 = system 'EC2' {
            metadata {
              tech 'AWS EC2'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'tech', value: 'lambda', matchMode: 'contains', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('lambda1')
      expect(ids).toContain('lambda2')
      expect(ids).not.toContain('ec2')
    })

    it('should be case-insensitive', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          service = system 'Service' {
            metadata {
              tech 'AWS'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'tech', value: 'aws', matchMode: 'contains', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('service')
    })
  })

  describe('exists match', () => {
    it('should find elements with metadata key present', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'team-a'
            }
          }
          backend = system 'Backend' {
            metadata {
              owner 'team-b'
            }
          }
          database = system 'Database'
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'owner', value: '', matchMode: 'exists', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(2)
      const ids = results.map(r => r.id)
      expect(ids).toContain('frontend')
      expect(ids).toContain('backend')
      expect(ids).not.toContain('database')
    })

    it('should ignore value parameter', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'any-value'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'owner', value: 'ignored', matchMode: 'exists', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('frontend')
    })
  })

  describe('edge cases', () => {
    it('should return empty results for non-existent key', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'team'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'nonexistent', value: '', matchMode: 'exists', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
    })

    it('should handle non-empty metadata value with exists mode', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              status 'active'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'status', value: '', matchMode: 'exists', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('frontend')
    })
  })

  describe('exact match mode', () => {
    it('should match with explicit exact mode', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          frontend = system 'Frontend' {
            metadata {
              owner 'platform-team'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      // Note: matchMode defaults to 'exact' via Zod schema; we pass it explicitly here
      // because the handler expects the parsed (post-default) shape
      const result = await handler(
        { key: 'owner', value: 'platform-team', matchMode: 'exact', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      expect(results).toHaveLength(1)
      expect(results[0]!.id).toBe('frontend')
    })
  })

  describe('empty string values', () => {
    it('should not reject empty string search value in exact mode', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          system1 = system 'System1' {
            metadata {
              owner 'team-a'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)

      // Search for empty string should not throw error (previously failed with if (!searchValue))
      const result = await handler(
        { key: 'owner', value: '', matchMode: 'exact', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      // No elements with empty string value, so should return empty array (not error)
      expect(results).toHaveLength(0)
    })

    it('should handle empty string search in contains mode correctly', async () => {
      const { validate, services } = createTestServices()

      await validate(`
        specification {
          element system
        }
        model {
          system1 = system 'System1' {
            metadata {
              tech 'some text'
            }
          }
          system2 = system 'System2' {
            metadata {
              tech 'other content'
            }
          }
        }
      `)

      const [_name, _config, handler] = queryByMetadata(services.likec4.LanguageServices)
      const result = await handler(
        { key: 'tech', value: '', matchMode: 'contains', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<{ id: string }>
      // Empty string is contained in all strings, so should match both
      expect(results).toHaveLength(2)
    })
  })
})
