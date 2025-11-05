import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  disableDynamicBranchCollections,
  enableDynamicBranchCollections,
  featureFlags,
  isDynamicBranchCollectionsEnabled,
  isFeatureEnabled,
  setFeatureFlag,
} from '../featureFlags'

describe('featureFlags', () => {
  describe('initialization', () => {
    it('should initialize with false by default when no env vars are set', () => {
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should be accessible via isFeatureEnabled', () => {
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
    })

    it('should be accessible via isDynamicBranchCollectionsEnabled', () => {
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })
  })

  describe('setFeatureFlag', () => {
    afterEach(() => {
      // Reset to default state
      setFeatureFlag('dynamicBranchCollections', false)
    })

    it('should enable a feature flag', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should disable a feature flag', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should allow toggling multiple times', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)

      setFeatureFlag('dynamicBranchCollections', false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)

      setFeatureFlag('dynamicBranchCollections', true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })
  })

  describe('enableDynamicBranchCollections', () => {
    afterEach(() => {
      disableDynamicBranchCollections()
    })

    it('should enable the dynamicBranchCollections flag', () => {
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should be idempotent', () => {
      enableDynamicBranchCollections()
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })

  describe('disableDynamicBranchCollections', () => {
    beforeEach(() => {
      enableDynamicBranchCollections()
    })

    it('should disable the dynamicBranchCollections flag', () => {
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should be idempotent', () => {
      disableDynamicBranchCollections()
      disableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })
  })

  describe('Proxy behavior', () => {
    afterEach(() => {
      setFeatureFlag('dynamicBranchCollections', false)
    })

    it('should reflect changes through the proxy', () => {
      expect(featureFlags.dynamicBranchCollections).toBe(false)
      
      setFeatureFlag('dynamicBranchCollections', true)
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      
      setFeatureFlag('dynamicBranchCollections', false)
      expect(featureFlags.dynamicBranchCollections).toBe(false)
    })

    it('should return consistent values across different access methods', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      
      expect(featureFlags.dynamicBranchCollections).toBe(true)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })
  })

  describe('edge cases', () => {
    afterEach(() => {
      setFeatureFlag('dynamicBranchCollections', false)
    })

    it('should handle rapid toggles', () => {
      for (let i = 0; i < 10; i++) {
        setFeatureFlag('dynamicBranchCollections', i % 2 === 0)
        expect(featureFlags.dynamicBranchCollections).toBe(i % 2 === 0)
      }
    })

    it('should maintain state independently of reads', () => {
      setFeatureFlag('dynamicBranchCollections', true)
      
      // Multiple reads shouldn't affect state
      isDynamicBranchCollectionsEnabled()
      isFeatureEnabled('dynamicBranchCollections')
      featureFlags.dynamicBranchCollections
      
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })
})