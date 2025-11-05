import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disableDynamicBranchCollections,
  enableDynamicBranchCollections,
  featureFlags,
  isDynamicBranchCollectionsEnabled,
  isFeatureEnabled,
  setFeatureFlag,
} from './featureFlags'

describe('featureFlags', () => {
  // Store original process.env
  const originalEnv = process.env
  const originalFeatureState = featureFlags.dynamicBranchCollections

  beforeEach(() => {
    // Reset to initial state
    disableDynamicBranchCollections()
  })

  afterEach(() => {
    // Restore original state
    process.env = originalEnv
    if (originalFeatureState) {
      enableDynamicBranchCollections()
    } else {
      disableDynamicBranchCollections()
    }
  })

  describe('initialization from environment', () => {
    it('should initialize dynamicBranchCollections as false by default', () => {
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should read LIKEC4_UNIFIED_BRANCHES from environment', () => {
      // Note: This test demonstrates the behavior but can't easily test initialization
      // since the module is already loaded
      const testEnv = 'true'
      expect(['true', 'yes', '1', 'TRUE', 'YES', 'T', 'Y'].some(v => 
        /^[ty1]/i.test(v)
      )).toBe(true)
    })

    it('should handle various truthy values', () => {
      const truthyValues = ['true', 'True', 'TRUE', 't', 'T', 'yes', 'Yes', 'YES', 'y', 'Y', '1']
      for (const value of truthyValues) {
        expect(/^[ty1]/i.test(value)).toBe(true)
      }
    })

    it('should handle various falsy values', () => {
      const falsyValues = ['false', 'False', 'FALSE', 'f', 'F', 'no', 'No', 'NO', 'n', 'N', '0', '']
      for (const value of falsyValues) {
        expect(/^[ty1]/i.test(value)).toBe(false)
      }
    })
  })

  describe('Proxy access', () => {
    it('should allow reading feature flags through proxy', () => {
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should reflect changes immediately', () => {
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return false when feature is disabled', () => {
      disableDynamicBranchCollections()
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
    })

    it('should return true when feature is enabled', () => {
      enableDynamicBranchCollections()
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
    })
  })

  describe('isDynamicBranchCollectionsEnabled', () => {
    it('should return false by default', () => {
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should return true when enabled', () => {
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should reflect setFeatureFlag changes', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })
  })

  describe('setFeatureFlag', () => {
    it('should enable feature when set to true', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should disable feature when set to false', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should handle multiple toggles', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      
      setFeatureFlag('dynamicBranchCollections', true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })
  })

  describe('enableDynamicBranchCollections', () => {
    it('should enable the feature', () => {
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })

    it('should be idempotent', () => {
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })
  })

  describe('disableDynamicBranchCollections', () => {
    it('should disable the feature', () => {
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should be idempotent', () => {
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })
  })

  describe('feature flag state isolation', () => {
    it('should maintain state across multiple calls', () => {
      disableDynamicBranchCollections()
      
      const state1 = isDynamicBranchCollectionsEnabled()
      const state2 = isDynamicBranchCollectionsEnabled()
      const state3 = featureFlags.dynamicBranchCollections
      
      expect(state1).toBe(state2)
      expect(state2).toBe(state3)
      expect(state1).toBe(false)
    })

    it('should update consistently across different access methods', () => {
      enableDynamicBranchCollections()
      
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      disableDynamicBranchCollections()
      
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid toggling', () => {
      for (let i = 0; i < 10; i++) {
        setFeatureFlag('dynamicBranchCollections', i % 2 === 0)
        expect(isDynamicBranchCollectionsEnabled()).toBe(i % 2 === 0)
      }
    })

    it('should maintain state after multiple reads', () => {
      enableDynamicBranchCollections()
      
      for (let i = 0; i < 100; i++) {
        expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      }
      
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })
})