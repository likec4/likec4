import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LEANIX_MAPPING,
  getFactSheetType,
  getRelationType,
  mergeWithDefault,
} from './mapping'

describe('mapping', () => {
  describe('mergeWithDefault', () => {
    it('returns copy of default when partial is null/undefined', () => {
      const a = mergeWithDefault(null)
      const b = mergeWithDefault(undefined)
      expect(a).toEqual(DEFAULT_LEANIX_MAPPING)
      expect(b).toEqual(DEFAULT_LEANIX_MAPPING)
      expect(a).not.toBe(DEFAULT_LEANIX_MAPPING)
    })

    it('merges partial over defaults without mutating default', () => {
      const result = mergeWithDefault({
        factSheetTypes: { system: 'CustomApp' },
      })
      expect(result.factSheetTypes['system']).toBe('CustomApp')
      expect(result.factSheetTypes['container']).toBe('ITComponent')
      expect(DEFAULT_LEANIX_MAPPING.factSheetTypes['system']).toBe('Application')
    })
  })

  describe('getFactSheetType', () => {
    const mapping = mergeWithDefault(null)

    it('returns mapped type for known kind', () => {
      expect(getFactSheetType('system', mapping)).toBe('Application')
      expect(getFactSheetType('actor', mapping)).toBe('Provider')
    })

    it('returns Application for unknown kind when default not in mapping', () => {
      expect(getFactSheetType('unknownKind', mapping)).toBe('Application')
    })
  })

  describe('getRelationType', () => {
    const mapping = mergeWithDefault(null)

    it('returns mapped type for known kind', () => {
      expect(getRelationType('default', mapping)).toBe('depends on')
    })

    it('returns depends on for null/unknown kind', () => {
      expect(getRelationType(null, mapping)).toBe('depends on')
      expect(getRelationType('unknown', mapping)).toBe('depends on')
    })
  })
})
