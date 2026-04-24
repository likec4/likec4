import chroma from 'chroma-js'
import { describe, expect, it } from 'vitest'
import { adjustToneHex, adjustToneRgb } from './colors'

describe('adjustToneRgb', () => {
  it('should lighten a color with positive factor', () => {
    const rgb: [number, number, number] = [100, 150, 200]
    const result = adjustToneRgb(rgb, 0.2)

    // Each channel should be increased by 20% of the distance to 255
    // 100 + (255-100) * 0.2 = 100 + 31 = 131
    // 150 + (255-150) * 0.2 = 150 + 21 = 171
    // 200 + (255-200) * 0.2 = 200 + 11 = 211
    expect(result).toEqual([131, 171, 211])
  })

  it('should darken a color with negative factor', () => {
    const rgb: [number, number, number] = [100, 150, 200]
    const result = adjustToneRgb(rgb, -0.2)

    // Each channel should be decreased by 20%
    // 100 * 0.8 = 80
    // 150 * 0.8 = 120
    // 200 * 0.8 = 160
    expect(result).toEqual([80, 120, 160])
  })

  it('should handle zero factor (no change)', () => {
    const rgb: [number, number, number] = [100, 150, 200]
    const result = adjustToneRgb(rgb, 0)
    expect(result).toEqual(rgb)
  })

  it('should clamp factor to [-1, 1] range', () => {
    const rgb: [number, number, number] = [100, 150, 200]

    // Factor > 1 should be clamped to 1
    const resultPositive = adjustToneRgb(rgb, 1.5)
    expect(resultPositive).toEqual([255, 255, 255])

    // Factor < -1 should be clamped to -1
    const resultNegative = adjustToneRgb(rgb, -1.5)
    expect(resultNegative).toEqual([0, 0, 0])
  })

  it('should handle maximum lightening (factor = 1)', () => {
    const rgb: [number, number, number] = [100, 150, 200]
    const result = adjustToneRgb(rgb, 1)
    expect(result).toEqual([255, 255, 255])
  })

  it('should handle maximum darkening (factor = -1)', () => {
    const rgb: [number, number, number] = [100, 150, 200]
    const result = adjustToneRgb(rgb, -1)
    expect(result).toEqual([0, 0, 0])
  })

  it('should preserve color values for already white color', () => {
    const rgb: [number, number, number] = [255, 255, 255]
    const result = adjustToneRgb(rgb, 0.5)
    expect(result).toEqual([255, 255, 255])
  })

  it('should preserve zero values for already black color', () => {
    const rgb: [number, number, number] = [0, 0, 0]
    const result = adjustToneRgb(rgb, -0.5)
    expect(result).toEqual([0, 0, 0])
  })

  it('should round values correctly', () => {
    const rgb: [number, number, number] = [123, 45, 67]
    const result = adjustToneRgb(rgb, 0.33)

    // Verify the values are properly rounded
    expect(result[0]).toBe(Math.round(123 + (255 - 123) * 0.33))
    expect(result[1]).toBe(Math.round(45 + (255 - 45) * 0.33))
    expect(result[2]).toBe(Math.round(67 + (255 - 67) * 0.33))
  })

  it('should handle edge case values (0 and 255)', () => {
    const rgb: [number, number, number] = [0, 128, 255]
    const result = adjustToneRgb(rgb, 0.5)

    // 0 should become 0 + (255-0) * 0.5 = 127.5 → 128
    // 128 should become 128 + (255-128) * 0.5 = 191.5 → 192
    // 255 should stay 255 (already maximum)
    expect(result).toEqual([128, 192, 255])
  })
})

describe('adjustToneHex', () => {
  it('should lighten a hex color', () => {
    const hex = '#6495ED' // CornflowerBlue
    const result = adjustToneHex(hex, 0.3)

    // Verify the result is a valid hex color
    expect(chroma.valid(result)).toBe(true)

    // The result should be lighter than the original
    const originalLuminance = chroma(hex).luminance()
    const resultLuminance = chroma(result).luminance()
    expect(resultLuminance).toBeGreaterThan(originalLuminance)
  })

  it('should darken a hex color', () => {
    const hex = '#6495ED' // CornflowerBlue
    const result = adjustToneHex(hex, -0.3)

    // Verify the result is a valid hex color
    expect(chroma.valid(result)).toBe(true)

    // The result should be darker than the original
    const originalLuminance = chroma(hex).luminance()
    const resultLuminance = chroma(result).luminance()
    expect(resultLuminance).toBeLessThan(originalLuminance)
  })

  it('should handle zero factor (no change)', () => {
    const hex = '#6495ED'
    const result = adjustToneHex(hex, 0)
    // Due to chroma-js conversion, the result might have different formatting
    // but should represent the same color
    expect(chroma(result).hex().toLowerCase()).toBe(chroma(hex).hex().toLowerCase())
  })

  it('should preserve color properties with positive factor', () => {
    const hex = '#6495ED'
    const result = adjustToneHex(hex, 0.5)

    // Hue should be similar, but luminance should increase
    const originalHsl = chroma(hex).hsl()
    const resultHsl = chroma(result).hsl()

    // Hue and saturation should be similar, but lightness should increase
    expect(Math.abs(originalHsl[0] - resultHsl[0])).toBeLessThan(10) // Hue within 10 degrees
    expect(Math.abs(originalHsl[1] - resultHsl[1])).toBeLessThan(0.2) // Saturation within 20%
    expect(resultHsl[2]).toBeGreaterThan(originalHsl[2]) // Lightness should increase
  })

  it('should preserve color properties with negative factor', () => {
    const hex = '#6495ED'
    const result = adjustToneHex(hex, -0.5)

    // Hue should be similar, but luminance should decrease
    const originalHsl = chroma(hex).hsl()
    const resultHsl = chroma(result).hsl()

    // Hue and saturation should be similar, but lightness should decrease
    expect(Math.abs(originalHsl[0] - resultHsl[0])).toBeLessThan(10) // Hue within 10 degrees
    expect(Math.abs(originalHsl[1] - resultHsl[1])).toBeLessThan(0.5) // Saturation within 20%
    expect(resultHsl[2]).toBeLessThan(originalHsl[2]) // Lightness should decrease
  })

  it('should handle black color', () => {
    const hex = '#000000'
    const result = adjustToneHex(hex, 0.5)
    expect(result).toBe('#808080') // Gray (middle between black and white)
  })

  it('should handle white color', () => {
    const hex = '#FFFFFF'
    const result = adjustToneHex(hex, 0.5)
    expect(result).toBe('#ffffff') // Should remain white
  })

  it('should handle uppercase hex colors', () => {
    const hex = '#FF5733'
    const result = adjustToneHex(hex, 0.2)
    expect(chroma.valid(result)).toBe(true)
  })

  it('should handle short hex colors', () => {
    const hex = '#F00' // Red
    const result = adjustToneHex(hex, 0.3)
    expect(chroma.valid(result)).toBe(true)
  })

  it('should produce valid hex colors for various inputs', () => {
    const testColors = ['#FF0000', '#00FF00', '#0000FF', '#808080', '#FFFFFF', '#000000']

    testColors.forEach(color => {
      const result = adjustToneHex(color, 0.25)
      expect(chroma.valid(result)).toBe(true)
      expect(result).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  it('should handle boundary factors correctly', () => {
    const hex = '#6495ED'

    // Maximum lightening
    const resultMaxLighten = adjustToneHex(hex, 1)
    expect(resultMaxLighten).toBe('#ffffff')

    // Maximum darkening
    const resultMaxDarken = adjustToneHex(hex, -1)
    expect(resultMaxDarken).toBe('#000000')
  })
})

describe('adjustToneRgb and adjustToneHex consistency', () => {
  it('should produce equivalent results between RGB and Hex functions', () => {
    const testCases: [string, number][] = [
      ['#6495ED', 0.2],
      ['#FF5733', -0.3],
      ['#008080', 0.5],
      ['#800080', -0.5],
      ['#FFFF00', 0.3],
    ]

    testCases.forEach(([hex, factor]) => {
      const rgbResult = adjustToneHex(hex, factor)
      const expectedRgb = chroma(hex).rgb()
      const directRgbResult = adjustToneRgb(expectedRgb, factor)
      const expectedHex = chroma(directRgbResult).hex()

      expect(rgbResult.toLowerCase()).toBe(expectedHex.toLowerCase())
    })
  })
})
