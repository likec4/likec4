import chroma from 'chroma-js'
import { describe, expect, it } from 'vitest'
import { computeCompoundColorValues } from './compute-compound-colors'
import type { ElementColorValues, HexColor } from './types'

describe('computeCompoundColorValues', () => {
  describe('should generate color variations', () => {
    it('should return exactly 6 element color values by default', () => {
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

    it('should support custom depth parameter', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result3 = computeCompoundColorValues(input, 3)
      const result10 = computeCompoundColorValues(input, 10)

      expect(result3).toHaveLength(3)
      expect(result10).toHaveLength(10)
    })
  })

  describe('should create gradient for light colors', () => {
    it('should darken colors with high luminance (>0.8)', () => {
      const input: ElementColorValues = {
        fill: '#F0F0F0',
        stroke: '#E0E0E0',
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)

      const fillLuminances = result.map(c => chroma(c.fill).luminance())
      const strokeLuminances = result.map(c => chroma(c.stroke).luminance())

      expect(fillLuminances[0]!).toBeGreaterThan(fillLuminances[5]!)
      expect(strokeLuminances[0]!).toBeGreaterThan(strokeLuminances[5]!)
    })

    it('should create smooth gradient for white colors', () => {
      const input: ElementColorValues = {
        fill: '#FFFFFF',
        stroke: '#F5F5F5',
        hiContrast: '#000000',
        loContrast: '#333333',
      }

      const result = computeCompoundColorValues(input)
      const fillLuminances = result.map(c => chroma(c.fill).luminance())

      expect(fillLuminances[0]!).toBeGreaterThan(fillLuminances[5]!)
      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]!).toBeLessThanOrEqual(fillLuminances[i - 1]!)
      }
    })
  })

  describe('should create gradient for dark colors', () => {
    it('should shade colors with low luminance (<=0.8)', () => {
      const input: ElementColorValues = {
        fill: '#1E40AF',
        stroke: '#1E3A8A',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      const fillLuminances = result.map(c => chroma(c.fill).luminance())
      const strokeLuminances = result.map(c => chroma(c.stroke).luminance())

      expect(fillLuminances[0]!).toBeGreaterThan(fillLuminances[5]!)
      expect(strokeLuminances[0]!).toBeGreaterThan(strokeLuminances[5]!)
    })

    it('should create smooth gradient for dark colors', () => {
      const input: ElementColorValues = {
        fill: '#1E3A8A',
        stroke: '#1E293B',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)
      const fillLuminances = result.map(c => chroma(c.fill).luminance())

      expect(fillLuminances[0]!).toBeGreaterThan(fillLuminances[5]!)
      for (let i = 1; i < fillLuminances.length; i++) {
        expect(fillLuminances[i]!).toBeLessThanOrEqual(fillLuminances[i - 1]!)
      }
    })
  })

  describe('should handle boundary luminance values', () => {
    it('should shade color at or below 0.8 luminance', () => {
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
      expect(fillLuminances[0]!).toBeGreaterThan(fillLuminances[5]!)
    })
  })

  describe('should create perceptually uniform gradients', () => {
    it('should use oklch color space for smooth transitions', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)
      const fillLuminances = result.map(c => chroma(c.fill).luminance())

      const diffs: number[] = []
      for (let i = 1; i < fillLuminances.length; i++) {
        diffs.push(Math.abs(fillLuminances[i]! - fillLuminances[i - 1]!))
      }

      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
      const variance = diffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / diffs.length

      expect(variance).toBeLessThan(0.01)
    })

    it('should create distinct color variations', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      const uniqueFills = new Set(result.map(c => c.fill))
      const uniqueStrokes = new Set(result.map(c => c.stroke))

      expect(uniqueFills.size).toBe(6)
      expect(uniqueStrokes.size).toBe(6)
    })
  })

  describe('should preserve base properties', () => {
    it('should preserve hiContrast and loContrast from base', () => {
      const input: ElementColorValues = {
        fill: '#3B82F6',
        stroke: '#2563EB',
        hiContrast: '#FFFFFF',
        loContrast: '#E0E0E0',
      }

      const result = computeCompoundColorValues(input)

      result.forEach(colors => {
        expect(colors.hiContrast).toBe(input.hiContrast)
        expect(colors.loContrast).toBe(input.loContrast)
      })
    })

    it('should maintain stroke generally darker than fill', () => {
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
        expect(strokeLum).toBeLessThanOrEqual(fillLum + 0.05)
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

    it('should handle very saturated colors', () => {
      const input: ElementColorValues = {
        fill: '#FF0000',
        stroke: '#CC0000',
        hiContrast: '#FFFFFF',
        loContrast: '#FFE0E0',
      }

      const result = computeCompoundColorValues(input)

      expect(result).toHaveLength(6)
      result.forEach(colors => {
        expect(chroma.valid(colors.fill)).toBe(true)
        expect(chroma.valid(colors.stroke)).toBe(true)
        expect(colors.hiContrast).toBe(input.hiContrast)
        expect(colors.loContrast).toBe(input.loContrast)
      })
    })
  })
})
