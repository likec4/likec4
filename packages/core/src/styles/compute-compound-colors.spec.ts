import chroma from 'chroma-js'
import { describe, expect, it } from 'vitest'
import { computeCompoundColorValues } from './compute-compound-colors'
import type { ElementColorValues, HexColor } from './types'

describe('computeCompoundColorValues', () => {
  describe('should generate 6 color variations', () => {
    it('should return exactly 6 element color values', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      result.forEach(colors => {
        expect(colors).toHaveProperty('fill')
        expect(colors).toHaveProperty('stroke')
        expect(colors).toHaveProperty('hiContrast')
        expect(colors).toHaveProperty('loContrast')
      })
    })
  })

  describe('should darken light colors', () => {
    it('should progressively darken colors with high luminance (>0.75)', () => {
      const input: ElementColorValues = {
        fill: '#F0F0F0',
        stroke: '#E0E0E0',
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)

      const fillLuminances = result.map(c => chroma(c.fill).luminance())
      const strokeLuminances = result.map(c => chroma(c.stroke).luminance())

      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]).toBeLessThanOrEqual(fillLuminances[i - 1]!)
        expect(strokeLuminances[i]).toBeLessThanOrEqual(strokeLuminances[i - 1]!)
      }
      expect(fillLuminances[0]).toBeGreaterThan(fillLuminances[5]!)
    })

    it('should darken white colors', () => {
      const input: ElementColorValues = {
        fill: '#FFFFFF',
        stroke: '#F5F5F5',
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)

      expect(chroma(result[0].fill).luminance()).toBeLessThan(chroma(input.fill).luminance())
      expect(chroma(result[5].fill).luminance()).toBeLessThan(chroma(result[0].fill).luminance())
    })
  })

  describe('should brighten dark colors', () => {
    it('should progressively brighten colors with low luminance (<=0.75)', () => {
      const input: ElementColorValues = {
        fill: '#1E40AF',
        stroke: '#1E3A8A',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      const fillLuminances = result.map(c => chroma(c.fill).luminance())
      const strokeLuminances = result.map(c => chroma(c.stroke).luminance())

      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]).toBeGreaterThanOrEqual(fillLuminances[i - 1]!)
        expect(strokeLuminances[i]).toBeGreaterThanOrEqual(strokeLuminances[i - 1]!)
      }
      expect(fillLuminances[5]).toBeGreaterThan(fillLuminances[0]!)
    })

    it('should brighten black colors', () => {
      const input: ElementColorValues = {
        fill: '#000000',
        stroke: '#0A0A0A',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(chroma(result[0].fill).luminance()).toBeGreaterThan(chroma(input.fill).luminance())
      expect(chroma(result[5].fill).luminance()).toBeGreaterThan(chroma(result[0].fill).luminance())
    })
  })

  describe('should handle boundary luminance values', () => {
    it('should brighten color at exactly 0.8 luminance', () => {
      const mediumGray = chroma.hsl(0, 0, 0.88)
      const input: ElementColorValues = {
        fill: mediumGray.hex() as HexColor,
        stroke: mediumGray.darken(0.2).hex() as HexColor,
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)
      const fillLuminances = result.map(c => chroma(c.fill).luminance())

      expect(chroma(input.fill).luminance()).toBeLessThanOrEqual(0.8)
      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]).toBeGreaterThanOrEqual(fillLuminances[i - 1]!)
      }
    })
  })

  describe('should maintain color relationships', () => {
    it('should keep stroke darker than fill for each variation', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      result.forEach(colors => {
        const fillLum = chroma(colors.fill).luminance()
        const strokeLum = chroma(colors.stroke).luminance()
        expect(strokeLum).toBeLessThanOrEqual(fillLum)
      })
    })
  })

  describe('should handle various color formats', () => {
    it('should work with blue colors', () => {
      const input: ElementColorValues = {
        fill: '#0000FF',
        stroke: '#0000CC',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      result.forEach(colors => {
        expect(chroma.valid(colors.fill)).toBe(true)
        expect(chroma.valid(colors.stroke)).toBe(true)
      })
    })

    it('should work with red colors', () => {
      const input: ElementColorValues = {
        fill: '#FF0000',
        stroke: '#CC0000',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      result.forEach(colors => {
        expect(chroma.valid(colors.fill)).toBe(true)
        expect(chroma.valid(colors.stroke)).toBe(true)
      })
    })

    it('should work with green colors', () => {
      const input: ElementColorValues = {
        fill: '#00FF00',
        stroke: '#00CC00',
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      result.forEach(colors => {
        expect(chroma.valid(colors.fill)).toBe(true)
        expect(chroma.valid(colors.stroke)).toBe(true)
      })
    })
  })

  describe('should handle edge cases', () => {
    it('should handle colors with medium luminance', () => {
      const input: ElementColorValues = {
        fill: '#808080',
        stroke: '#666666',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      const fillLuminances = result.map(c => chroma(c.fill).luminance())

      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]).toBeGreaterThanOrEqual(fillLuminances[i - 1]!)
      }
      expect(fillLuminances[5]).toBeGreaterThan(fillLuminances[0]!)
    })

    it('should produce valid hex colors for all variations', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      result.forEach(colors => {
        expect(colors.fill).toMatch(/^#[0-9A-F]{6}$/i)
        expect(colors.stroke).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })
  })
})
