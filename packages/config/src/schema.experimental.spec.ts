import { describe, expect, it } from 'vitest'
import { LikeC4ExperimentalConfigSchema } from './schema'

describe('LikeC4ExperimentalConfigSchema', () => {
  describe('valid configurations', () => {
    it('should accept undefined experimental config', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })

    it('should accept empty object', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept dynamicBranchCollections: true', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        dynamicBranchCollections: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.dynamicBranchCollections).toBe(true)
      }
    })

    it('should accept dynamicBranchCollections: false', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        dynamicBranchCollections: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.dynamicBranchCollections).toBe(false)
      }
    })

    it('should accept missing dynamicBranchCollections property', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.dynamicBranchCollections).toBeUndefined()
      }
    })
  })

  describe('invalid configurations', () => {
    it('should reject dynamicBranchCollections with non-boolean value', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        dynamicBranchCollections: 'true',
      })
      expect(result.success).toBe(false)
    })

    it('should reject dynamicBranchCollections with number value', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        dynamicBranchCollections: 1,
      })
      expect(result.success).toBe(false)
    })

    it('should reject dynamicBranchCollections with null value', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        dynamicBranchCollections: null,
      })
      expect(result.success).toBe(false)
    })

    it('should reject unknown properties', () => {
      const result = LikeC4ExperimentalConfigSchema.safeParse({
        unknownFeature: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('metadata', () => {
    it('should have description metadata', () => {
      const schema = LikeC4ExperimentalConfigSchema
      expect(schema?._def?.description).toBeDefined()
    })
  })
})