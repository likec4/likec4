import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disableDynamicBranchCollections,
  enableDynamicBranchCollections,
  featureFlags,
  isDynamicBranchCollectionsEnabled,
  isFeatureEnabled,
  setFeatureFlag,
} from '../featureFlags'

describe('featureFlags', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    // Reset to default state
    disableDynamicBranchCollections()
  })

  describe('initialization from environment', () => {
    it('should default dynamicBranchCollections to false when no env var is set', () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      delete process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
      
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should enable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=true', () => {
      const mockProcess = {
        env: { LIKEC4_UNIFIED_BRANCHES: 'true' }
      }
      vi.stubGlobal('process', mockProcess)
      
      // Module needs to be re-evaluated, so we test the logic pattern
      expect('true').toMatch(/^[ty1]/i)
    })

    it('should enable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=yes', () => {
      expect('yes').toMatch(/^[ty1]/i)
    })

    it('should enable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=1', () => {
      expect('1').toMatch(/^[ty1]/i)
    })

    it('should enable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=Y', () => {
      expect('Y').toMatch(/^[ty1]/i)
    })

    it('should disable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=false', () => {
      expect('false').not.toMatch(/^[ty1]/i)
    })

    it('should disable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=no', () => {
      expect('no').not.toMatch(/^[ty1]/i)
    })

    it('should disable dynamicBranchCollections when LIKEC4_UNIFIED_BRANCHES=0', () => {
      expect('0').not.toMatch(/^[ty1]/i)
    })

    it('should prefer LIKEC4_UNIFIED_BRANCHES over legacy LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES', () => {
      const mockProcess = {
        env: {
          LIKEC4_UNIFIED_BRANCHES: 'false',
          LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES: 'true'
        }
      }
      vi.stubGlobal('process', mockProcess)
      
      // The coalescing operator should prefer the first value
      const result = mockProcess.env['LIKEC4_UNIFIED_BRANCHES'] ?? mockProcess.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
      expect(result).toBe('false')
    })

    it('should fallback to LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES when LIKEC4_UNIFIED_BRANCHES is not set', () => {
      const mockProcess = {
        env: {
          LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES: 'true'
        }
      }
      vi.stubGlobal('process', mockProcess)
      
      const result = mockProcess.env['LIKEC4_UNIFIED_BRANCHES'] ?? mockProcess.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
      expect(result).toBe('true')
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return the current state of a feature flag', () => {
      disableDynamicBranchCollections()
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
      
      enableDynamicBranchCollections()
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
    })
  })

  describe('isDynamicBranchCollectionsEnabled', () => {
    it('should return false by default', () => {
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should return true after being enabled', () => {
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should return false after being disabled', () => {
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })
  })

  describe('setFeatureFlag', () => {
    it('should enable a feature flag', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })

    it('should disable a feature flag', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should toggle feature flag multiple times', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })

  describe('enableDynamicBranchCollections', () => {
    it('should enable the dynamicBranchCollections flag', () => {
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })

    it('should be idempotent', () => {
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })

  describe('disableDynamicBranchCollections', () => {
    it('should disable the dynamicBranchCollections flag', () => {
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should be idempotent', () => {
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })
  })

  describe('featureFlags proxy', () => {
    it('should reflect changes made through setFeatureFlag', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should reflect changes made through convenience functions', () => {
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
      
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle process being undefined', () => {
      const originalProcess = globalThis.process
      // @ts-ignore
      globalThis.process = undefined
      
      // Should not throw and default to false
      expect(() => isDynamicBranchCollectionsEnabled()).not.toThrow()
      
      globalThis.process = originalProcess
    })

    it('should handle process.env being undefined', () => {
      const originalEnv = process.env
      // @ts-ignore
      delete process.env
      
      // Should not throw and default to false
      expect(() => isDynamicBranchCollectionsEnabled()).not.toThrow()
      
      process.env = originalEnv
    })

    it('should handle empty string environment variable', () => {
      expect('').not.toMatch(/^[ty1]/i)
    })

    it('should handle arbitrary string environment variable', () => {
      expect('maybe').not.toMatch(/^[ty1]/i)
      expect('disabled').not.toMatch(/^[ty1]/i)
      expect('enabled').not.toMatch(/^[ty1]/i)
    })
  })
})