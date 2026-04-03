import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LEANIX_MAPPING,
  getFactSheetType,
  getRelationType,
  mergeWithDefault,
  parseLeanixMappingInput,
} from './mapping'

describe('mapping', () => {
  describe('parseLeanixMappingInput', () => {
    it('returns null and undefined unchanged', () => {
      expect(parseLeanixMappingInput(null)).toBeNull()
      expect(parseLeanixMappingInput(undefined)).toBeUndefined()
    })

    it('accepts empty object', () => {
      expect(parseLeanixMappingInput({})).toEqual({})
    })

    it('rejects array and non-object root', () => {
      expect(() => parseLeanixMappingInput([])).toThrow(/plain object/)
      expect(() => parseLeanixMappingInput('x')).toThrow(/plain object/)
    })

    it('rejects unknown top-level keys', () => {
      expect(() => parseLeanixMappingInput({ extra: 1 })).toThrow(/unknown key "extra"/)
    })

    it('rejects non-string values in factSheetTypes', () => {
      expect(() => parseLeanixMappingInput({ factSheetTypes: { system: 1 as unknown as string } })).toThrow(
        /factSheetTypes/,
      )
    })

    it('rejects non-string values in relationTypes', () => {
      expect(() => parseLeanixMappingInput({ relationTypes: { someRel: 1 as unknown as string } })).toThrow(
        /relationTypes/,
      )
    })

    it('rejects non-string values in metadataToFields', () => {
      expect(() => parseLeanixMappingInput({ metadataToFields: { someKey: 1 as unknown as string } })).toThrow(
        /metadataToFields/,
      )
    })
  })

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
